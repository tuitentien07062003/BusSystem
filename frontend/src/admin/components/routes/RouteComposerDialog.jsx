import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import {
  ArrowLeft,
  Loader2,
  Save,
  MapPin,
  Search,
  X,
  GripVertical,
  Check,
  Info,
  Ruler,
  Clock,
  ListOrdered,
  ArrowRight,
  Building2,
  AlertTriangle,
  Plus,
  Map as MapIcon,
  Route as RouteIcon,
} from "lucide-react";
import {
  useDepotsForComposer,
  useSearchStopsForComposer,
  usePreviewRoute,
  useSaveComposedRoute,
  useUpdateRoute,
} from "@/hooks/useRoutes";
import { useAgenciesList } from "@/hooks/useAgencies";
import { RoutePreviewMap } from "./RoutePreviewMap";
import { RoadPickerDialog } from "./RoadPickerDialog";
// Inline Vietnamese normalizer (tránh dependency)
const VI_MAP = {
  à: "a",
  á: "a",
  ạ: "a",
  ả: "a",
  ã: "a",
  â: "a",
  ầ: "a",
  ấ: "a",
  ậ: "a",
  ẩ: "a",
  ẫ: "a",
  ă: "a",
  ằ: "a",
  ắ: "a",
  ặ: "a",
  ẳ: "a",
  ẵ: "a",
  è: "e",
  é: "e",
  ẹ: "e",
  ẻ: "e",
  ẽ: "e",
  ê: "e",
  ề: "e",
  ế: "e",
  ệ: "e",
  ể: "e",
  ễ: "e",
  ì: "i",
  í: "i",
  ị: "i",
  ỉ: "i",
  ĩ: "i",
  ò: "o",
  ó: "o",
  ọ: "o",
  ỏ: "o",
  õ: "o",
  ô: "o",
  ồ: "o",
  ố: "o",
  ộ: "o",
  ổ: "o",
  ỗ: "o",
  ơ: "o",
  ờ: "o",
  ớ: "o",
  ợ: "o",
  ở: "o",
  ỡ: "o",
  ù: "u",
  ú: "u",
  ụ: "u",
  ủ: "u",
  ũ: "u",
  ư: "u",
  ừ: "u",
  ứ: "u",
  ự: "u",
  ử: "u",
  ữ: "u",
  ỳ: "y",
  ý: "y",
  ỵ: "y",
  ỷ: "y",
  ỹ: "y",
  đ: "d",
};
function viNorm(s) {
  if (!s) return "";
  return String(s)
    .toLowerCase()
    .split("")
    .map((c) => VI_MAP[c] || c)
    .join("");
}
function viMatch(text, kw) {
  if (!kw) return true;
  return viNorm(text).includes(viNorm(kw));
}

import { matchesSearch, normalizeVietnamese } from "@/lib/vietnamese";

// ═══════════════════════════════════════════════════════════════
// Helper components
// ═══════════════════════════════════════════════════════════════
function Field({ label, required, children, hint }) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1 text-xs font-semibold text-slate-700">
        {label}
        {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] text-slate-400">{hint}</p>}
    </div>
  );
}

function Input({ error, ...props }) {
  return (
    <input
      {...props}
      className={`w-full h-10 px-3.5 rounded-lg border bg-white text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all duration-200 ${
        error
          ? "border-rose-300 focus:border-rose-400 focus:ring-2 focus:ring-rose-500/10"
          : "border-slate-200 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
      }`}
    />
  );
}

function Stepper({ step, onStepChange, canGoReturn }) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onStepChange("go")}
        className="flex items-center gap-2.5 group"
      >
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 ${
            step === "go"
              ? "bg-teal-700 text-white shadow-sm"
              : "bg-teal-50 text-teal-700 border border-teal-200"
          }`}
        >
          {step === "return" ? <Check size={13} /> : "1"}
        </div>
        <span
          className={`text-sm font-semibold transition-colors ${
            step === "go"
              ? "text-slate-900"
              : "text-slate-500 group-hover:text-slate-700"
          }`}
        >
          Chiều đi
        </span>
      </button>

      <div className="flex-1 h-px bg-slate-200 relative">
        <div
          className="absolute inset-y-0 left-0 bg-teal-700 transition-all duration-500 rounded-full"
          style={{ width: step === "return" ? "100%" : "0%" }}
        />
      </div>

      <button
        type="button"
        onClick={() => canGoReturn && onStepChange("return")}
        disabled={!canGoReturn}
        className="flex items-center gap-2.5 group disabled:cursor-not-allowed"
      >
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 ${
            step === "return"
              ? "bg-teal-700 text-white shadow-sm"
              : canGoReturn
                ? "bg-slate-100 text-slate-500 border border-slate-200 group-hover:bg-slate-200"
                : "bg-slate-100 text-slate-300 border border-slate-100"
          }`}
        >
          2
        </div>
        <span
          className={`text-sm font-semibold transition-colors ${
            step === "return"
              ? "text-slate-900"
              : canGoReturn
                ? "text-slate-500 group-hover:text-slate-700"
                : "text-slate-300"
          }`}
        >
          Chiều về
        </span>
      </button>
    </div>
  );
}

