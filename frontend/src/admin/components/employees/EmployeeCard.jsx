import { Phone, Mail, Pencil } from "lucide-react";
import { EmployeeAvatar } from "./EmployeeAvatar";
import {
  EMPLOYEE_TYPE_LABELS,
  EMPLOYEE_TYPE_STYLES,
  UNKNOWN,
} from "./employeeConstants";

export function EmployeeCard({ employee, onView, onEdit }) {
  const typeStyle =
    EMPLOYEE_TYPE_STYLES[employee.type] || EMPLOYEE_TYPE_STYLES.driver;

  const isActive = employee.is_active !== false;

  return (
    <div
      onClick={() => onView?.(employee)}
      className="group bg-white rounded-xl border border-[#E5EAF0] hover:border-[#A8D5D8] hover:shadow-md transition-all cursor-pointer p-4 flex flex-col gap-3 relative overflow-hidden"
    >
      {/* Nút sửa hiện khi hover */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onEdit?.(employee);
        }}
        title="Sửa"
        className="absolute top-3 right-3 w-7 h-7 rounded-md bg-[#F8FAFC] hover:bg-[#E6F4F5] text-[#6A7A9A] hover:text-[#169BA2] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border border-[#E5EAF0]"
      >
        <Pencil size={12} />
      </button>

      {/* Header: Avatar + Tên */}
      <div className="flex items-center gap-3 min-w-0">
        <EmployeeAvatar employee={employee} size="md" />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold text-[#1A2332] leading-tight truncate">
            {employee.full_name}
          </div>
          <div className="text-[11px] text-[#8A9AAA] font-mono mt-0.5 truncate">
            {employee.employee_code}
          </div>
        </div>
      </div>

      {/* Type badge */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${typeStyle.bg} ${typeStyle.text} ${typeStyle.border}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${typeStyle.dot}`} />
          {EMPLOYEE_TYPE_LABELS[employee.type] || employee.type}
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
          <Phone size={11} className="text-[#8A9AAA] flex-shrink-0" />
          <span className="text-[#4A5A7A] font-mono truncate">
            {employee.phone || UNKNOWN}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <Mail size={11} className="text-[#8A9AAA] flex-shrink-0" />
          <span className="text-[#4A5A7A] truncate">
            {employee.email || UNKNOWN}
          </span>
        </div>
      </div>
    </div>
  );
}
