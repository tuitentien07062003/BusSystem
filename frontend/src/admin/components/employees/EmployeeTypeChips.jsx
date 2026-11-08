import {
  EMPLOYEE_TYPE_LABELS,
  EMPLOYEE_TYPE_STYLES,
} from "./employeeConstants";

const TYPES = [
  { value: "all", label: "Tất cả" },
  { value: "driver", label: EMPLOYEE_TYPE_LABELS.driver },
  { value: "co_driver", label: EMPLOYEE_TYPE_LABELS.co_driver },
  { value: "depot_staff", label: EMPLOYEE_TYPE_LABELS.depot_staff },
  { value: "dispatcher", label: EMPLOYEE_TYPE_LABELS.dispatcher },
];

export function EmployeeTypeChips({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {TYPES.map((t) => {
        const isActive = value === t.value;
        const style = t.value === "all" ? null : EMPLOYEE_TYPE_STYLES[t.value];

        return (
          <button
            key={t.value}
            type="button"
            onClick={() => onChange(t.value)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
              isActive
                ? "bg-[#1A2332] text-white border-[#1A2332] shadow-sm"
                : style
                  ? `${style.bg} ${style.text} ${style.border} hover:shadow-sm`
                  : "bg-white text-[#4A5A7A] border-[#D0D7E2] hover:border-[#169BA2]"
            }`}
          >
            {style && (
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isActive ? "bg-white" : style.dot
                }`}
              />
            )}
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
