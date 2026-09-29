import { Loader2 } from "lucide-react";

// ═══════════════════════════════════════════════════════════════
// Sub-component: KPI Card
// ═══════════════════════════════════════════════════════════════
function KpiCard({ label, value, suffix, tone, pulse, hint }) {
  // tone: 'default' | 'info' | 'success' | 'warning' | 'danger' | 'muted'
  const tones = {
    default: {
      val: "text-[#1A2332]",
      bg: "bg-white",
      border: "border-[#E5EAF0]",
    },
    info: {
      val: "text-[#169BA2]",
      bg: "bg-[#F0F9FA]",
      border: "border-[#A8D5D8]",
    },
    success: {
      val: "text-[#2E7D32]",
      bg: "bg-[#F1F8F1]",
      border: "border-[#A8D5A8]",
    },
    warning: {
      val: "text-[#E08940]",
      bg: "bg-[#FFF8EC]",
      border: "border-[#FFD9A8]",
    },
    danger: {
      val: "text-[#C62828]",
      bg: "bg-[#FEF2F2]",
      border: "border-[#FFC8C8]",
    },
    muted: {
      val: "text-[#6A7A9A]",
      bg: "bg-[#F8FAFC]",
      border: "border-[#E5EAF0]",
    },
  };

  const c = tones[tone] || tones.default;

  return (
    <div className={`rounded-lg ${c.bg} ${c.border} border px-4 py-3 min-w-0`}>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-[#8A9AAA] mb-1 truncate">
        {label}
      </div>
      <div className="flex items-baseline gap-1.5">
        {pulse && (
          <span className="relative flex h-2 w-2 mb-1">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#169BA2] opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#169BA2]" />
          </span>
        )}
        <div className={`text-2xl font-bold leading-none ${c.val}`}>
          {value}
        </div>
        {suffix && (
          <span className="text-xs font-semibold text-[#8A9AAA]">{suffix}</span>
        )}
      </div>
      {hint && (
        <div className="text-[10px] text-[#8A9AAA] mt-1.5 truncate">{hint}</div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Sub-component: Donut Chart (OTP)
// ═══════════════════════════════════════════════════════════════
function OtpDonut({ percent, loading }) {
  const size = 52;
  const stroke = 6;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(100, Math.max(0, percent)) / 100) * circ;

  const color =
    percent >= 90 ? "#2E7D32" : percent >= 70 ? "#E08940" : "#C62828";

  return (
    <div className="flex items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke="#E5EAF0"
            strokeWidth={stroke}
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={color}
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={circ}
            strokeDashoffset={loading ? circ : offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.5s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[11px] font-bold" style={{ color }}>
            {loading ? "…" : `${Math.round(percent)}%`}
          </span>
        </div>
      </div>
      <div className="min-w-0">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-[#8A9AAA] mb-0.5">
          Tỷ lệ đúng giờ
        </div>
        <div className="text-xs font-semibold text-[#1A2332] leading-tight">
          On-Time Performance
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export function TripKpiCards({ stats, isLoading }) {
  const s = stats || {};

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {/* Tổng số chuyến */}
      <KpiCard
        label="Tổng chuyến"
        value={isLoading ? "…" : (s.total ?? 0).toLocaleString("vi-VN")}
        tone="default"
        hint={s.date ? `Ngày ${s.date}` : "Hôm nay"}
      />

      {/* Đang chạy */}
      <KpiCard
        label="Đang chạy"
        value={isLoading ? "…" : (s.in_progress ?? 0)}
        tone="info"
        pulse={!isLoading && (s.in_progress ?? 0) > 0}
        hint="Xe đang trên đường"
      />

      {/* Hoàn thành */}
      <KpiCard
        label="Hoàn thành"
        value={isLoading ? "…" : (s.completed ?? 0)}
        tone="success"
        hint="Đã về bến cuối"
      />

      {/* Trễ / Sự cố */}
      <KpiCard
        label="Trễ / Sự cố"
        value={isLoading ? "…" : (s.delayed ?? 0)}
        tone={s.delayed > 0 ? "danger" : "muted"}
        hint={s.delayed > 0 ? "Cần xử lý ngay" : "Không có sự cố"}
      />

      {/* Đã hủy */}
      <KpiCard
        label="Đã hủy"
        value={isLoading ? "…" : (s.cancelled ?? 0)}
        tone="muted"
        hint="Chuyến bị tắt"
      />

      {/* OTP Donut */}
      <div className="rounded-lg bg-white border border-[#E5EAF0] px-4 py-3 flex items-center">
        {isLoading ? (
          <Loader2 size={16} className="animate-spin text-[#169BA2]" />
        ) : (
          <OtpDonut percent={s.otp_percent ?? 0} />
        )}
      </div>
    </div>
  );
}
