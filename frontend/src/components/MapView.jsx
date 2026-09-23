// Bản đồ Leaflet — không dùng React để cập nhật marker (để tránh re-render)
import { useEffect, useRef } from "react";
import L from "leaflet";
import { engine } from "@/engine/simulationEngine";
import { useSimulation } from "@/hooks/useSimulation";

// Màu sắc theo hướng
const COLORS = {
  go: { route: "#2ecc71", busStop: "#27ae60", terminal: "#e74c3c" },
  return: { route: "#0078d4", busStop: "#0078d4", terminal: "#e74c3c" },
};

// Tạo icon xe bus bằng SVG
function makeBusIcon(dir, status) {
  const c =
    status === "waiting"
      ? "#8a9aaa"
      : status === "done"
        ? "#b0bcca"
        : status === "stopped"
          ? "#ffb74d"
          : dir === "go"
            ? "#2ecc71"
            : "#0078d4";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30">
    <circle cx="15" cy="15" r="14" fill="${c}" stroke="#fff" stroke-width="2"/>
    <text x="15" y="20" font-size="15" text-anchor="middle" fill="white">🚌</text>
  </svg>`;
  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

export function MapView() {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const routeLayerRef = useRef(null);
  const stopLayersRef = useRef([]);
  const busMarkersRef = useRef(new Map());

  const { simData, currentDir, trackedBusId, toggleTrackBus } = useSimulation();

  // ─── Khởi tạo bản đồ 1 lần ───
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;
    const map = L.map(containerRef.current, { zoomControl: false }).setView(
      [10.82, 106.74],
      13,
    );
    L.control.zoom({ position: "bottomright" }).addTo(map);
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      {
        attribution: "© OpenStreetMap © CARTO",
        subdomains: "abcd",
        maxZoom: 19,
      },
    ).addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // ─── Vẽ tuyến + trạm khi simData / hướng thay đổi ───
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !simData) return;

    // Xoá lớp cũ
    if (routeLayerRef.current) {
      map.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }
    stopLayersRef.current.forEach((m) => map.removeLayer(m));
    stopLayersRef.current = [];

    const col = COLORS[currentDir];

    // Vẽ tuyến
    routeLayerRef.current = L.geoJSON(simData.route_geometry, {
      style: { color: col.route, weight: 4, opacity: 0.7 },
    }).addTo(map);

    // Vẽ các trạm
    simData.stops.forEach((s) => {
      const isTerminal = s.stop_type === 1;
      const m = L.circleMarker([s.latitude, s.longitude], {
        radius: isTerminal ? 7 : 4,
        color: isTerminal ? col.terminal : col.busStop,
        fillColor: "#fff",
        fillOpacity: 1,
        weight: 2,
      })
        .addTo(map)
        .bindPopup(
          `<div class="bus-popup"><b>${s.stop_name}</b>
            <div class="sub">Trạm ${s.stop_sequence}</div></div>`,
        );
      stopLayersRef.current.push(m);
    });

    map.fitBounds(routeLayerRef.current.getBounds(), { padding: [40, 40] });
  }, [simData, currentDir]);

  // ─── Tạo marker xe bus và cập nhật theo engine ───
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !simData) return;

    // Xoá marker cũ
    busMarkersRef.current.forEach((m) => map.removeLayer(m));
    busMarkersRef.current.clear();

    // Tạo marker cho từng xe
    engine.buses.forEach((bus) => {
      const marker = L.marker(bus.latlng, {
        icon: makeBusIcon(currentDir, bus.status),
        zIndexOffset: 500 + bus.index,
      })
        .addTo(map)
        .on("click", () => toggleTrackBus(bus.trip_id));
      busMarkersRef.current.set(bus.trip_id, marker);
      bus.prevStatus = bus.status;
    });

    // Đăng ký callback mỗi tick để cập nhật vị trí marker (không qua React)
    const unsubscribe = engine.onTick(() => {
      engine.buses.forEach((bus) => {
        const marker = busMarkersRef.current.get(bus.trip_id);
        if (!marker) return;
        marker.setLatLng(bus.latlng);
        if (bus.status !== bus.prevStatus) {
          marker.setIcon(makeBusIcon(currentDir, bus.status));
          bus.prevStatus = bus.status;
        }
      });

      if (trackedBusId) {
        const tracked = engine.buses.find((b) => b.trip_id === trackedBusId);
        if (tracked) {
          map.panTo(tracked.latlng, { animate: true, duration: 0.3 });
        }
      }
    });

    return () => unsubscribe();
  }, [simData, currentDir, trackedBusId, toggleTrackBus]);

  return <div ref={containerRef} className="flex-1 h-screen bg-[#e9edf2]" />;
}
