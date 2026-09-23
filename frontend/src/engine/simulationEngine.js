// ═══════════════════════════════════════════════════════════
// ENGINE MÔ PHỎNG — thuần JS, không phụ thuộc React
// Chạy vòng lặp requestAnimationFrame để cập nhật vị trí xe
// ═══════════════════════════════════════════════════════════
import * as turf from "@turf/turf";
import { parseTimeToSec } from "@/utils/timeUtils";

// Hằng số cấu hình
const MIN_DWELL_SEC = 15; // Thời gian dừng trạm tối thiểu (giây)
const AVG_SPEED_MPS = 5.5; // Vận tốc trung bình ~20 km/h (m/s)
const STEP = 1 / 60; // Bước thời gian cố định (60 bước/giây)

class SimulationEngine {
  constructor() {
    this.buses = []; // Danh sách 30 xe
    this.simData = null; // Dữ liệu mô phỏng từ API
    this.routePoints = []; // Mảng điểm trên tuyến kèm khoảng cách tích lũy
    this.stopDistCache = []; // Khoảng cách của mỗi trạm trên tuyến
    this.totalDist = 0; // Tổng chiều dài tuyến (km)
    this.globalElapsed = 0; // Thời gian mô phỏng toàn cục (giây)
    this.timeAccel = 10; // Hệ số tăng tốc
    this.isRunning = false;
    this.accumulator = 0;
    this.lastFrameTime = 0;
    this.rafId = null;
    this.listeners = new Set(); // Các callback được gọi mỗi tick
  }

  // ─── NẠP DỮ LIỆU ──────────────────────────────────
  loadData(simData) {
    this.stop();
    this.simData = simData;
    this.normalizeStops(simData.stops);
    this.buildRoutePoints(simData.route_geometry.coordinates);
    this.buildStopDistCache();
    this.initBuses();
    this.globalElapsed = 0;
  }

  /**
   * Chuẩn hóa dữ liệu trạm: đảm bảo mỗi trạm có thời gian dừng tối thiểu
   * và thời gian di chuyển giữa các trạm dựa trên khoảng cách thực tế
   */
  normalizeStops(stops) {
    stops.sort((a, b) => a.stop_sequence - b.stop_sequence);
    for (let i = 0; i < stops.length; i++) {
      const cur = stops[i];
      // Đảm bảo dừng tối thiểu MIN_DWELL_SEC
      if (
        cur.departure_offset_seconds <
        cur.arrival_offset_seconds + MIN_DWELL_SEC
      ) {
        cur.departure_offset_seconds =
          cur.arrival_offset_seconds + MIN_DWELL_SEC;
      }
      // Tính thời gian di chuyển đến trạm kế tiếp
      if (i < stops.length - 1) {
        const next = stops[i + 1];
        const distKm = turf.distance(
          [cur.longitude, cur.latitude],
          [next.longitude, next.latitude],
          { units: "kilometers" },
        );
        const travelSec = Math.max(
          10,
          Math.round((distKm * 1000) / AVG_SPEED_MPS),
        );
        next.arrival_offset_seconds = cur.departure_offset_seconds + travelSec;
      }
    }
  }

  /**
   * Chuyển mảng tọa độ [[lng,lat],...] thành mảng điểm kèm khoảng cách tích lũy
   */
  buildRoutePoints(coords) {
    this.routePoints = [];
    let dist = 0;
    this.routePoints.push({ dist: 0, lat: coords[0][1], lng: coords[0][0] });
    for (let i = 1; i < coords.length; i++) {
      const [lng1, lat1] = coords[i - 1];
      const [lng2, lat2] = coords[i];
      const d = turf.distance([lng1, lat1], [lng2, lat2], {
        units: "kilometers",
      });
      dist += d;
      this.routePoints.push({ dist, lat: lat2, lng: lng2 });
    }
    this.totalDist = dist;
  }

