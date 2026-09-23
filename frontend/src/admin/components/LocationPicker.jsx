import { useEffect, useRef } from 'react';
import L from 'leaflet';

// Bản đồ nhỏ cho phép chọn vị trí bằng click hoặc kéo marker
export function LocationPicker({ latitude, longitude, onChange }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;

    const lat = Number(latitude) || 10.7725;
    const lng = Number(longitude) || 106.698;

    const map = L.map(containerRef.current, {
      zoomControl: true,
      attributionControl: false,
    }).setView([lat, lng], 15);

    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      { subdomains: 'abcd', maxZoom: 19 }
    ).addTo(map);

    const marker = L.marker([lat, lng], { draggable: true }).addTo(map);

    marker.on('dragend', () => {
      const { lat: newLat, lng: newLng } = marker.getLatLng();
      onChangeRef.current?.(newLat, newLng);
    });

    map.on('click', (e) => {
      const { lat: newLat, lng: newLng } = e.latlng;
      marker.setLatLng([newLat, newLng]);
      onChangeRef.current?.(newLat, newLng);
    });

    mapRef.current = map;
    markerRef.current = marker;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!markerRef.current || !mapRef.current) return;
    const lat = Number(latitude);
    const lng = Number(longitude);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return;

    const cur = markerRef.current.getLatLng();
    if (Math.abs(cur.lat - lat) < 1e-7 && Math.abs(cur.lng - lng) < 1e-7) return;

    markerRef.current.setLatLng([lat, lng]);
    mapRef.current.setView([lat, lng], mapRef.current.getZoom());
  }, [latitude, longitude]);

  return (
    <div className="rounded-md overflow-hidden border border-[#cbd5e1]">
      <div ref={containerRef} className="h-[220px] w-full" />
      <div className="bg-[#f8fafc] px-3 py-1.5 text-[10px] text-[#6a7a9a] border-t border-[#e5eaf0]">
        Click trên bản đồ hoặc kéo marker để chọn vị trí
      </div>
    </div>
  );
}
