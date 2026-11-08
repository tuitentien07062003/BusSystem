import { Bus, Zap } from "lucide-react";
import { VEHICLE_TYPE_STYLES } from "./vehicleConstants";

export function VehicleIcon({ vehicleTypeCode, size = "md" }) {
  const style =
    VEHICLE_TYPE_STYLES[vehicleTypeCode] || VEHICLE_TYPE_STYLES.BUS_45;
  const isElectric = vehicleTypeCode === "EBUS_60";

  const sizes = {
    sm: { wrap: "w-9 h-9", icon: 14, badge: 8 },
    md: { wrap: "w-12 h-12", icon: 18, badge: 10 },
    lg: { wrap: "w-16 h-16", icon: 24, badge: 14 },
  };
  const s = sizes[size] || sizes.md;

  return (
    <div
      className={`${s.wrap} rounded-xl ${style.bg} border ${style.border} flex items-center justify-center flex-shrink-0 relative`}
    >
      <Bus size={s.icon} className={style.text} strokeWidth={2.2} />
      {isElectric && (
        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#16A34A] flex items-center justify-center ring-2 ring-white">
          <Zap size={10} className="text-white" fill="currentColor" />
        </div>
      )}
    </div>
  );
}
