import { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Trash2,
  Clock,
  Loader2,
  Save,
  Sparkles,
  AlertTriangle,
  ChevronDown,
  Copy,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useHeadwayConfigs,
  useReplaceHeadwayConfigs,
} from "@/hooks/useHeadwayConfig";

// ═══════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════
function timeToSec(t) {
  if (!t) return 0;
  const [h, m] = String(t).split(":").map(Number);
  return h * 3600 + m * 60;
}

function secToTime(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const p = (n) => String(n).padStart(2, "0");
  return `${p(h)}:${p(m)}`;
}

// ═══════════════════════════════════════════════════════════════
// Preset configs
// ═══════════════════════════════════════════════════════════════
const PRESETS = {
  urban: [
    {
      from_time: "05:00",
      to_time: "06:00",
      headway_seconds: 1200,
      label: "Sáng sớm",
    },
    {
      from_time: "06:00",
      to_time: "09:00",
      headway_seconds: 480,
      label: "Cao điểm sáng",
    },
    {
      from_time: "09:00",
      to_time: "17:00",
      headway_seconds: 900,
      label: "Bình thường",
    },
    {
      from_time: "17:00",
      to_time: "20:00",
      headway_seconds: 480,
      label: "Cao điểm chiều",
    },
    {
      from_time: "20:00",
      to_time: "22:00",
      headway_seconds: 1200,
      label: "Tối",
    },
  ],
  airport: [
    {
      from_time: "05:00",
      to_time: "06:00",
      headway_seconds: 900,
      label: "Sáng sớm",
    },
    {
      from_time: "06:00",
      to_time: "09:00",
      headway_seconds: 600,
      label: "Cao điểm sáng",
    },
    {
      from_time: "09:00",
      to_time: "17:00",
      headway_seconds: 900,
      label: "Bình thường",
    },
    {
      from_time: "17:00",
      to_time: "20:00",
      headway_seconds: 600,
      label: "Cao điểm chiều",
    },
    {
      from_time: "20:00",
      to_time: "22:00",
      headway_seconds: 900,
      label: "Tối",
    },
  ],
  simple: [
    {
      from_time: "05:00",
      to_time: "22:00",
      headway_seconds: 900,
      label: "Toàn ngày",
    },
  ],
};