  /**
   * Với mỗi trạm, tìm điểm gần nhất trên tuyến → lưu khoảng cách tích lũy
   */
  buildStopDistCache() {
    this.stopDistCache = this.simData.stops.map((s) => {
      let minDist = Infinity;
      let bestDist = 0;
      for (const p of this.routePoints) {
        const d = turf.distance([s.longitude, s.latitude], [p.lng, p.lat], {
          units: "kilometers",
        });
        if (d < minDist) {
          minDist = d;
          bestDist = p.dist;
        }
      }
      return bestDist;
    });
    // Đảm bảo khoảng cách tăng dần (tránh 2 trạm trùng)
    for (let i = 1; i < this.stopDistCache.length; i++) {
      if (this.stopDistCache[i] <= this.stopDistCache[i - 1]) {
        this.stopDistCache[i] = this.stopDistCache[i - 1] + 0.01;
      }
    }
  }

  /**
   * Khởi tạo 30 xe bus với trạng thái chờ
   */
  initBuses() {
    const base = parseTimeToSec(this.simData.trips[0].start_time);
    const firstStop = this.simData.stops[0];
    this.buses = this.simData.trips.map((trip, i) => ({
      trip_id: trip.trip_id,
      headsign: trip.headsign,
      index: i,
      startOffset: parseTimeToSec(trip.start_time) - base,
      startTime: trip.start_time,
      status: "waiting",
      curStop: 0,
      latlng: [firstStop.latitude, firstStop.longitude],
      isDwelling: false,
      dwellEndTime: -1,
      prevStatus: "waiting",
    }));
  }

