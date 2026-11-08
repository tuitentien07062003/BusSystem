import { useEffect, useRef } from "react";
import L from "leaflet";
import { engine } from "@/engine/simulationEngine";
import { useSimulation } from "@/hooks/useSimulation";
import { COLORS, BUS_STATUS_COLOR } from "@/engine/simConstants";

// ═══════════════════════════════════════════════════════════════
// ICON
// ═══════════════════════════════════════════════════════════════
function makeBusIcon(dir, status, tracked) {
  const color =
    status === "waiting" || status === "done"
      ? BUS_STATUS_COLOR[status]
      : dir === 0
        ? COLORS.go.bus
        : COLORS.return.bus;

  const ringColor = tracked ? "#F59E0B" : "#FFFFFF";
  const ringWidth = tracked ? 3 : 2;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 34 34">
    <circle cx="17" cy="17" r="15" fill="${color}" stroke="${ringColor}" stroke-width="${ringWidth}"/>
    <text x="17" y="22" font-size="14" text-anchor="middle" fill="white" font-family="Arial">🚌</text>
  </svg>`;
  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
}

function makeStopCircle(color, isTerminal) {
  return {
    radius: isTerminal ? 7 : 5,
    color: isTerminal ? COLORS.depot : color,
    fillColor: "#FFFFFF",
    fillOpacity: 1,
    weight: 2,
  };
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════
export function MapView() {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layersRef = useRef({
    routes: {},
    stops: [],
    busMarkers: new Map(),
  });
  const busStatusRef = useRef(new Map());
  const trackedBlockRef = useRef(null);

  const { routeMeta, trackedBlockId, toggleTrackBlock, selectedRouteId } =
    useSimulation();

  // ═══════════════════════════════════════════════════════════════
  // INIT MAP
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: true,
    }).setView([10.82, 106.74], 13);

    L.control.zoom({ position: "bottomright" }).addTo(map);

    // Esri Dark Gray Canvas
    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
      {
        attribution: "© Esri, HERE, Garmin, © OpenStreetMap",
        maxZoom: 19,
      },
    ).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // ═══════════════════════════════════════════════════════════════
  // VẼ ROUTE + STOPS
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !routeMeta) return;

    Object.values(layersRef.current.routes).forEach((l) => map.removeLayer(l));
    layersRef.current.stops.forEach((l) => map.removeLayer(l));
    layersRef.current.routes = {};
    layersRef.current.stops = [];

    const bounds = L.latLngBounds();

    Object.values(routeMeta).forEach((meta) => {
      const dir = meta.direction_id;
      const route = engine.routesByDir[dir];
      if (!route?.shape) return;

      const color = dir === 0 ? COLORS.go.route : COLORS.return.route;

      const layer = L.geoJSON(route.shape, {
        style: { color, weight: 5, opacity: 0.85 },
      }).addTo(map);
      layersRef.current.routes[dir] = layer;

      route.stops.forEach((s, idx) => {
        const isTerminal = idx === 0 || idx === route.stops.length - 1;
        const m = L.circleMarker(
          [s.latitude, s.longitude],
          makeStopCircle(color, isTerminal),
        )
          .addTo(map)
          .bindPopup(
            `<div class="bus-popup">
              <b>${s.stop_name}</b>
              <div class="sub">Trạm ${s.stop_sequence} · ${
                dir === 0 ? "Chiều đi" : "Chiều về"
              }</div>
            </div>`,
          );
        layersRef.current.stops.push(m);
        bounds.extend([s.latitude, s.longitude]);
      });

      route.routePoints.forEach((p) => bounds.extend([p.lat, p.lng]));
    });

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  }, [routeMeta, selectedRouteId]);

  // ═══════════════════════════════════════════════════════════════
  // BUS MARKERS — mỗi block = 1 bus
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    layersRef.current.busMarkers.forEach((m) => map.removeLayer(m));
    layersRef.current.busMarkers.clear();
    busStatusRef.current.clear();

    if (engine.blocks.length === 0) return;

    for (const block of engine.blocks) {
      const marker = L.marker(block.latlng, {
        icon: makeBusIcon(block.direction_id, block.status, false),
        zIndexOffset: 500 + block.id,
      })
        .addTo(map)
        .bindPopup(
          `<div class="bus-popup">
            <b>${block.vehicle_code}</b>
            <div class="sub">${block.driver_code} · ${block.driver_name}</div>
            <div class="sub">${block.license_plate}</div>
          </div>`,
        )
        .on("click", () => toggleTrackBlock(block.id));

      layersRef.current.busMarkers.set(block.id, marker);
      busStatusRef.current.set(block.id, block.status);
    }

    const unsub = engine.onTick(() => {
      for (const block of engine.blocks) {
        const marker = layersRef.current.busMarkers.get(block.id);
        if (!marker) continue;

        marker.setLatLng(block.latlng);

        const prevStatus = busStatusRef.current.get(block.id);
        if (prevStatus !== block.status) {
          const isTracked = trackedBlockRef.current === block.id;
          marker.setIcon(
            makeBusIcon(block.direction_id, block.status, isTracked),
          );
          busStatusRef.current.set(block.id, block.status);
        }
      }
    });

    return () => {
      unsub();
      layersRef.current.busMarkers.forEach((m) => map.removeLayer(m));
      layersRef.current.busMarkers.clear();
      busStatusRef.current.clear();
    };
  }, [routeMeta, selectedRouteId, toggleTrackBlock]);

  // ═══════════════════════════════════════════════════════════════
  // TRACK BLOCK
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (trackedBlockRef.current) {
      const oldBlock = engine.blocks.find(
        (b) => b.id === trackedBlockRef.current,
      );
      const oldMarker = layersRef.current.busMarkers.get(
        trackedBlockRef.current,
      );
      if (oldBlock && oldMarker) {
        oldMarker.setIcon(
          makeBusIcon(oldBlock.direction_id, oldBlock.status, false),
        );
      }
    }

    trackedBlockRef.current = trackedBlockId;

    if (!trackedBlockId) return;

    const block = engine.blocks.find((b) => b.id === trackedBlockId);
    const marker = layersRef.current.busMarkers.get(trackedBlockId);
    if (block && marker) {
      marker.setIcon(makeBusIcon(block.direction_id, block.status, true));
      map.panTo(block.latlng, { animate: true, duration: 0.5 });
    }

    const unsub = engine.onTick(() => {
      const b = engine.blocks.find((x) => x.id === trackedBlockId);
      if (b) {
        map.panTo(b.latlng, { animate: true, duration: 0.3 });
      }
    });

    return unsub;
  }, [trackedBlockId]);

  return (
    <div
      ref={containerRef}
      className="flex-1 h-screen bg-[#0A0E1A]"
      style={{ minHeight: 0 }}
    />
  );
}