// ═══════════════════════════════════════════════════════════════
// Client-side validation
// ═══════════════════════════════════════════════════════════════
function validateRows(rows) {
  const errors = {};
  const warnings = [];

  if (rows.length === 0) {
    return { errors, warnings, valid: true };
  }

  // Sort by from_time
  const sorted = [...rows].sort(
    (a, b) => timeToSec(a.from_time) - timeToSec(b.from_time),
  );

  sorted.forEach((r, i) => {
    const from = timeToSec(r.from_time);
    const to = timeToSec(r.to_time);

    if (from >= to) {
      errors[r._key] = "Giờ bắt đầu phải nhỏ hơn giờ kết thúc";
    }
    if (!r.headway_minutes || r.headway_minutes < 1) {
      errors[r._key] = "Giãn cách phải >= 1 phút";
    }
  });

  // Check overlap
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const cur = sorted[i];
    if (timeToSec(cur.from_time) < timeToSec(prev.to_time)) {
      errors[cur._key] = `Chồng chéo với ${prev.from_time}–${prev.to_time}`;
    }
  }

  return { errors, warnings, valid: Object.keys(errors).length === 0 };
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export function HeadwayConfigEditor({ routeId, services = [] }) {
  const [rows, setRows] = useState([]);
  const [initialized, setInitialized] = useState(false);
  const [showPresetMenu, setShowPresetMenu] = useState(false);

  const { data, isLoading } = useHeadwayConfigs(routeId);
  const saveMut = useReplaceHeadwayConfigs();

  // ─── Load configs từ server khi có data ───
  useEffect(() => {
    if (isLoading || !data) return;
    if (initialized) return;

    const configs = data.configs || [];
    if (configs.length > 0) {
      setRows(
        configs.map((c, i) => ({
          _key: `cfg-${i}-${Date.now()}`,
          from_time: String(c.from_time).slice(0, 5),
          to_time: String(c.to_time).slice(0, 5),
          headway_minutes: Math.round(c.headway_seconds / 60),
          label: c.label || "",
        })),
      );
    } else {
      // Chưa có config → dùng preset urban làm default
      setRows(
        PRESETS.urban.map((c, i) => ({
          _key: `preset-${i}-${Date.now()}`,
          from_time: c.from_time,
          to_time: c.to_time,
          headway_minutes: Math.round(c.headway_seconds / 60),
          label: c.label,
        })),
      );
    }
    setInitialized(true);
  }, [data, isLoading, initialized]);

  // ─── Validation ───
  const validation = useMemo(() => validateRows(rows), [rows]);

  // ─── Handlers ───
  const updateRow = (key, field, value) => {
    setRows((prev) =>
      prev.map((r) => (r._key === key ? { ...r, [field]: value } : r)),
    );
  };

  const addRow = () => {
    // Suggest time after last row
    const lastRow = rows.length > 0 ? rows[rows.length - 1] : null;
    const suggestFrom = lastRow?.to_time || "05:00";
    const suggestFromSec = timeToSec(suggestFrom);
    const suggestToSec = Math.min(suggestFromSec + 3600, 22 * 3600);

    setRows((prev) => [
      ...prev,
      {
        _key: `new-${Date.now()}`,
        from_time: suggestFrom,
        to_time: secToTime(suggestToSec),
        headway_minutes: 15,
        label: "",
      },
    ]);
  };

  const removeRow = (key) => {
    setRows((prev) => prev.filter((r) => r._key !== key));
  };

  const applyPreset = (presetKey) => {
    const preset = PRESETS[presetKey];
    if (!preset) return;
    setRows(
      preset.map((c, i) => ({
        _key: `preset-${i}-${Date.now()}`,
        from_time: c.from_time,
        to_time: c.to_time,
        headway_minutes: Math.round(c.headway_seconds / 60),
        label: c.label,
      })),
    );
    setShowPresetMenu(false);
  };

  const handleSave = async () => {
    if (!validation.valid) return;

    const configs = rows.map((r) => ({
      from_time: r.from_time,
      to_time: r.to_time,
      headway_seconds: r.headway_minutes * 60,
      label: r.label || null,
    }));

    await saveMut.mutateAsync({ routeId, configs });
  };

  // ─── Loading ───
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 size={18} className="animate-spin text-[#169BA2]" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ═══════════ HEADER ═══════════ */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#E6F4F5] flex items-center justify-center">
            <Clock size={13} className="text-[#169BA2]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#1A2332]">
              Khung giờ & giãn cách
            </h3>
            <p className="text-[11px] text-[#8A9AAA] mt-0.5">
              Cấu hình giãn cách theo từng khung giờ trong ngày
            </p>
          </div>
        </div>

        {/* Preset dropdown */}
        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPresetMenu((v) => !v)}
            className="border-[#169BA2] text-[#169BA2] hover:bg-[#E6F4F5]"
          >
            <Sparkles size={12} />
            Mẫu gợi ý
            <ChevronDown size={11} />
          </Button>

          {showPresetMenu && (
            <>
              <div
                className="fixed inset-0 z-[100]"
                onClick={() => setShowPresetMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-[240px] bg-white rounded-lg border border-[#E5EAF0] shadow-lg overflow-hidden z-[110]">
                <button
                  onClick={() => applyPreset("urban")}
                  className="w-full px-3 py-2.5 text-left text-xs hover:bg-[#F8FAFC] border-b border-[#F0F3F7] cursor-pointer"
                >
                  <div className="font-semibold text-[#1A2332]">
                    Tuyến nội thành
                  </div>
                  <div className="text-[10px] text-[#8A9AAA] mt-0.5">
                    Cao điểm 8 phút, bình thường 15 phút
                  </div>
                </button>
                <button
                  onClick={() => applyPreset("airport")}
                  className="w-full px-3 py-2.5 text-left text-xs hover:bg-[#F8FAFC] border-b border-[#F0F3F7] cursor-pointer"
                >
                  <div className="font-semibold text-[#1A2332]">
                    Tuyến sân bay
                  </div>
                  <div className="text-[10px] text-[#8A9AAA] mt-0.5">
                    Cao điểm 10 phút, bình thường 15 phút
                  </div>
                </button>
                <button
                  onClick={() => applyPreset("simple")}
                  className="w-full px-3 py-2.5 text-left text-xs hover:bg-[#F8FAFC] cursor-pointer"
                >
                  <div className="font-semibold text-[#1A2332]">Đơn giản</div>
                  <div className="text-[10px] text-[#8A9AAA] mt-0.5">
                    1 khung giờ 15 phút toàn ngày
                  </div>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ═══════════ TABLE ═══════════ */}
      <div className="rounded-xl border border-[#E5EAF0] overflow-hidden bg-white">
        {/* Header row */}
        <div className="grid grid-cols-[1fr_1fr_100px_140px_40px] gap-2 px-3 py-2 bg-[#F8FAFC] border-b border-[#E5EAF0] text-[10px] font-bold uppercase tracking-wider text-[#8A9AAA]">
          <div>Bắt đầu</div>
          <div>Kết thúc</div>
          <div className="text-center">Giãn cách</div>
          <div>Nhãn</div>
          <div></div>
        </div>

        {/* Body */}
        {rows.length === 0 ? (
          <div className="px-4 py-8 text-center text-xs text-[#8A9AAA]">
            Chưa có khung giờ nào. Nhấn "+" để thêm.
          </div>
        ) : (
          rows.map((r) => {
            const err = validation.errors[r._key];
            return (
              <div
                key={r._key}
                className={`grid grid-cols-[1fr_1fr_100px_140px_40px] gap-2 px-3 py-2 border-b border-[#F0F3F7] last:border-b-0 items-center ${
                  err ? "bg-[#FFF3F3]" : ""
                }`}
              >
                <Input
                  type="time"
                  value={r.from_time}
                  onChange={(e) =>
                    updateRow(r._key, "from_time", e.target.value)
                  }
                  className={`h-8 text-xs font-mono ${
                    err ? "border-rose-400" : ""
                  }`}
                />

                <Input
                  type="time"
                  value={r.to_time}
                  onChange={(e) => updateRow(r._key, "to_time", e.target.value)}
                  className={`h-8 text-xs font-mono ${
                    err ? "border-rose-400" : ""
                  }`}
                />

                <div className="relative">
                  <Input
                    type="number"
                    min="1"
                    max="180"
                    value={r.headway_minutes}
                    onChange={(e) =>
                      updateRow(
                        r._key,
                        "headway_minutes",
                        parseInt(e.target.value) || 0,
                      )
                    }
                    className="h-8 text-xs font-mono pr-8 text-center font-semibold"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-[#8A9AAA] pointer-events-none">
                    ph
                  </span>
                </div>

                <Input
                  value={r.label || ""}
                  onChange={(e) => updateRow(r._key, "label", e.target.value)}
                  placeholder="VD: Cao điểm"
                  className="h-8 text-xs"
                />

                <button
                  onClick={() => removeRow(r._key)}
                  title="Xóa khung giờ"
                  className="w-7 h-7 rounded-md flex items-center justify-center text-[#8A9AAA] hover:bg-[#FFEBEE] hover:text-[#C62828] cursor-pointer transition-colors"
                >
                  <Trash2 size={12} />
                </button>

                {/* Error message */}
                {err && (
                  <div className="col-span-5 text-[10px] text-rose-600 flex items-center gap-1 -mt-1 pb-1">
                    <AlertTriangle size={10} />
                    {err}
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Footer add button */}
        <button
          onClick={addRow}
          className="w-full px-3 py-2.5 flex items-center justify-center gap-1.5 text-xs font-semibold text-[#169BA2] hover:bg-[#E6F4F5] transition-colors cursor-pointer border-t border-[#E5EAF0]"
        >
          <Plus size={12} />
          Thêm khung giờ
        </button>
      </div>

      {/* ═══════════ MULTIPLIER PREVIEW ═══════════ */}
      {services.length > 0 && rows.length > 0 && validation.valid && (
        <div className="rounded-lg bg-[#F8FAFC] border border-[#E5EAF0] p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Copy size={11} className="text-[#8A9AAA]" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A9AAA]">
              Giãn cách sau khi áp dụng hệ số
            </span>
          </div>
          <div className="space-y-1">
            {services.map((svc) => {
              const mult = parseFloat(svc.headway_multiplier) || 1.0;
              return (
                <div
                  key={svc.id}
                  className="flex items-center gap-2 text-[11px]"
                >
                  <Badge variant="info" className="text-[10px]">
                    {svc.service_id}
                  </Badge>
                  <span className="text-[#6A7A9A]">×</span>
                  <span className="font-mono font-semibold text-[#169BA2]">
                    {mult.toFixed(2)}
                  </span>
                  {mult !== 1.0 && (
                    <span className="text-[10px] text-[#8A9AAA]">
                      ({mult > 1 ? "giãn" : "dày"}{" "}
                      {Math.round(Math.abs(mult - 1) * 100)}%)
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-2 pt-2 border-t border-[#E5EAF0] text-[10px] text-[#8A9AAA]">
            Ví dụ: khung 8 phút × 1.20 → 9.6 phút (~10 phút)
          </div>
        </div>
      )}

      {/* ═══════════ SAVE ═══════════ */}
      <div className="flex items-center justify-end gap-2">
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={!validation.valid || saveMut.isPending}
          className="bg-[#169BA2] hover:bg-[#12868C] text-white"
        >
          {saveMut.isPending ? (
            <>
              <Loader2 size={13} className="animate-spin" />
              Đang lưu...
            </>
          ) : (
            <>
              <Save size={13} />
              Lưu khung giờ
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