  // ─── TOÁN HỌC VỊ TRÍ ─────────────────────────────
  /**
   * Tìm tọa độ điểm trên tuyến tại khoảng cách `dist` (km)
   * Dùng tìm kiếm nhị phân + nội suy tuyến tính — rất nhanh
   */
  getPointAtDistance(dist) {
    const pts = this.routePoints;
    let lo = 0;
    let hi = pts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (pts[mid].dist < dist) lo = mid + 1;
      else hi = mid;
    }
    const idx = Math.min(lo, pts.length - 1);
    if (Math.abs(pts[idx].dist - dist) < 1e-9) {
      return { lat: pts[idx].lat, lng: pts[idx].lng };
    }
    const p0 = pts[idx - 1];
    const p1 = pts[idx];
    if (!p0) return { lat: p1.lat, lng: p1.lng };
    const t = (dist - p0.dist) / (p1.dist - p0.dist);
    return {
      lat: p0.lat + (p1.lat - p0.lat) * t,
      lng: p0.lng + (p1.lng - p0.lng) * t,
    };
  }

  /**
   * Lấy vị trí của 1 xe tại thời điểm `te` (giây kể từ lúc xuất bến)
   */
  getPositionAtTime(te) {
    const stops = this.simData.stops;
    if (te <= 0) {
      return {
        latlng: [stops[0].latitude, stops[0].longitude],
        idx: 0,
        dwell: true,
      };
    }
    const eps = 1e-6;
    for (let i = 0; i < stops.length - 1; i++) {
      const cur = stops[i];
      const nxt = stops[i + 1];

      // Đang dừng tại trạm cur
      if (
        te >= cur.arrival_offset_seconds - eps &&
        te < cur.departure_offset_seconds + eps
      ) {
        return { latlng: [cur.latitude, cur.longitude], idx: i, dwell: true };
      }
      // Đang di chuyển cur → nxt
      if (
        te >= cur.departure_offset_seconds - eps &&
        te < nxt.arrival_offset_seconds + eps
      ) {
        const travelTime =
          nxt.arrival_offset_seconds - cur.departure_offset_seconds;
        if (travelTime <= 0) {
          return {
            latlng: [nxt.latitude, nxt.longitude],
            idx: i + 1,
            dwell: false,
          };
        }
        const seg = Math.min(
          Math.max((te - cur.departure_offset_seconds) / travelTime, 0),
          1,
        );
        const dKm =
          this.stopDistCache[i] +
          (this.stopDistCache[i + 1] - this.stopDistCache[i]) * seg;
        const pt = this.getPointAtDistance(Math.min(dKm, this.totalDist));
        return { latlng: [pt.lat, pt.lng], idx: i, dwell: false };
      }
    }
    const last = stops[stops.length - 1];
    return {
      latlng: [last.latitude, last.longitude],
      idx: stops.length - 1,
      dwell: true,
    };
  }

  // ─── CẬP NHẬT XE ─────────────────────────────────
  /**
   * Thời gian chuyến này đã chạy (giây kể từ lúc xuất bến của nó)
   */
  tripElapsed(bus) {
    return this.globalElapsed - bus.startOffset;
  }

  /**
   * Cập nhật trạng thái 1 xe dựa trên thời gian mô phỏng
   */
  updateBus(bus) {
    const te = this.tripElapsed(bus);
    const stops = this.simData.stops;
    const lastArr = stops[stops.length - 1].arrival_offset_seconds;

    // Chưa đến giờ xuất bến
    if (te < 0) {
      bus.status = "waiting";
      bus.latlng = [stops[0].latitude, stops[0].longitude];
      bus.curStop = 0;
      bus.isDwelling = false;
      bus.dwellEndTime = -1;
      return;
    }
    // Đã hoàn thành chuyến
    if (te >= lastArr) {
      bus.status = "done";
      bus.latlng = [
        stops[stops.length - 1].latitude,
        stops[stops.length - 1].longitude,
      ];
      bus.curStop = stops.length - 1;
      bus.isDwelling = false;
      bus.dwellEndTime = -1;
      return;
    }
    // Đang dừng tại trạm, chưa hết thời gian dừng
    if (bus.isDwelling && te < bus.dwellEndTime) return;
    // Vừa hết thời gian dừng
    if (bus.isDwelling && te >= bus.dwellEndTime) {
      bus.isDwelling = false;
      bus.dwellEndTime = -1;
    }

    const pos = this.getPositionAtTime(te);
    bus.latlng = pos.latlng;
    bus.curStop = pos.idx;
    bus.status = pos.dwell ? "stopped" : "running";

    if (pos.dwell) {
      bus.isDwelling = true;
      bus.dwellEndTime =
        stops[pos.idx].departure_offset_seconds + bus.startOffset;
    }
  }

  /**
   * Lấy tên trạm hiện tại của 1 xe
   */
  currentStopName(bus) {
    const s = this.simData?.stops[bus.curStop];
    return s ? s.stop_name : "";
  }

  /**
   * Kiểm tra tất cả xe đã hoàn thành chưa
   */
  allDone() {
    return (
      this.buses.length > 0 && this.buses.every((b) => b.status === "done")
    );
  }

  // ─── VÒNG LẶP MÔ PHỎNG ───────────────────────────
  /**
   * Bắt đầu mô phỏng
   */
  start(timeAccel) {
    if (this.isRunning || !this.simData) return;
    this.timeAccel = timeAccel;
    this.isRunning = true;
    this.globalElapsed = 0;
    this.accumulator = 0;
    this.lastFrameTime = performance.now();

    // Reset tất cả xe về trạng thái chờ
    const firstStop = this.simData.stops[0];
    for (const b of this.buses) {
      b.status = "waiting";
      b.curStop = 0;
      b.isDwelling = false;
      b.dwellEndTime = -1;
      b.latlng = [firstStop.latitude, firstStop.longitude];
    }
    this.rafId = requestAnimationFrame(this.loop);
  }

  /**
   * Dừng mô phỏng
   */
  stop() {
    this.isRunning = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = null;
  }

  /**
   * Vòng lặp chính — dùng fixed timestep để đảm bảo chuyển động mượt
   */
  loop = (now) => {
    if (!this.isRunning) return;
    const dt = Math.min((now - this.lastFrameTime) / 1000, 0.05);
    this.lastFrameTime = now;
    this.accumulator += dt * this.timeAccel;

    // Chạy nhiều bước cố định cho đến khi hết accumulator
    while (this.accumulator >= STEP) {
      this.globalElapsed += STEP;
      this.accumulator -= STEP;
      for (const b of this.buses) this.updateBus(b);
    }

    this.emit(); // Thông báo cho UI
    this.rafId = requestAnimationFrame(this.loop);
  };

  setTimeAccel(v) {
    this.timeAccel = v;
  }

  /**
   * Đăng ký callback mỗi tick — trả về hàm huỷ đăng ký
   */
  onTick(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  emit() {
    for (const fn of this.listeners) fn(this);
  }
}

// Singleton — dùng chung toàn app
export const engine = new SimulationEngine();
