import { useEffect, useMemo } from "react";
import {
  X,
  Loader2,
  Bus,
  User as UserIcon,
  Users,
  MapPin,
  Clock,
  Calendar,
  CheckCircle2,
  Play,
  XCircle,
  Route as RouteIcon,
  AlertCircle,
} from "lucide-react";
import { EmployeeAvatar } from "../employees/EmployeeAvatar";
import { VehicleIcon } from "../vehicles/VehicleIcon";
import {
  getRouteColor,
  getStatusStyle,
  fmtTime,
  fmtDateFull,
} from "./assignmentConstants";
import {
  useChangeAssignmentStatus,
  useDeleteAssignment,
} from "@/hooks/useAssignments";

function Section({ icon: Icon, title, children, action }) {
  return (
    <div className="border-b border-[#F0F3F7] last:border-0">
      <div className="flex items-center justify-between gap-2 px-5 py-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-[#F8FAFC] flex items-center justify-center">
            <Icon size={12} className="text-[#8A9AAA]" />
          </div>
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#6A7A9A]">
            {title}
          </h3>
        </div>
        {action}
      </div>
      <div className="px-5 pb-4">{children}</div>
    </div>
  );
}

function PersonRow({ employee, roleLabel, onSwap, swapDisabled }) {
  if (!employee) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-[#D0D7E2] bg-[#F8FAFC]">
        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0">
          <UserIcon size={16} className="text-[#B0BCCA]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-[#8A9AAA]">Chưa gán {roleLabel}</div>
        </div>
        {onSwap && (
          <button
            type="button"
            onClick={onSwap}
            className="text-[11px] font-semibold text-[#169BA2] hover:text-[#0F7075] cursor-pointer"
          >
            + Gán
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-white border border-[#E5EAF0]">
      <EmployeeAvatar employee={employee} size="md" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold text-[#1A2332] truncate">
          {employee.full_name}
        </div>
        <div className="text-[11px] text-[#8A9AAA] font-mono mt-0.5">
          {employee.employee_code}
        </div>
      </div>
      {onSwap && (
        <button
          type="button"
          onClick={onSwap}
          disabled={swapDisabled}
          className="text-[11px] font-semibold text-[#169BA2] hover:text-[#0F7075] cursor-pointer disabled:opacity-40"
        >
          Đổi
        </button>
      )}
    </div>
  );
}

export function AssignmentDetailDrawer({
  assignment,
  open,
  onClose,
  onSwapDriver,
}) {
  const statusMut = useChangeAssignmentStatus();
  const deleteMut = useDeleteAssignment();

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !assignment) return null;

  const routeColor = getRouteColor(assignment.route_id);
  const statusStyle = getStatusStyle(assignment.status);

  const shiftLabel =
    assignment.shift?.code === "MORNING" ? "Ca sáng" : "Ca tối";
  const vehicle = assignment.vehicle;
  const vehicleTypeCode = vehicle?.type_code || "BUS_45";

  const handleChangeStatus = (newStatus) => {
    if (
      newStatus === "cancelled" &&
      !confirm(`Hủy phân công ${vehicle?.vehicle_code}?`)
    ) {
      return;
    }
    statusMut.mutate({ id: assignment.id, status: newStatus });
  };

  const handleDelete = () => {
    if (
      !confirm(`Xóa phân công ${vehicle?.vehicle_code}? Không thể hoàn tác.`)
    ) {
      return;
    }
    deleteMut.mutate(assignment.id, {
      onSuccess: () => onClose?.(),
    });
  };

  const canStart = assignment.status === "scheduled";
  const canComplete = assignment.status === "in_progress";
  const canCancel =
    assignment.status === "scheduled" || assignment.status === "in_progress";

  return (
    <>
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-[1px] z-[1000] animate-in fade-in"
        onClick={onClose}
      />
      <div
        className="fixed top-0 right-0 h-screen w-full max-w-[520px] bg-white shadow-2xl z-[1010] flex flex-col animate-in slide-in-from-right"
        style={{ animationDuration: "0.25s" }}
      >
        <header className="flex-shrink-0 border-b border-[#E5EAF0] relative overflow-hidden">
          <div className={`h-1 ${routeColor.bg}`} />

          <div className="px-5 py-4">
            <div className="flex items-start gap-3">
              <VehicleIcon vehicleTypeCode={vehicleTypeCode} size="lg" />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base font-bold text-[#1A2332] font-mono">
                    {vehicle?.vehicle_code || `#${assignment.vehicle_id}`}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot} ${
                        statusStyle.pulse ? "animate-pulse" : ""
                      }`}
                    />
                    {statusStyle.label}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-[#6A7A9A]">
                  <span className="font-mono">
                    {vehicle?.license_plate || "—"}
                  </span>
                  <span>·</span>
                  <span>{shiftLabel}</span>
                </div>

                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold ${routeColor.bgLight} ${routeColor.textDark} border ${routeColor.border}`}
                  >
                    <RouteIcon size={10} />
                    Tuyến {assignment.route_id}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold text-[#1A2332] bg-[#F8FAFC] px-2 py-0.5 rounded-md border border-[#E5EAF0]">
                    <Clock size={10} className="text-[#8A9AAA]" />
                    {fmtTime(assignment.start_time)} –{" "}
                    {fmtTime(assignment.end_time)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-md hover:bg-[#F8FAFC] flex items-center justify-center cursor-pointer flex-shrink-0"
              >
                <X size={16} className="text-[#6A7A9A]" />
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <Section icon={UserIcon} title="Tài xế">
            <PersonRow
              employee={assignment.driver}
              roleLabel="tài xế"
              onSwap={onSwapDriver}
              swapDisabled={
                assignment.status === "completed" ||
                assignment.status === "cancelled"
              }
            />
          </Section>

          {assignment.co_driver && (
            <Section icon={Users} title="Lơ xe">
              <PersonRow
                employee={assignment.co_driver}
                roleLabel="lơ xe"
                swapDisabled={
                  assignment.status === "completed" ||
                  assignment.status === "cancelled"
                }
              />
            </Section>
          )}

          <Section icon={Bus} title="Chi tiết">
            <div className="space-y-1">
              <DetailRow
                icon={MapPin}
                label="Depot"
                value={`Depot #${assignment.depot_id}`}
              />
              <DetailRow
                icon={Calendar}
                label="Ngày"
                value={fmtDateFull(assignment.date)}
              />
              <DetailRow
                icon={Clock}
                label="Khung giờ"
                value={`${fmtTime(assignment.start_time)} – ${fmtTime(assignment.end_time)}`}
              />
              <DetailRow
                icon={Clock}
                label="Buffer giữa chuyến"
                value={`${assignment.buffer_minutes || 45} phút`}
              />
              {assignment.notes && (
                <div className="mt-3 pt-3 border-t border-[#F0F3F7]">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[#8A9AAA] mb-1.5">
                    Ghi chú
                  </div>
                  <div className="text-xs text-[#4A5A7A] leading-relaxed bg-[#F8FAFC] rounded-md p-2.5">
                    {assignment.notes}
                  </div>
                </div>
              )}
            </div>
          </Section>
        </div>

        <footer className="flex-shrink-0 border-t border-[#E5EAF0] bg-[#F8FAFC] p-4 space-y-2">
          <div className="flex items-center gap-2">
            {canStart && (
              <button
                type="button"
                onClick={() => handleChangeStatus("in_progress")}
                disabled={statusMut.isPending}
                className="flex-1 h-10 rounded-lg bg-[#169BA2] hover:bg-[#0F7075] text-white text-sm font-semibold cursor-pointer inline-flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {statusMut.isPending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Play size={14} />
                )}
                Bắt đầu ca
              </button>
            )}

            {canComplete && (
              <button
                type="button"
                onClick={() => handleChangeStatus("completed")}
                disabled={statusMut.isPending}
                className="flex-1 h-10 rounded-lg bg-[#169BA2] hover:bg-[#0F7075] text-white text-sm font-semibold cursor-pointer inline-flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {statusMut.isPending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={14} />
                )}
                Kết thúc ca
              </button>
            )}

            {canCancel && (
              <button
                type="button"
                onClick={() => handleChangeStatus("cancelled")}
                disabled={statusMut.isPending}
                className="h-10 px-4 rounded-lg border border-[#FFC8C8] bg-white text-[#C62828] hover:bg-[#FEF2F2] text-sm font-semibold cursor-pointer inline-flex items-center gap-2 disabled:opacity-50"
              >
                <XCircle size={14} />
                Hủy
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleDelete}
            disabled={deleteMut.isPending}
            className="w-full text-[11px] font-semibold text-[#8A9AAA] hover:text-[#C62828] transition-colors cursor-pointer disabled:opacity-50 py-1"
          >
            {deleteMut.isPending ? "Đang xóa..." : "Xóa phân công này"}
          </button>
        </footer>
      </div>
    </>
  );
}

function DetailRow({ icon: Icon, label, value, mono }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <div className="flex items-center gap-2">
        <Icon size={11} className="text-[#8A9AAA]" />
        <span className="text-[11px] text-[#6A7A9A]">{label}</span>
      </div>
      <span
        className={`text-xs font-medium text-[#1A2332] ${
          mono ? "font-mono" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}
