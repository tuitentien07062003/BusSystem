import { useEffect, useRef } from 'react';
import L from 'leaflet';

const DEFAULT_CENTER = [10.7769, 106.7009];
const DEFAULT_ZOOM = 12;

const STYLE = `
  .rte-via {
    width: 12px; height: 12px; border-radius: 50%;
    background: #9c27b0; border: 2px solid #fff;
    box-shadow: 0 1px 4px rgba(0,0,0,0.5);
    cursor: grab;
    transition: transform 0.15s ease;
  }
  .rte-via:hover { transform: scale(1.3); }
  .rte-via:active { cursor: grabbing; transform: scale(1.5); }
`;

function ensureStyle() {
  if (document.getElementById('rte-style-v3')) return;
  const s = document.createElement('style');
  s.id = 'rte-style-v3';
  s.textContent = STYLE;
  document.head.appendChild(s);
}

function makeDepotIcon(color, label) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="42" viewBox="0 0 34 42">
    <path d="M17 0C7.6 0 0 7.6 0 17c0 12 17 25 17 25s17-13 17-25c0-9.4-7.6-17-17-17z" fill="${color}" stroke="#fff" stroke-width="2"/>
    <text x="17" y="22" font-size="13" font-weight="bold" text-anchor="middle" fill="white">${label}</text>
  </svg>`;
  return L.divIcon({ html: svg, className: '', iconSize: [34, 42], iconAnchor: [17, 42] });
}

function makeStopIcon(seq) {
  // Giọt nước với số bên trong
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="32" viewBox="0 0 34 42">
    <path d="M17 0C7.6 0 0 7.6 0 17c0 12 17 25 17 25s17-13 17-25c0-9.4-7.6-17-17-17z"
          fill="#169BA2" stroke="#fff" stroke-width="2.5"/>
    <circle cx="17" cy="17" r="9" fill="#fff" opacity="0.95"/>
    <text x="17" y="21" font-size="11" font-weight="bold" text-anchor="middle" fill="#169BA2">${seq}</text>
  </svg>`;
  return L.divIcon({ html: svg, className: '', iconSize: [26, 32], iconAnchor: [13, 32] });
}

function makeViaIcon() {
  return L.divIcon({
    html: `<div class="rte-via"></div>`,
    className: '',
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });
}

// ─── Helpers ───
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function cumulativeDistancesCoords(coords) {
  if (!coords?.length) return [];
  const dists = [0];
  for (let i = 1; i < coords.length; i++) {
    dists.push(dists[i - 1] + haversine(coords[i - 1][1], coords[i - 1][0], coords[i][1], coords[i][0]));
  }
  return dists;
}

// Tìm nearest coord index trên shape
function findNearestShapeIdx(coords, lat, lng) {
  let bestIdx = 0;
  let bestD = Infinity;
  for (let i = 0; i < coords.length; i++) {
    const dx = coords[i][0] - lng;
    const dy = coords[i][1] - lat;
    const d = dx * dx + dy * dy;
    if (d < bestD) { bestD = d; bestIdx = i; }
  }
  return bestIdx;
}

// Xác định segment_index = giữa points[i] và points[i+1] mà vị trí (lat,lng) thuộc về
function findSegmentIndex(preview, lat, lng) {
  if (!preview?.shape?.coordinates?.length || !preview?.points?.length) return 0;
  const coords = preview.shape.coordinates;
  const cum = cumulativeDistancesCoords(coords);
  const idx = findNearestShapeIdx(coords, lat, lng);
  const dragDist = cum[idx];

  const pts = preview.points;
  // pts[i].distance_from_start_m — dùng để so sánh
  for (let i = 0; i < pts.length - 1; i++) {
    const dA = pts[i].distance_from_start_m ?? 0;
    const dB = pts[i + 1].distance_from_start_m ?? 0;
    if (dragDist >= dA && dragDist <= dB) return i;
  }
  return pts.length - 2 >= 0 ? pts.length - 2 : 0;
}

