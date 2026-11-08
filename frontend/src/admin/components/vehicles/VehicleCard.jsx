import { MapPin, Battery, Route as RouteIcon, Pencil } from "lucide-react";
import { VehicleIcon } from "./VehicleIcon";
import {
  VEHICLE_TYPE_LABELS,
  VEHICLE_TYPE_STYLES,
  UNKNOWN,
} from "./vehicleConstants";

function fmtCoord(lat, lng) {
  if (lat == null || lng == null) return UNKNOWN;
  return `${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}`;
}

export function VehicleCard({ vehicle, onView, onEdit }) {
  const typeCode = vehicle.type_code || vehicle.vehicle_type_code || "BUS_45";
  const typeStyle = VEHICLE_TYPE_STYLES[typeCode] || VEHICLE_TYPE_STYLES.BUS_45;
  const isElectric = typeCode === "EBUS_60";
  const isActive = vehicle.is_active !== false;

  return (
    <div
      onClick={() => onView?.(vehicle)}
      className="group bg-white rounded-xl border border-[#E5EAF0] hover:border-[#A8D5D8] hover:shadow-md transition-all cursor-pointer p-4 flex flex-col gap-3"
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <VehicleIcon vehicleTypeCode={typeCode} size="md" />
        <div className="min-w-0 flex-1 pt-0.5">
          <div className="text-sm font-bold text-[#1A2332] font-mono leading-tight truncate">
            {vehicle.vehicle_code}
          </div>
          <div className="text-[11px] text-[#8A9AAA] font-mono mt-0.5">
            {vehicle.license_plate}
          </div>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit?.(vehicle);
          }}
          title="Sửa"
          className="w-7 h-7 rounded-md bg-[#F8FAFC] hover:bg-[#E6F4F5] text-[#6A7A9A] hover:text-[#169BA2] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border border-[#E5EAF0] flex-shrink-0"
        >
          <Pencil size={12} />
        </button>
      </div>

      {/* Type + status badges */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${typeStyle.bg} ${typeStyle.text} ${typeStyle.border}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${typeStyle.dot}`} />
          {VEHICLE_TYPE_LABELS[typeCode] || typeCode}
        </span>
        {!isActive && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#F8FAFC] text-[#8A9AAA] border border-[#E5EAF0]">
            Ngưng
          </span>
        )}
      </div>

      {/* Info rows */}
      <div className="space-y-1.5 pt-2 border-t border-[#F0F3F7]">
        <div className="flex items-center gap-2 text-[11px]">
          <MapPin size={11} className="text-[#8A9AAA] flex-shrink-0" />
          <span className="text-[#4A5A7A] truncate">
            Depot #{vehicle.depot_id ?? UNKNOWN}
          </span>
        </div>

        {isElectric && vehicle.battery_capacity_kwh && (
          <div className="flex items-center gap-2 text-[11px]">
            <Battery size={11} className="text-[#16A34A] flex-shrink-0" />
            <span className="text-[#4A5A7A]">
              {vehicle.battery_capacity_kwh} kWh · {vehicle.range_km} km
            </span>
          </div>
        )}

        {vehicle.capacity_seated && (
          <div className="flex items-center gap-2 text-[11px]">
            <RouteIcon size={11} className="text-[#8A9AAA] flex-shrink-0" />
            <span className="text-[#4A5A7A]">
              {vehicle.capacity_seated} chỗ ngồi
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
