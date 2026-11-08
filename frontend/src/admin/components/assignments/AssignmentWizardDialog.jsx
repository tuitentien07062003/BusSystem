import { useState, useEffect, useMemo } from "react";
import {
  X,
  Loader2,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  Trash2,
  Plus,
  Pencil,
} from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  useSuggestBlocks,
  useBulkCreateAssignments,
} from "@/hooks/useAssignments";
import { useStopsList } from "@/hooks/useStops";
import { useRoutesList } from "@/hooks/useRoutes";
import { getRouteColor, fmtTime } from "./assignmentConstants";

const STEPS = [
  { id: 1, label: "Chọn ngữ cảnh" },
  { id: 2, label: "Xem trước" },
];

function Step1({ values, onChange, onAnalyze, isAnalyzing, depots, routes }) {
  const isValid =
    values.date &&
    values.route_id &&
    values.shift_template_id &&
    values.depot_id;

  const shiftOptions = [
    { id: 1, code: "MORNING", label: "Ca sáng", sub: "05:00 – 14:00" },
    { id: 2, code: "EVENING", label: "Ca tối", sub: "14:00 – 22:00" },
  ];

  return (
    <div className="p-6 space-y-5">
      <div className="space-y-2">
        <label className="text-[11px] font-bold uppercase tracking-wider text-[#6A7A9A]">
          Ngày phân công
        </label>
        <input
          type="date"
          value={values.date}
          onChange={(e) => onChange({ date: e.target.value })}
          className="w-full h-11 px-3.5 rounded-lg border border-[#D0D7E2] bg-white text-sm font-mono text-[#1A2332] outline-none focus:border-[#169BA2] focus:ring-2 focus:ring-[#169BA2]/20 transition-all cursor-pointer"
        />
      </div>

      <div className="space-y-2">
        <label className="text-[11px] font-bold uppercase tracking-wider text-[#6A7A9A]">
          Tuyến đường
        </label>
        <Select
          value={values.route_id ? String(values.route_id) : ""}
          onValueChange={(v) => onChange({ route_id: v })}
        >
          <SelectTrigger className="w-full h-11">
            <SelectValue placeholder="Chọn tuyến" />
          </SelectTrigger>
          <SelectContent>
            {routes.map((r) => (
              <SelectItem key={r.id} value={String(r.id)}>
                {r.route_short_name} · {r.route_full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-[11px] font-bold uppercase tracking-wider text-[#6A7A9A]">
          Ca làm việc
        </label>
        <div className="grid grid-cols-2 gap-2">
          {shiftOptions.map((s) => {
            const isActive = values.shift_template_id === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onChange({ shift_template_id: s.id })}
                className={`relative p-3.5 rounded-xl border-2 text-left cursor-pointer transition-all ${
                  isActive
                    ? "border-[#169BA2] bg-[#E6F4F5] shadow-sm"
                    : "border-[#E5EAF0] bg-white hover:border-[#A8D5D8]"
                }`}
              >
                {isActive && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#169BA2] flex items-center justify-center">
                    <CheckCircle2 size={12} className="text-white" />
                  </div>
                )}
                <div
                  className={`text-sm font-bold ${
                    isActive ? "text-[#0F7075]" : "text-[#1A2332]"
                  }`}
                >
                  {s.label}
                </div>
                <div className="text-[11px] text-[#8A9AAA] font-mono mt-1">
                  {s.sub}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[11px] font-bold uppercase tracking-wider text-[#6A7A9A]">
          Depot xuất phát
        </label>
        <Select
          value={values.depot_id ? String(values.depot_id) : ""}
          onValueChange={(v) => onChange({ depot_id: v })}
        >
          <SelectTrigger className="w-full h-11">
            <SelectValue placeholder="Chọn depot" />
          </SelectTrigger>
          <SelectContent>
            {depots.map((d) => (
              <SelectItem key={d.id} value={String(d.id)}>
                {d.stop_name || `Depot #${d.id}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <button
        type="button"
        onClick={onAnalyze}
        disabled={!isValid || isAnalyzing}
        className="w-full h-12 rounded-xl bg-[#169BA2] hover:bg-[#0F7075] text-white text-sm font-bold cursor-pointer inline-flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm hover:shadow-md transition-all"
      >
        {isAnalyzing ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            Đang phân tích...
          </>
        ) : (
          <>
            <Sparkles size={14} />
            Phân tích & gợi ý
          </>
        )}
      </button>
    </div>
  );
}

function Step2({
  data,
  blocks,
  onUpdateBlock,
  onDeleteBlock,
  onBack,
  onSubmit,
  isSubmitting,
}) {
  if (!data) return null;

  const routeColor = getRouteColor(data.route_id);
  const shiftLabel = data.shift_template_id === 1 ? "Ca sáng" : "Ca tối";

  const canSubmit = blocks.length > 0;

  return (
    <div className="p-6 space-y-4">
      <div
        className={`rounded-xl p-4 border ${routeColor.bgLight} ${routeColor.border}`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-lg ${routeColor.bg} flex items-center justify-center flex-shrink-0 shadow-sm`}
          >
            <Sparkles size={16} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div
              className={`text-sm font-bold ${routeColor.textDark} leading-tight`}
            >
              {blocks.length} block · Tuyến {data.route_id} · {shiftLabel}
            </div>
            <div className="text-[11px] text-[#6A7A9A] mt-0.5">
              Tổng {data.total_trips_in_shift || 0} chuyến trong ca
            </div>
          </div>
        </div>
      </div>

      {data.warnings && data.warnings.length > 0 && (
        <div className="rounded-xl border border-[#FCD9A0] bg-[#FEF3E2] p-3 space-y-1.5">
          {data.warnings.map((w, i) => (
            <div
              key={i}
              className="flex items-start gap-2 text-xs text-[#B45309]"
            >
              <AlertTriangle size={12} className="flex-shrink-0 mt-0.5" />
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        {blocks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#D0D7E2] py-12 text-center">
            <div className="text-sm font-medium text-[#4A5A7A] mb-1">
              Không có block nào
            </div>
            <div className="text-xs text-[#8A9AAA]">
              Bấm "Phân tích lại" để gợi ý
            </div>
          </div>
        ) : (
          blocks.map((b, idx) => (
            <BlockCard
              key={idx}
              idx={idx}
              block={b}
              routeColor={routeColor}
              onUpdate={(patch) => onUpdateBlock(idx, patch)}
              onDelete={() => onDeleteBlock(idx)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function BlockCard({ idx, block, routeColor, onUpdate, onDelete }) {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <div className="rounded-xl border border-[#E5EAF0] bg-white overflow-hidden">
      <div className={`h-0.5 ${routeColor.bg}`} />

      <div className="p-3 flex items-center gap-3">
        <div
          className={`w-8 h-8 rounded-lg ${routeColor.bgLight} ${routeColor.textDark} flex items-center justify-center text-sm font-bold flex-shrink-0`}
        >
          {idx + 1}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-[#1A2332] font-mono">
              {block.suggested_vehicle?.vehicle_code ||
                `XE #${block.vehicle_id}`}
            </span>
            {block.suggested_vehicle?.license_plate && (
              <span className="text-[10px] text-[#8A9AAA] font-mono">
                {block.suggested_vehicle.license_plate}
              </span>
            )}
          </div>
          <div className="text-[11px] text-[#6A7A9A] mt-0.5 truncate">
            {block.suggested_driver?.full_name || "Chưa có tài xế"}
            {block.suggested_driver?.employee_code && (
              <span className="text-[#8A9AAA] font-mono ml-1.5">
                ({block.suggested_driver.employee_code})
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 text-[10px] text-[#8A9AAA]">
            <span className="font-mono">
              {fmtTime(block.start_time)} – {fmtTime(block.end_time)}
            </span>
            <span>·</span>
            <span>{block.trip_count} chuyến</span>
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            type="button"
            onClick={() => setEditOpen((v) => !v)}
            title="Chỉnh sửa"
            className="w-7 h-7 rounded-md hover:bg-[#F8FAFC] flex items-center justify-center cursor-pointer"
          >
            <Pencil size={12} className="text-[#6A7A9A]" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            title="Xóa block"
            className="w-7 h-7 rounded-md hover:bg-[#FEF2F2] flex items-center justify-center cursor-pointer"
          >
            <Trash2 size={12} className="text-[#C62828]" />
          </button>
        </div>
      </div>

      {block.warnings && block.warnings.length > 0 && (
        <div className="px-3 pb-2.5 space-y-1">
          {block.warnings.map((w, i) => (
            <div
              key={i}
              className="text-[10px] text-[#B45309] bg-[#FEF3E2] rounded-md px-2 py-1"
            >
              ⚠ {w}
            </div>
          ))}
        </div>
      )}

      {editOpen && (
        <div className="border-t border-[#F0F3F7] bg-[#F8FAFC] p-3 space-y-2 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-[#8A9AAA] block mb-1">
                Giờ bắt đầu
              </label>
              <input
                type="time"
                value={block.start_time}
                onChange={(e) => onUpdate({ start_time: e.target.value })}
                className="w-full h-8 px-2 rounded-md border border-[#D0D7E2] bg-white text-xs font-mono outline-none focus:border-[#169BA2]"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-[#8A9AAA] block mb-1">
                Giờ kết thúc
              </label>
              <input
                type="time"
                value={block.end_time}
                onChange={(e) => onUpdate({ end_time: e.target.value })}
                className="w-full h-8 px-2 rounded-md border border-[#D0D7E2] bg-white text-xs font-mono outline-none focus:border-[#169BA2]"
              />
            </div>
          </div>
          <div className="text-[10px] text-[#8A9AAA] italic">
            Đổi xe / tài xế thực hiện ở drawer chi tiết sau khi tạo.
          </div>
        </div>
      )}
    </div>
  );
}

export function AssignmentWizardDialog({ open, onClose, initialDate }) {
  const [step, setStep] = useState(1);
  const [values, setValues] = useState({
    date: initialDate || "",
    route_id: "",
    shift_template_id: 1,
    depot_id: "",
  });
  const [suggestData, setSuggestData] = useState(null);
  const [blocks, setBlocks] = useState([]);

  const suggestMut = useSuggestBlocks();
  const bulkMut = useBulkCreateAssignments();

  const DEMO_DEPOT_IDS = [5909, 5920, 5929];

  const { data: depotsData } = useStopsList({
    page: 1,
    limit: 500,
    stop_type: 1,
  });

  const depots = useMemo(() => {
    const all = depotsData?.data || [];
    return all.filter((d) => DEMO_DEPOT_IDS.includes(d.id));
  }, [depotsData]);

  const DEMO_ROUTE_IDS = [3];

  const { data: routesData } = useRoutesList({ page: 1, limit: 100 });

  const routes = useMemo(() => {
    const all = routesData?.data || [];
    return all.filter((r) => DEMO_ROUTE_IDS.includes(r.id));
  }, [routesData]);

  useEffect(() => {
    if (!open) {
      setStep(1);
      setSuggestData(null);
      setBlocks([]);
      setValues({
        date: initialDate || "",
        route_id: "",
        shift_template_id: 1,
        depot_id: "",
      });
    }
  }, [open, initialDate]);

  const handleAnalyze = async () => {
    try {
      const payload = {
        date: values.date,
        route_id: parseInt(values.route_id),
        shift_template_id: parseInt(values.shift_template_id),
        depot_id: parseInt(values.depot_id),
      };
      const result = await suggestMut.mutateAsync(payload);
      setSuggestData(result);

      const mapped = (result.suggested_blocks || []).map((b) => ({
        vehicle_id: b.suggested_vehicle?.id || null,
        employee_id: b.suggested_driver?.id || null,
        co_driver_id: b.suggested_co_driver?.id || null,
        start_time: b.start_time,
        end_time: b.end_time,
        trip_count: b.trip_count,
        trip_codes: b.trip_codes || [],
        suggested_vehicle: b.suggested_vehicle,
        suggested_driver: b.suggested_driver,
        suggested_co_driver: b.suggested_co_driver,
        warnings: b.warnings || [],
      }));
      setBlocks(mapped);
      setStep(2);
    } catch (err) {}
  };

  const handleUpdateBlock = (idx, patch) => {
    setBlocks((prev) =>
      prev.map((b, i) => (i === idx ? { ...b, ...patch } : b)),
    );
  };

  const handleDeleteBlock = (idx) => {
    setBlocks((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleReAnalyze = async () => {
    setBlocks([]);
    setSuggestData(null);
    setStep(1);
  };

  const handleSubmit = async () => {
    const invalid = blocks.find((b) => !b.vehicle_id || !b.employee_id);
    if (invalid) {
      alert("Có block chưa đủ xe hoặc tài xế. Vui lòng kiểm tra lại.");
      return;
    }

    try {
      const payload = {
        date: values.date,
        route_id: parseInt(values.route_id),
        shift_template_id: parseInt(values.shift_template_id),
        depot_id: parseInt(values.depot_id),
        blocks: blocks.map((b) => ({
          vehicle_id: parseInt(b.vehicle_id),
          employee_id: parseInt(b.employee_id),
          co_driver_id: b.co_driver_id ? parseInt(b.co_driver_id) : null,
          start_time: b.start_time,
          end_time: b.end_time,
        })),
      };
      await bulkMut.mutateAsync(payload);
      onClose?.();
    } catch (err) {}
  };

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 z-[1000] animate-in fade-in"
        onClick={onClose}
      />
      <div
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1010] bg-white rounded-2xl shadow-2xl w-full max-w-[720px] max-h-[88vh] flex flex-col animate-in zoom-in-95"
        style={{ animationDuration: "0.2s" }}
      >
        <header className="flex-shrink-0 border-b border-[#E5EAF0] px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-[#1A2332]">
                Tạo phân công
              </h2>
              <p className="text-[11px] text-[#8A9AAA] mt-0.5">
                {step === 1
                  ? "Chọn ngày, tuyến, ca và depot để hệ thống gợi ý"
                  : `${blocks.length} block sẽ được tạo`}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-md hover:bg-[#F8FAFC] flex items-center justify-center cursor-pointer flex-shrink-0"
            >
              <X size={16} className="text-[#6A7A9A]" />
            </button>
          </div>

          <div className="flex items-center gap-2 mt-4">
            {STEPS.map((s, i) => {
              const isActive = step === s.id;
              const isDone = step > s.id;
              return (
                <div key={s.id} className="flex items-center gap-2 flex-1">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 transition-all ${
                      isDone
                        ? "bg-[#169BA2] text-white"
                        : isActive
                          ? "bg-[#169BA2] text-white ring-4 ring-[#169BA2]/15"
                          : "bg-[#F8FAFC] text-[#8A9AAA] border border-[#E5EAF0]"
                    }`}
                  >
                    {isDone ? <CheckCircle2 size={12} /> : s.id}
                  </div>
                  <span
                    className={`text-[11px] font-semibold ${
                      isActive || isDone ? "text-[#1A2332]" : "text-[#8A9AAA]"
                    }`}
                  >
                    {s.label}
                  </span>
                  {i < STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-px ${
                        isDone ? "bg-[#169BA2]" : "bg-[#E5EAF0]"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {step === 1 && (
            <Step1
              values={values}
              onChange={(patch) => setValues((v) => ({ ...v, ...patch }))}
              onAnalyze={handleAnalyze}
              isAnalyzing={suggestMut.isPending}
              depots={depots}
              routes={routes}
            />
          )}
          {step === 2 && (
            <Step2
              data={{ ...suggestData, ...values }}
              blocks={blocks}
              onUpdateBlock={handleUpdateBlock}
              onDeleteBlock={handleDeleteBlock}
              onBack={handleReAnalyze}
              onSubmit={handleSubmit}
              isSubmitting={bulkMut.isPending}
            />
          )}
        </div>

        {step === 2 && (
          <footer className="flex-shrink-0 border-t border-[#E5EAF0] bg-[#F8FAFC] px-6 py-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleReAnalyze}
              disabled={bulkMut.isPending}
              className="h-10 px-4 rounded-lg border border-[#D0D7E2] bg-white hover:bg-[#F8FAFC] text-sm font-semibold text-[#4A5A7A] cursor-pointer inline-flex items-center gap-2 disabled:opacity-50"
            >
              <ArrowLeft size={14} />
              Chọn lại
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={bulkMut.isPending}
                className="h-10 px-4 rounded-lg border border-[#D0D7E2] bg-white hover:bg-[#F8FAFC] text-sm font-semibold text-[#4A5A7A] cursor-pointer disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={bulkMut.isPending || blocks.length === 0}
                className="h-10 px-5 rounded-lg bg-[#169BA2] hover:bg-[#0F7075] text-white text-sm font-bold cursor-pointer inline-flex items-center gap-2 disabled:opacity-50 shadow-sm hover:shadow-md transition-all"
              >
                {bulkMut.isPending ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} />
                    Tạo {blocks.length} block
                  </>
                )}
              </button>
            </div>
          </footer>
        )}
      </div>
    </>
  );
}