function Metric({ icon: Icon, label, value, accent }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
          accent ? "bg-teal-50 text-teal-700" : "bg-slate-100 text-slate-600"
        }`}
      >
        <Icon size={14} />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
          {label}
        </div>
        <div className="text-sm font-bold text-slate-900 leading-tight truncate">
          {value}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Main component
// ═══════════════════════════════════════════════════════════════
export function RouteComposerDialog({ route, open, onOpenChange }) {
  const isEdit = !!route;
  const [entered, setEntered] = useState(false);

  const { data: depots = [], isLoading: loadingDepots } =
    useDepotsForComposer();
  const { data: agenciesData } = useAgenciesList({ page: 1, limit: 100 });
  const agencies = agenciesData?.data || [];

  // ── Wizard state ──
  const [step, setStep] = useState("go");

  // Route info (persist across steps)
  const [routeId, setRouteId] = useState("");
  const [routeShortName, setRouteShortName] = useState("");
  const [routeFullName, setRouteFullName] = useState("");
  const [routeColor, setRouteColor] = useState("#169BA2");
  const [agencyId, setAgencyId] = useState(null);
  const [isActive, setIsActive] = useState(true);
  const [formErrors, setFormErrors] = useState({});

  // GO direction
  const [goDepot, setGoDepot] = useState({ start: null, end: null });
  const [goStops, setGoStops] = useState([]); // ordered array of stop objects
  const [goVia, setGoVia] = useState([]);
  const [goPreview, setGoPreview] = useState(null);

  // RETURN direction
  const [retDepot, setRetDepot] = useState({ start: null, end: null });
  const [retStops, setRetStops] = useState([]);
  const [retVia, setRetVia] = useState([]);
  const [retPreview, setRetPreview] = useState(null);

  // Search
  const [searchInput, setSearchInput] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");

  // Hover/focus
  const [hoveredStop, setHoveredStop] = useState(null);
  const [focusedStop, setFocusedStop] = useState(null);

  // Drag reorder
  const [draggedIdx, setDraggedIdx] = useState(null);

  // Road override picker
  const [roadPickerStop, setRoadPickerStop] = useState(null);
  const [roadOverrides, setRoadOverrides] = useState({}); // { stop_id: override_data }

  const previewMut = usePreviewRoute();
  const saveMut = useSaveComposedRoute();
  const updateMut = useUpdateRoute();
  const requestIdRef = useRef(0);
  const previewCacheRef = useRef(new Map());

  // ── Current step shortcuts ──
  const cur =
    step === "go"
      ? { depot: goDepot, stops: goStops, via: goVia, preview: goPreview }
      : { depot: retDepot, stops: retStops, via: retVia, preview: retPreview };

  const setCur =
    step === "go"
      ? {
          setDepot: setGoDepot,
          setStops: setGoStops,
          setVia: setGoVia,
          setPreview: setGoPreview,
        }
      : {
          setDepot: setRetDepot,
          setStops: setRetStops,
          setVia: setRetVia,
          setPreview: setRetPreview,
        };

  const canSearchStops = !!(
    cur.depot.start &&
    cur.depot.end &&
    cur.depot.start !== cur.depot.end
  );
  const selectedIds = useMemo(
    () => new Set(cur.stops.map((s) => s.id)),
    [cur.stops],
  );

  // ── Entry animation ──
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => setEntered(true), 10);
      return () => clearTimeout(t);
    }
    setEntered(false);
  }, [open]);

  // ── Debounce search ──
  useEffect(() => {
    const t = setTimeout(() => setSearchKeyword(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data: searchResults = [], isFetching: isSearching } =
    useSearchStopsForComposer(searchKeyword, 50, canSearchStops);

  // ── Reset khi mở ──
  useEffect(() => {
    if (open) {
      setStep("go");
      setGoDepot({ start: null, end: null });
      setGoStops([]);
      setGoVia([]);
      setGoPreview(null);
      setRetDepot({ start: null, end: null });
      setRetStops([]);
      setRetVia([]);
      setRetPreview(null);
      setSearchInput("");
      setSearchKeyword("");
      setHoveredStop(null);
      setFocusedStop(null);
      setFormErrors({});
      previewCacheRef.current.clear();

      if (route) {
        setRouteId(route.route_id || "");
        setRouteShortName(route.route_short_name || "");
        setRouteFullName(route.route_full_name || "");
        setRouteColor(route.route_color || "#169BA2");
        setAgencyId(route.agency_id ?? null);
        setIsActive(route.is_active ?? true);
      } else {
        setRouteId("");
        setRouteShortName("");
        setRouteFullName("");
        setRouteColor("#169BA2");
        setAgencyId(null);
        setIsActive(true);
      }
    }
  }, [open, route]);

  // ── Preview effect ──
  useEffect(() => {
    if (isEdit) return;
    if (
      !cur.depot.start ||
      !cur.depot.end ||
      cur.depot.start === cur.depot.end
    ) {
      setCur.setPreview(null);
      return;
    }
    const sortedIds = cur.stops.map((s) => s.id);
    const viaKey = cur.via
      .map((v) => `${v.latitude.toFixed(5)},${v.longitude.toFixed(5)}`)
      .join(";");
    const overrideKey = sortedIds
      .map((id) => `${id}:${roadOverrides[id]?.road_id || "auto"}`)
      .join(",");
    const key = `${step}|${cur.depot.start}|${cur.depot.end}|${sortedIds.join(",")}|${viaKey}|${overrideKey}`;

    const cached = previewCacheRef.current.get(key);
    if (cached) {
      setCur.setPreview(cached);
      return;
    }

    const myReqId = ++requestIdRef.current;
    const t = setTimeout(() => {
      previewMut.mutate(
        {
          start_depot_id: cur.depot.start,
          end_depot_id: cur.depot.end,
          stop_ids: sortedIds,
          via_points: cur.via,
        },
        {
          onSuccess: (data) => {
            previewCacheRef.current.set(key, data);
            if (myReqId === requestIdRef.current) setCur.setPreview(data);
          },
        },
      );
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    step,
    cur.depot.start,
    cur.depot.end,
    cur.stops,
    cur.via,
    isEdit,
    roadOverrides,
  ]);

  // ── Stop handlers ──
  const handleToggleStop = useCallback(
    (stop) => {
      setCur.setStops((prev) => {
        const exists = prev.some((s) => s.id === stop.id);
        if (exists) return prev.filter((s) => s.id !== stop.id);
        return [...prev, stop];
      });
      setCur.setVia([]);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [step],
  );

  const handleRemoveStop = useCallback(
    (id) => {
      setCur.setStops((prev) => prev.filter((s) => s.id !== id));
      setCur.setVia([]);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [step],
  );

  const handleReorder = useCallback(
    (from, to) => {
      if (from === to) return;
      setCur.setStops((prev) => {
        const next = [...prev];
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        return next;
      });
      setCur.setVia([]);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [step],
  );

  const handleClearAll = useCallback(() => {
    setCur.setStops([]);
    setCur.setVia([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const handleStartChange = useCallback(
    (id) => {
      setCur.setDepot((p) => ({ ...p, start: id }));
      setCur.setPreview(null);
      setCur.setVia([]);
      setFocusedStop(null);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [step],
  );

  const handleEndChange = useCallback(
    (id) => {
      setCur.setDepot((p) => ({ ...p, end: id }));
      setCur.setPreview(null);
      setCur.setVia([]);
      setFocusedStop(null);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [step],
  );

  const isFormValid = !!(
    routeId.trim() &&
    routeShortName.trim() &&
    routeFullName.trim()
  );

  const canContinue = !!(
    goPreview &&
    goDepot.start &&
    goDepot.end &&
    goDepot.start !== goDepot.end &&
    isFormValid
  );

  const canSubmit = !!(
    retPreview &&
    retDepot.start &&
    retDepot.end &&
    retDepot.start !== retDepot.end
  );
  // (không gọi setState trong render)

  // ── Actions ──
  const handleClose = () => {
    setEntered(false);
    setTimeout(() => onOpenChange(false), 200);
  };

  const handleContinue = () => {
    if (!canContinue) {
      const errs = {};
      if (!routeId.trim()) errs.routeId = "Bắt buộc";
      if (!routeShortName.trim()) errs.routeShortName = "Bắt buộc";
      if (!routeFullName.trim()) errs.routeFullName = "Bắt buộc";
      setFormErrors(errs);
      return;
    }
    setStep("return");
    setSearchInput("");
    setSearchKeyword("");
    setFocusedStop(null);
  };

  const handleSubmit = async () => {
    if (isEdit) {
      await updateMut.mutateAsync({
        id: route.id,
        payload: {
          route_short_name: routeShortName,
          route_full_name: routeFullName,
          route_color: routeColor,
          agency_id: agencyId,
          is_active: isActive,
        },
      });
      handleClose();
      return;
    }

    if (!canContinue || !canSubmit) return;

    await saveMut.mutateAsync({
      route_id: routeId,
      route_short_name: routeShortName,
      route_full_name: routeFullName,
      route_color: routeColor,
      agency_id: agencyId,
      is_active: isActive,
      directions: [
        {
          direction_id: 0,
          start_depot_id: goDepot.start,
          end_depot_id: goDepot.end,
          stop_ids: goStops.map((s) => s.id),
          via_points: goVia,
        },
        {
          direction_id: 1,
          start_depot_id: retDepot.start,
          end_depot_id: retDepot.end,
          stop_ids: retStops.map((s) => s.id),
          via_points: retVia,
        },
      ],
    });
    handleClose();
  };

  const startDepot = useMemo(
    () => depots.find((d) => d.id === cur.depot.start),
    [depots, cur.depot.start],
  );
  const endDepot = useMemo(
    () => depots.find((d) => d.id === cur.depot.end),
    [depots, cur.depot.end],
  );

  if (!open) return null;

  const isSubmitting = saveMut.isPending || updateMut.isPending;

  return (
    <div
      className={`fixed inset-0 z-[100] bg-slate-50 flex flex-col transition-all duration-300 ease-out ${
        entered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
    >
      {/* ═══════════ TOP BAR ═══════════ */}
      <header className="h-14 flex-shrink-0 border-b border-slate-200 bg-white flex items-center px-5 gap-3 z-20">
        <button
          type="button"
          onClick={handleClose}
          className="h-9 w-9 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors group"
          title="Quay lại"
        >
          <ArrowLeft
            size={18}
            className="text-slate-600 group-hover:text-slate-900 transition-colors"
          />
        </button>

        <div className="w-px h-6 bg-slate-200" />

        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-teal-700 flex items-center justify-center">
            <RouteIcon size={16} className="text-white" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-slate-900 leading-tight">
              {isEdit ? `Chỉnh sửa tuyến #${route.id}` : "Thêm tuyến mới"}
            </div>
            <div className="text-[11px] text-slate-500 leading-tight truncate">
              {routeShortName || "Chưa có tên"}
            </div>
          </div>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          {cur.preview?.routing_engine && (
            <div
              className={`px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider ${
                cur.preview.routing_engine === "osrm"
                  ? "bg-teal-50 text-teal-700 border border-teal-200"
                  : "bg-amber-50 text-amber-700 border border-amber-200"
              }`}
            >
              {cur.preview.routing_engine === "osrm" ? "OSRM" : "Fallback"}
            </div>
          )}
        </div>
      </header>

      {/* ═══════════ BODY ═══════════ */}
      <div className="flex-1 flex overflow-hidden">
        {/* ───── LEFT SIDEBAR (Config) ───── */}
        <aside className="w-[520px] flex-shrink-0 bg-white border-r border-slate-200 flex flex-col">
          {/* Stepper */}
          {!isEdit && (
            <div className="flex-shrink-0 px-6 pt-5 pb-4 border-b border-slate-100">
              <Stepper
                step={step}
                onStepChange={setStep}
                canGoReturn={!!goPreview}
              />
            </div>
          )}

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto">
            {/* ── Route info (only step GO or edit) ── */}
            {(step === "go" || isEdit) && (
              <section className="p-6 space-y-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <RouteIcon size={13} className="text-slate-400" />
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Thông tin tuyến
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Mã tuyến" required>
                    <Input
                      value={routeId}
                      onChange={(e) => setRouteId(e.target.value)}
                      placeholder="R_19"
                      disabled={isEdit}
                      error={formErrors.routeId}
                    />
                  </Field>
                  <Field label="Tên ngắn" required>
                    <Input
                      value={routeShortName}
                      onChange={(e) => setRouteShortName(e.target.value)}
                      placeholder="Tuyến 19"
                      error={formErrors.routeShortName}
                    />
                  </Field>
                </div>

                <Field label="Tên đầy đủ" required>
                  <Input
                    value={routeFullName}
                    onChange={(e) => setRouteFullName(e.target.value)}
                    placeholder="Bến Thành - KTX ĐH Quốc Gia"
                    error={formErrors.routeFullName}
                  />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Màu tuyến">
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={routeColor}
                        onChange={(e) => setRouteColor(e.target.value)}
                        className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer flex-shrink-0"
                      />
                      <Input
                        value={routeColor}
                        onChange={(e) => setRouteColor(e.target.value)}
                        placeholder="#169BA2"
                        className="font-mono text-xs"
                      />
                    </div>
                  </Field>
                  <Field label="Nhà vận hành">
                    <div className="relative">
                      <Building2
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                      />
                      <select
                        value={agencyId ?? ""}
                        onChange={(e) =>
                          setAgencyId(
                            e.target.value ? Number(e.target.value) : null,
                          )
                        }
                        className="w-full h-10 pl-9 pr-8 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 outline-none cursor-pointer focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 transition-all appearance-none"
                      >
                        <option value="">— Không chọn —</option>
                        {agencies.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.agency_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </Field>
                </div>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-teal-700 focus:ring-teal-600/20 cursor-pointer"
                  />
                  <span className="text-xs font-medium text-slate-700">
                    Đang hoạt động
                  </span>
                </label>
              </section>
            )}

            {/* ── Metadata recall on step RETURN ── */}
            {step === "return" && !isEdit && (
              <section className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                <div className="flex items-center gap-2 mb-2">
                  <Check size={12} className="text-teal-700" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Thông tin đã nhập
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                  <span className="font-mono font-bold text-slate-900">
                    {routeId}
                  </span>
                  <span className="text-slate-400">·</span>
                  <span className="text-slate-700">{routeShortName}</span>
                  <span className="text-slate-400">·</span>
                  <span
                    className="w-3 h-3 rounded border border-slate-200"
                    style={{ background: routeColor }}
                  />
                </div>
              </section>
            )}

            {/* ── Depots ── */}
            {!isEdit && (
              <section className="p-6 space-y-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <MapPin size={13} className="text-slate-400" />
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Điểm đầu & cuối
                  </h3>
                </div>

                {loadingDepots ? (
                  <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
                    <Loader2 size={12} className="animate-spin" />
                    Đang tải depot...
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <DepotRow
                      label="Điểm đầu"
                      badge="A"
                      badgeColor="bg-teal-700"
                      value={cur.depot.start}
                      depots={depots}
                      onChange={handleStartChange}
                      placeholder="Chọn depot xuất phát"
                    />
                    <DepotRow
                      label="Điểm cuối"
                      badge="B"
                      badgeColor="bg-rose-600"
                      value={cur.depot.end}
                      depots={depots}
                      onChange={handleEndChange}
                      placeholder="Chọn depot kết thúc"
                      disabled={!cur.depot.start}
                    />
                    {cur.depot.start &&
                      cur.depot.end &&
                      cur.depot.start === cur.depot.end && (
                        <div className="flex items-start gap-1.5 px-2.5 py-2 rounded-lg bg-rose-50 border border-rose-200 text-[11px] text-rose-700">
                          <AlertTriangle
                            size={12}
                            className="flex-shrink-0 mt-0.5"
                          />
                          <span>Điểm đầu và điểm cuối phải khác nhau</span>
                        </div>
                      )}
                  </div>
                )}
              </section>
            )}

            {/* ── Stops section ── */}
            {!isEdit && (
              <section className="p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ListOrdered size={13} className="text-slate-400" />
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Trạm dừng
                    </h3>
                  </div>
                  {previewMut.isPending && (
                    <div className="flex items-center gap-1 text-[10px] text-teal-700">
                      <Loader2 size={10} className="animate-spin" />
                      Đang tính...
                    </div>
                  )}
                </div>

                {!canSearchStops ? (
                  <div className="rounded-xl border border-dashed border-slate-200 p-5 text-center text-xs text-slate-400">
                    Chọn điểm đầu và điểm cuối để bắt đầu thêm trạm
                  </div>
                ) : (
                  <>
                    {/* Search bar */}
                    <div className="relative">
                      <Search
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                      />
                      <input
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        placeholder="Tìm trạm theo tên hoặc mã..."
                        className="w-full h-10 pl-9 pr-9 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 transition-all"
                      />
                      {isSearching ? (
                        <Loader2
                          size={13}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-teal-700 animate-spin"
                        />
                      ) : searchInput ? (
                        <button
                          type="button"
                          onClick={() => setSearchInput("")}
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
                        >
                          <X size={12} />
                        </button>
                      ) : null}
                    </div>

                    {/* Search results */}
                    <div className="rounded-xl border border-slate-200 overflow-hidden">
                      <div className="px-3 py-2 bg-slate-50 border-b border-slate-100">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          {searchKeyword
                            ? `Kết quả (${searchResults.length})`
                            : "Gợi ý trạm"}
                        </span>
                      </div>
                      <div className="divide-y divide-slate-50">
                        {searchResults.length === 0 ? (
                          <div className="px-3 py-8 text-center text-xs text-slate-400">
                            {isSearching
                              ? "Đang tìm..."
                              : searchKeyword
                                ? "Không có kết quả"
                                : "Nhập để tìm trạm"}
                          </div>
                        ) : (
                          searchResults.map((s) => {
                            const checked = selectedIds.has(s.id);
                            return (
                              <button
                                key={s.id}
                                type="button"
                                onClick={() => handleToggleStop(s)}
                                onMouseEnter={() => setHoveredStop(s)}
                                onMouseLeave={() => setHoveredStop(null)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors group ${
                                  checked
                                    ? "bg-teal-50/60 border-l-2 border-l-teal-700"
                                    : "hover:bg-slate-50 border-l-2 border-l-transparent"
                                }`}
                              >
                                <div
                                  className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                    checked
                                      ? "bg-teal-700 border-teal-700"
                                      : "border-slate-300 group-hover:border-teal-600"
                                  }`}
                                >
                                  {checked && (
                                    <Check
                                      size={10}
                                      className="text-white"
                                      strokeWidth={3}
                                    />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs font-semibold text-slate-900 truncate">
                                    {s.stop_name}
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-mono">
                                    {s.stop_id}
                                  </div>
                                </div>
                                {checked && (
                                  <span className="text-[10px] font-bold text-teal-700">
                                    #
                                    {cur.stops.findIndex((x) => x.id === s.id) +
                                      1}
                                  </span>
                                )}
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Selected stops — reorderable */}
                {cur.stops.length > 0 && (
                  <div className="rounded-xl border border-slate-200 overflow-hidden">
                    <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Đã chọn ({cur.stops.length})
                      </span>
                      <button
                        type="button"
                        onClick={handleClearAll}
                        className="text-[10px] font-semibold text-rose-600 hover:text-rose-700 cursor-pointer"
                      >
                        Bỏ chọn tất cả
                      </button>
                    </div>
                    <div className="divide-y divide-slate-50">
                      {cur.stops.map((s, idx) => (
                        <SelectedStopRow
                          key={s.id}
                          stop={s}
                          index={idx}
                          total={cur.stops.length}
                          onRemove={() => handleRemoveStop(s.id)}
                          onHover={setHoveredStop}
                          onFocus={setFocusedStop}
                          onPickRoad={() => setRoadPickerStop(s)}
                          hasOverride={!!roadOverrides[s.id]}
                          overrideInfo={roadOverrides[s.id]}
                          hoveredId={hoveredStop?.id}
                          focusedId={focusedStop?.id}
                          isDragging={draggedIdx === idx}
                          onDragStart={() => setDraggedIdx(idx)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => {
                            if (draggedIdx != null && draggedIdx !== idx) {
                              handleReorder(draggedIdx, idx);
                            }
                            setDraggedIdx(null);
                          }}
                          onDragEnd={() => setDraggedIdx(null)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* ── Edit mode info ── */}
            {isEdit && (
              <section className="px-6 py-5 border-t border-slate-100">
                <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800">
                  <Info size={12} className="flex-shrink-0 mt-0.5" />
                  <span>
                    Chỉ có thể sửa tên và màu. Để sửa lộ trình, xoá và tạo tuyến
                    mới.
                  </span>
                </div>
              </section>
            )}
          </div>

          {/* ── Footer: Summary + Actions ── */}
          <footer className="flex-shrink-0 border-t border-slate-200 bg-white">
            {/* Metrics */}
            {cur.preview && (
              <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/50">
                <div className="grid grid-cols-3 gap-3">
                  <Metric
                    icon={Ruler}
                    label="Quãng đường"
                    value={`${(cur.preview.total_distance_m / 1000).toFixed(1)} km`}
                    accent
                  />
                  <Metric
                    icon={Clock}
                    label="Thời gian"
                    value={`${Math.floor(cur.preview.estimated_duration_sec / 60)} phút`}
                    accent
                  />
                  <Metric
                    icon={ListOrdered}
                    label="Số trạm"
                    value={`${cur.stops.length + 2}`}
                  />
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="px-6 py-4 flex items-center gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="h-11 px-5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 disabled:opacity-50 cursor-pointer"
              >
                Hủy
              </button>

              <div className="flex-1" />

              {isEdit ? (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="h-11 px-6 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold flex items-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm hover:shadow-md"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save size={14} /> Lưu thay đổi
                    </>
                  )}
                </button>
              ) : step === "go" ? (
                <button
                  type="button"
                  onClick={handleContinue}
                  disabled={!canContinue}
                  className="h-11 px-6 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold flex items-center gap-2 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-sm hover:shadow-md"
                >
                  Tiếp tục sang chiều về
                  <ArrowRight size={14} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !canSubmit}
                  className="h-11 px-6 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold flex items-center gap-2 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-sm hover:shadow-md"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Đang lưu...
                    </>
                  ) : (
                    <>
                      <Check size={14} /> Tạo tuyến
                    </>
                  )}
                </button>
              )}
            </div>
          </footer>
        </aside>

        {/* ───── RIGHT PANEL (Map) ───── */}
        <main className="flex-1 bg-slate-100 p-5 relative">
          <div className="h-full rounded-2xl overflow-hidden shadow-sm border border-slate-200 bg-white relative">
            {/* Map content */}
            <RoutePreviewMap
              preview={cur.preview}
              startDepot={startDepot}
              endDepot={endDepot}
              hoveredStop={hoveredStop}
              focusedStop={focusedStop}
              viaPoints={cur.via}
              onAddViaPoint={(vp) => setCur.setVia((prev) => [...prev, vp])}
              onMoveViaPoint={(idx, vp) =>
                setCur.setVia((prev) =>
                  prev.map((p, i) => (i === idx ? vp : p)),
                )
              }
              onRemoveViaPoint={(idx) =>
                setCur.setVia((prev) => prev.filter((_, i) => i !== idx))
              }
              readOnly={isEdit}
            />

            {/* Overlay top-right: hovered/focused info */}
            {(hoveredStop || focusedStop) && (
              <div className="absolute top-4 right-4 z-[400] px-3 py-2 rounded-lg bg-white/95 backdrop-blur border border-slate-200 shadow-lg">
                <div className="flex items-center gap-2">
                  <MapPin size={12} className="text-teal-700" />
                  <span className="text-xs font-semibold text-slate-900">
                    {(focusedStop || hoveredStop).stop_name}
                  </span>
                </div>
              </div>
            )}

            {/* Empty state */}
            {!cur.preview && !startDepot && !endDepot && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[300]">
                <div className="px-5 py-4 rounded-xl bg-white/90 backdrop-blur border border-slate-200 shadow-lg">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center">
                      <MapPin size={16} className="text-teal-700" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">
                        Chọn điểm đầu và cuối
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Bản đồ sẽ hiển thị lộ trình ngay khi có đủ thông tin
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Road override picker */}
      <RoadPickerDialog
        open={!!roadPickerStop}
        stop={roadPickerStop}
        currentOverride={
          roadPickerStop ? roadOverrides[roadPickerStop.id] : null
        }
        onClose={() => setRoadPickerStop(null)}
        onSaved={async () => {
          if (!roadPickerStop) return;
          const { getStopOverride } = await import("@/api/stopsApi");
          try {
            const ov = await getStopOverride(roadPickerStop.id);
            previewCacheRef.current.clear();
            setRoadOverrides((prev) => {
              const next = { ...prev };
              if (ov) next[roadPickerStop.id] = ov;
              else delete next[roadPickerStop.id];
              return next;
            });
          } catch (e) {
            console.warn("Failed to reload override", e);
          }
        }}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════════════════
function DepotRow({
  label,
  badge,
  badgeColor,
  value,
  depots,
  onChange,
  placeholder,
  disabled,
}) {
  const [open, setOpen] = useState(false);
  const [kw, setKw] = useState("");
  const selected = depots.find((d) => d.id === value);

  const filtered = useMemo(() => {
    if (!kw.trim()) return depots;
    return depots.filter(
      (d) => viMatch(d.stop_name, kw) || viMatch(String(d.stop_id), kw),
    );
  }, [depots, kw]);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
        <span
          className={`w-4 h-4 rounded-full ${badgeColor} text-white text-[9px] font-bold flex items-center justify-center`}
        >
          {badge}
        </span>
        {label}
      </div>

      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((v) => !v)}
          className={`w-full h-10 px-3.5 rounded-lg border bg-white text-sm text-left flex items-center justify-between gap-2 transition-all ${
            disabled
              ? "border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed"
              : "border-slate-200 hover:border-teal-600 cursor-pointer focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
          }`}
        >
          {selected ? (
            <span className="flex items-center gap-2 min-w-0">
              <MapPin size={12} className="text-teal-700 flex-shrink-0" />
              <span className="truncate font-medium text-slate-900">
                {selected.stop_name}
              </span>
              <span className="text-[10px] text-slate-400 font-mono flex-shrink-0">
                {selected.stop_id}
              </span>
            </span>
          ) : (
            <span className="text-slate-400">{placeholder}</span>
          )}
          {selected && !disabled && (
            <X
              size={13}
              className="text-slate-400 hover:text-rose-600 flex-shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
              }}
            />
          )}
        </button>

        {open && !disabled && (
          <>
            <div
              className="fixed inset-0 z-[200]"
              onClick={() => setOpen(false)}
            />
            <div className="absolute top-full left-0 right-0 mt-1.5 z-[210] bg-white rounded-lg border border-slate-200 shadow-xl overflow-hidden">
              <div className="p-2 border-b border-slate-100">
                <div className="relative">
                  <Search
                    size={12}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    value={kw}
                    onChange={(e) => setKw(e.target.value)}
                    placeholder="Tìm depot..."
                    autoFocus
                    className="w-full h-8 pl-7 pr-2 rounded border border-slate-200 text-xs outline-none focus:border-teal-600"
                  />
                </div>
              </div>
              <div className="max-h-[220px] overflow-y-auto">
                {filtered.length === 0 ? (
                  <div className="px-3 py-6 text-center text-xs text-slate-400">
                    Không có kết quả
                  </div>
                ) : (
                  filtered.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => {
                        onChange(d.id);
                        setOpen(false);
                        setKw("");
                      }}
                      className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-xs hover:bg-slate-50 cursor-pointer ${
                        value === d.id ? "bg-teal-50" : ""
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="font-medium text-slate-900 truncate">
                          {d.stop_name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {d.stop_id}
                        </div>
                      </div>
                      {value === d.id && (
                        <Check
                          size={12}
                          className="text-teal-700 flex-shrink-0"
                        />
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SelectedStopRow({
  stop,
  index,
  total,
  onRemove,
  onHover,
  onFocus,
  onPickRoad,
  hasOverride,
  overrideInfo,
  hoveredId,
  focusedId,
  isDragging,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}) {
  const isHovered = hoveredId === stop.id;
  const isFocused = focusedId === stop.id;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      onMouseEnter={() => onHover?.(stop)}
      onMouseLeave={() => onHover?.(null)}
      onClick={() => onFocus?.(stop)}
      className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition-all ${
        isDragging ? "opacity-40" : ""
      } ${isHovered ? "bg-amber-50" : ""} ${isFocused ? "bg-teal-50" : ""}`}
    >
      <GripVertical
        size={14}
        className="text-slate-300 hover:text-slate-500 cursor-grab flex-shrink-0"
      />

      <div
        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
          index === 0
            ? "bg-teal-700 text-white"
            : index === total - 1
              ? "bg-rose-600 text-white"
              : "bg-slate-100 text-slate-700"
        }`}
      >
        {index + 1}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-900 truncate">
            {stop.stop_name}
          </span>
          {hasOverride && (
            <span
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[9px] font-bold uppercase tracking-wide flex-shrink-0"
              title={
                overrideInfo?.road_name
                  ? `Override: ${overrideInfo.road_name}`
                  : "Có override"
              }
            >
              <MapIcon size={9} />
              {overrideInfo?.road_name || "Override"}
            </span>
          )}
        </div>
        <div className="text-[10px] text-slate-400 font-mono">
          {stop.stop_id}
        </div>
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onPickRoad?.();
        }}
        title="Chọn đường override"
        className={`w-6 h-6 rounded flex items-center justify-center cursor-pointer flex-shrink-0 transition-colors ${
          hasOverride
            ? "text-amber-700 bg-amber-50 hover:bg-amber-100"
            : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        }`}
      >
        <MapIcon size={12} />
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600 cursor-pointer flex-shrink-0"
      >
        <X size={12} />
      </button>
    </div>
  );
}