// Tính offset trong segment (0 → 1) để BE sort đúng
function computeOffsetInSegment(preview, segIdx, lat, lng) {
  if (!preview?.shape?.coordinates?.length) return 0.5;
  const coords = preview.shape.coordinates;
  const cum = cumulativeDistancesCoords(coords);
  const idx = findNearestShapeIdx(coords, lat, lng);
  const dragDist = cum[idx];
  const pts = preview.points;
  const dA = pts[segIdx]?.distance_from_start_m ?? 0;
  const dB = pts[segIdx + 1]?.distance_from_start_m ?? 0;
  if (dB - dA < 1) return 0.5;
  return Math.max(0, Math.min(1, (dragDist - dA) / (dB - dA)));
}

function buildTempCoords(coords, idx, lat, lng) {
  const clamped = Math.max(0, Math.min(idx, coords.length - 2));
  const before = coords.slice(0, clamped + 1);
  const after = coords.slice(clamped + 1);
  return [...before, [lng, lat], ...after];
}

function coordsToLatLngs(coords) {
  return coords.map((c) => [c[1], c[0]]);
}

export function RoutePreviewMap({
  preview,
  startDepot,
  endDepot,
  hoveredStop,
  focusedStop,
  viaPoints = [],
  onAddViaPoint,
  onMoveViaPoint,
  onRemoveViaPoint,
  readOnly = false,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const routeLayerRef = useRef(null);
  const tempLayerRef = useRef(null);
  const markersRef = useRef([]);
  const viaMarkersRef = useRef([]);
  const hoverLayerRef = useRef(null);
  const hasFittedRef = useRef(false);
  const isDraggingRef = useRef(false);

  const callbacksRef = useRef({ onAddViaPoint, onMoveViaPoint, onRemoveViaPoint });
  useEffect(() => {
    callbacksRef.current = { onAddViaPoint, onMoveViaPoint, onRemoveViaPoint };
  }, [onAddViaPoint, onMoveViaPoint, onRemoveViaPoint]);

  const previewRef = useRef(preview);
  useEffect(() => { previewRef.current = preview; }, [preview]);

  useEffect(() => { ensureStyle(); }, []);

  // Init map
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;
    const map = L.map(containerRef.current, { zoomControl: true }).setView(DEFAULT_CENTER, DEFAULT_ZOOM);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap © CARTO',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => { hasFittedRef.current = false; }, [startDepot?.id, endDepot?.id]);

  // ─── Drag line ───
  function startLineDrag(map, lat, lng) {
    const previewData = previewRef.current;
    if (!previewData?.shape?.coordinates?.length) return;

    isDraggingRef.current = true;
    map.getContainer().style.cursor = 'grabbing';
    if (map.dragging) map.dragging.disable();

    const coords = previewData.shape.coordinates;
    const nearestIdx = findNearestShapeIdx(coords, lat, lng);

    routeLayerRef.current?.setStyle({ opacity: 0.15 });

    const tempLayer = L.polyline(
      coordsToLatLngs(buildTempCoords(coords, nearestIdx, lat, lng)),
      { color: '#0d6efd', weight: 5, opacity: 0.95 }
    ).addTo(map);
    tempLayer.bringToFront();
    tempLayerRef.current = tempLayer;

    const onMove = (ev) => {
      const newCoords = buildTempCoords(coords, nearestIdx, ev.latlng.lat, ev.latlng.lng);
      tempLayer.setLatLngs(coordsToLatLngs(newCoords));
    };

    const onUp = (ev) => {
      map.off('mousemove', onMove);
      map.off('mouseup', onUp);
      if (map.dragging) map.dragging.enable();
      map.getContainer().style.cursor = '';
      isDraggingRef.current = false;

      if (tempLayerRef.current) {
        map.removeLayer(tempLayerRef.current);
        tempLayerRef.current = null;
      }
      routeLayerRef.current?.setStyle({ opacity: 0.85 });

      const moved = haversine(lat, lng, ev.latlng.lat, ev.latlng.lng) > 15;
      if (moved) {
        const segmentIdx = findSegmentIndex(previewData, ev.latlng.lat, ev.latlng.lng);
        const offsetInSeg = computeOffsetInSegment(previewData, segmentIdx, ev.latlng.lat, ev.latlng.lng);
        callbacksRef.current.onAddViaPoint?.({
          latitude: ev.latlng.lat,
          longitude: ev.latlng.lng,
          segment_index: segmentIdx,
          offset_in_segment: offsetInSeg,
        });
      }
    };

    map.on('mousemove', onMove);
    map.on('mouseup', onUp);
  }

  // ─── Drag via marker ───
  function startViaDrag(map, viaIdx) {
    const previewData = previewRef.current;
    if (!previewData?.shape?.coordinates?.length) return;

    isDraggingRef.current = true;
    map.getContainer().style.cursor = 'grabbing';

    const coords = previewData.shape.coordinates;
    const vp = viaPoints[viaIdx];
    if (!vp) return;

    const vMarker = viaMarkersRef.current[viaIdx];
    if (vMarker) vMarker.setOpacity(0);

    routeLayerRef.current?.setStyle({ opacity: 0.15 });

    let nearestIdx = findNearestShapeIdx(coords, vp.latitude, vp.longitude);
    const tempLayer = L.polyline(
      coordsToLatLngs(buildTempCoords(coords, nearestIdx, vp.latitude, vp.longitude)),
      { color: '#9c27b0', weight: 5, opacity: 0.95 }
    ).addTo(map);
    tempLayer.bringToFront();
    tempLayerRef.current = tempLayer;

    const onMove = (ev) => {
      nearestIdx = findNearestShapeIdx(coords, ev.latlng.lat, ev.latlng.lng);
      const newCoords = buildTempCoords(coords, nearestIdx, ev.latlng.lat, ev.latlng.lng);
      tempLayer.setLatLngs(coordsToLatLngs(newCoords));
    };

    const onUp = (ev) => {
      map.off('mousemove', onMove);
      map.off('mouseup', onUp);
      map.getContainer().style.cursor = '';
      isDraggingRef.current = false;

      if (vMarker) vMarker.setOpacity(1);
      if (tempLayerRef.current) {
        map.removeLayer(tempLayerRef.current);
        tempLayerRef.current = null;
      }
      routeLayerRef.current?.setStyle({ opacity: 0.85 });

      const segmentIdx = findSegmentIndex(previewData, ev.latlng.lat, ev.latlng.lng);
      const offsetInSeg = computeOffsetInSegment(previewData, segmentIdx, ev.latlng.lat, ev.latlng.lng);
      callbacksRef.current.onMoveViaPoint?.(viaIdx, {
        latitude: ev.latlng.lat,
        longitude: ev.latlng.lng,
        segment_index: segmentIdx,
        offset_in_segment: offsetInSeg,
      });
    };

    map.on('mousemove', onMove);
    map.on('mouseup', onUp);
  }

  // Vẽ route + markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (routeLayerRef.current) { map.removeLayer(routeLayerRef.current); routeLayerRef.current = null; }
    if (tempLayerRef.current) { map.removeLayer(tempLayerRef.current); tempLayerRef.current = null; }
    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current = [];

    if (!preview) {
      if (startDepot && endDepot) {
        const s = L.marker([startDepot.latitude, startDepot.longitude], { icon: makeDepotIcon('#169BA2', 'Đ') })
          .addTo(map).bindPopup(`<b>${startDepot.stop_name}</b>`);
        const e = L.marker([endDepot.latitude, endDepot.longitude], { icon: makeDepotIcon('#c0392b', 'C') })
          .addTo(map).bindPopup(`<b>${endDepot.stop_name}</b>`);
        markersRef.current.push(s, e);
        if (!hasFittedRef.current) {
          map.fitBounds(L.latLngBounds([
            [startDepot.latitude, startDepot.longitude],
            [endDepot.latitude, endDepot.longitude],
          ]), { padding: [60, 60], maxZoom: 15 });
          hasFittedRef.current = true;
        }
      } else if (startDepot) {
        const s = L.marker([startDepot.latitude, startDepot.longitude], { icon: makeDepotIcon('#169BA2', 'Đ') }).addTo(map);
        markersRef.current.push(s);
        if (!hasFittedRef.current) { map.setView([startDepot.latitude, startDepot.longitude], 14); hasFittedRef.current = true; }
      }
      return;
    }

    const routeLayer = L.geoJSON(preview.shape, {
      style: { color: '#169BA2', weight: 5, opacity: 0.85 },
    }).addTo(map);
    routeLayerRef.current = routeLayer;

    if (!readOnly && preview.shape?.coordinates?.length > 1) {
      routeLayer.eachLayer((layer) => {
        layer.on('mouseover', () => {
          if (!isDraggingRef.current) map.getContainer().style.cursor = 'grab';
        });
        layer.on('mouseout', () => {
          if (!isDraggingRef.current) map.getContainer().style.cursor = '';
        });
        layer.on('mousedown', (e) => {
          L.DomEvent.stopPropagation(e);
          if (isDraggingRef.current) return;
          startLineDrag(map, e.latlng.lat, e.latlng.lng);
        });
      });
    }

    (preview.points || []).forEach((p, idx) => {
      const isDepot = p.stop_type === 1;
      const isFirst = idx === 0;
      const isLast = idx === preview.points.length - 1;
      const icon = isDepot
        ? makeDepotIcon(isFirst ? '#169BA2' : isLast ? '#c0392b' : '#d48c2c', isFirst ? 'Đ' : isLast ? 'C' : '·')
        : makeStopIcon(p.sequence - 1);
      const m = L.marker([p.latitude, p.longitude], { icon, zIndexOffset: 1000 })
        .addTo(map)
        .bindPopup(
          `<div class="bus-popup"><b>${p.stop_name}</b>
            <div class="sub">${isDepot ? 'Depot' : `Trạm #${p.sequence - 1}`}</div>
          </div>`
        );
      markersRef.current.push(m);
    });

    if (!hasFittedRef.current && preview.points?.length > 0) {
      map.fitBounds(L.latLngBounds(preview.points.map((p) => [p.latitude, p.longitude])), {
        padding: [60, 60], maxZoom: 15,
      });
      hasFittedRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preview, startDepot, endDepot, readOnly]);

    // ─── Hover marker — pin giọt nước nhỏ ───
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (hoverLayerRef.current) {
      map.removeLayer(hoverLayerRef.current);
      hoverLayerRef.current = null;
    }
    if (!hoveredStop) return;

    // Pin giọt nước nhỏ màu xanh (giống depot nhưng nhỏ hơn)
    const pinSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="28" viewBox="0 0 34 42">
      <path d="M17 0C7.6 0 0 7.6 0 17c0 12 17 25 17 25s17-13 17-25c0-9.4-7.6-17-17-17z"
            fill="#169BA2" stroke="#fff" stroke-width="2.5"/>
      <circle cx="17" cy="17" r="5.5" fill="#fff"/>
    </svg>`;

    const marker = L.marker([hoveredStop.latitude, hoveredStop.longitude], {
      icon: L.divIcon({
        html: pinSvg,
        className: '',
        iconSize: [22, 28],
        iconAnchor: [11, 28],
      }),
      zIndexOffset: 9999,
      interactive: false,
    }).addTo(map);

    const group = L.layerGroup([marker]).addTo(map);
    hoverLayerRef.current = group;

    return () => {
      if (hoverLayerRef.current === group) {
        map.removeLayer(group);
        hoverLayerRef.current = null;
      }
    };
  }, [hoveredStop]);


  // ─── Focus stop (click vào row) ───
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focusedStop) return;
    map.flyTo([focusedStop.latitude, focusedStop.longitude], 17, {
      animate: true,
      duration: 0.6,
    });
  }, [focusedStop]);

  // Via markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    viaMarkersRef.current.forEach((m) => map.removeLayer(m));
    viaMarkersRef.current = [];
    if (readOnly || !viaPoints?.length) return;

    viaPoints.forEach((vp, idx) => {
      const marker = L.marker([vp.latitude, vp.longitude], {
        icon: makeViaIcon(),
        zIndexOffset: 3000,
        title: 'Kéo để di chuyển · Double-click để xoá',
      }).addTo(map);

      marker.on('mousedown', (e) => {
        L.DomEvent.stopPropagation(e);
        if (isDraggingRef.current) return;
        startViaDrag(map, idx);
      });

      marker.on('dblclick', (e) => {
        L.DomEvent.stopPropagation(e);
        if (confirm(`Xoá điểm điều hướng #${idx + 1}?`)) {
          callbacksRef.current.onRemoveViaPoint?.(idx);
        }
      });

      viaMarkersRef.current.push(marker);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viaPoints, readOnly]);

  return <div ref={containerRef} className="h-full w-full rounded-lg" />;
}
