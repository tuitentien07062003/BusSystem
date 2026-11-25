import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const userIcon = L.divIcon({
  className: "tbus-user-marker",
  html: `<div style="position:relative;width:16px;height:16px">
    <div style="position:absolute;inset:-10px;border-radius:50%;background:rgba(66,133,244,0.25);animation:tbusPulse 2s infinite"></div>
    <div style="position:absolute;inset:0;border-radius:50%;background:#4285F4;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.35)"></div>
  </div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const stopIcon = L.divIcon({
  className: "tbus-stop-marker",
  html: `<div style="width:28px;height:28px;background:#169BA2;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center">
    <div style="transform:rotate(45deg);color:white;font-size:13px;line-height:1">🚏</div>
  </div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28],
});

function FlyToUser({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, 15, { duration: 0.8 });
  }, [position, map]);
  return null;
}

export function PassengerMap({
  center = [10.7769, 106.7009],
  userPosition,
  stops = [],
  onStopClick,
  height = 320,
  zoom = 14,
}) {
  return (
    <div
      style={{ height }}
      className="relative rounded-2xl overflow-hidden border border-[#E5EAF0]"
    >
      <style>{`@keyframes tbusPulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(2);opacity:0}}`}</style>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="© OpenStreetMap"
        />
        {userPosition && (
          <>
            <Marker position={userPosition} icon={userIcon}>
              <Popup>Vị trí của bạn</Popup>
            </Marker>
            <FlyToUser position={userPosition} />
          </>
        )}
        {stops.map((s) => (
          <Marker
            key={s.id}
            position={[s.latitude, s.longitude]}
            icon={stopIcon}
            eventHandlers={{ click: () => onStopClick?.(s) }}
          >
            <Popup>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{s.name}</div>
                <div style={{ fontSize: 11, color: "#6A7A9A" }}>{s.code}</div>
                {s.distance_m != null && (
                  <div style={{ fontSize: 11, marginTop: 4 }}>
                    Cách {s.distance_m}m
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
