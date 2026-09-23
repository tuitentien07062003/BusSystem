// Context quản lý state mô phỏng + cầu nối giữa Engine và React
import { createContext, useEffect, useState, useCallback, useRef } from "react";
import { engine } from "@/engine/simulationEngine";
import { formatClock } from "@/utils/timeUtils";

export const SimulationContext = createContext(null);

export function SimulationProvider({ children }) {
  // ─── State hiển thị trên UI ───
  const [currentDir, setCurrentDirState] = useState("go");
  const [simData, setSimData] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [timeAccel, setTimeAccelState] = useState(10);
  const [clockText, setClockText] = useState("--:--:--");
  const [stats, setStats] = useState({ running: 0, stopped: 0, waiting: 0 });
  const [busList, setBusList] = useState([]);
  const [trackedBusId, setTrackedBusId] = useState(null);

  // ─── Refs để tránh re-render không cần thiết ───
  const lastStatTime = useRef(0);
  const lastListTime = useRef(0);

  // ─── Hàm đồng bộ stats từ engine ───
  const syncStats = useCallback(() => {
    let r = 0,
      s = 0,
      w = 0;
    for (const b of engine.buses) {
      if (b.status === "running") r++;
      else if (b.status === "stopped") s++;
      else w++;
    }
    setStats({ running: r, stopped: s, waiting: w });
  }, []);

  // ─── Hàm đồng bộ đồng hồ ───
  const syncClock = useCallback(() => {
    const first = engine.buses.find(
      (b) => b.status === "running" || b.status === "stopped",
    );
    if (first) {
      setClockText(formatClock(first.startTime, engine.tripElapsed(first)));
    } else if (engine.buses.length > 0) {
      setClockText(formatClock(engine.buses[0].startTime, 0));
    }
  }, []);

  // ─── Hàm đồng bộ danh sách xe ───
  const syncBusList = useCallback(() => {
    const list = engine.buses.map((b) => {
      const te = engine.tripElapsed(b);
      const timeStr =
        te < 0
          ? `chờ ${Math.ceil(-te / 60)}ph`
          : b.status === "done"
            ? "Xong"
            : `+${Math.floor(Math.max(0, te) / 60)}ph`;
      return {
        trip_id: b.trip_id,
        status: b.status,
        startTime: b.startTime,
        stopName: engine.currentStopName(b),
        timeStr,
      };
    });
    setBusList(list);
  }, []);

  // ─── Đăng ký engine.onTick 1 lần ───
  useEffect(() => {
    const unsubscribe = engine.onTick(() => {
      const now = performance.now();
      // Cập nhật stats + đồng hồ mỗi 100ms
      if (now - lastStatTime.current > 100) {
        syncStats();
        syncClock();
        lastStatTime.current = now;
      }
      // Cập nhật danh sách xe mỗi 1.5s
      if (now - lastListTime.current > 1500) {
        syncBusList();
        lastListTime.current = now;
      }
      // Kiểm tra hoàn thành
      if (engine.allDone() && engine.isRunning) {
        engine.stop();
        setIsSimulating(false);
        setClockText("🏁 Hoàn tất");
      }
    });
    return unsubscribe;
  }, [syncStats, syncClock, syncBusList]);

  // ─── Các hàm điều khiển ───

  /**
   * Nạp dữ liệu mô phỏng vào engine và state
   */
  const loadData = useCallback(
    (data) => {
      engine.loadData(data);
      setSimData(data);
      setClockText("--:--:--");
      syncStats();
      syncBusList();
    },
    [syncStats, syncBusList],
  );

  /**
   * Bắt đầu mô phỏng
   */
  const start = useCallback(() => {
    if (!engine.simData || engine.isRunning) return;
    engine.start(timeAccel);
    setIsSimulating(true);
    syncStats();
    syncBusList();
  }, [timeAccel, syncStats, syncBusList]);

  /**
   * Reset về trạng thái ban đầu
   */
  const reset = useCallback(() => {
    engine.stop();
    engine.globalElapsed = 0;
    if (engine.simData) {
      const firstStop = engine.simData.stops[0];
      for (const b of engine.buses) {
        b.status = "waiting";
        b.curStop = 0;
        b.isDwelling = false;
        b.dwellEndTime = -1;
        b.latlng = [firstStop.latitude, firstStop.longitude];
      }
    }
    setIsSimulating(false);
    setTrackedBusId(null);
    setClockText("--:--:--");
    syncStats();
    syncBusList();
  }, [syncStats, syncBusList]);

  /**
   * Đổi tốc độ mô phỏng
   */
  const setTimeAccel = useCallback((v) => {
    const val = parseInt(v);
    setTimeAccelState(val);
    engine.setTimeAccel(val);
  }, []);

  /**
   * Đổi hướng (GO / RETURN)
   */
  const setCurrentDir = useCallback(
    (dir) => {
      if (dir === currentDir) return;
      engine.stop();
      setCurrentDirState(dir);
      setSimData(null);
      setIsSimulating(false);
    },
    [currentDir],
  );

  /**
   * Theo dõi / bỏ theo dõi 1 xe
   */
  const toggleTrackBus = useCallback((tripId) => {
    setTrackedBusId((prev) => (prev === tripId ? null : tripId));
  }, []);

  const clearTrack = useCallback(() => setTrackedBusId(null), []);

  // ─── Giá trị context cung cấp ───
  const value = {
    // State
    currentDir,
    simData,
    isSimulating,
    timeAccel,
    clockText,
    stats,
    busList,
    trackedBusId,
    // Actions
    loadData,
    start,
    reset,
    setTimeAccel,
    setCurrentDir,
    toggleTrackBus,
    clearTrack,
  };

  return (
    <SimulationContext.Provider value={value}>
      {children}
    </SimulationContext.Provider>
  );
}
