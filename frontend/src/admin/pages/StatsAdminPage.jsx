import { useState, useEffect } from "react";
import {
  Users,
  Ticket,
  TrendingUp,
  Activity,
  MessageSquare,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { format } from "date-fns";
import { PageHeader } from "../components/PageHeader";
import {
  getOverview,
  getRevenue,
  getTicketBreakdown,
  getFeedbackBreakdown,
  getRecentActivity,
} from "@/api/statsAdminApi";
import { toast } from "sonner";

const PIE_COLORS = ["#169BA2", "#F59E0B", "#8B5CF6", "#EF4444"];
const FEEDBACK_COLORS = {
  new: "#B45309",
  reviewed: "#169BA2",
  resolved: "#2E7D32",
};

const TICKET_LABELS = {
  single: "Vé lượt",
  bundle: "Vé tập 30",
  monthly: "Vé tháng",
};

const STATUS_LABELS = {
  new: "Mới",
  reviewed: "Đã xem",
  resolved: "Đã xử lý",
};

export function StatsAdminPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [overview, setOverview] = useState(null);
  const [revenue, setRevenue] = useState([]);
  const [tickets, setTickets] = useState({
    by_type: [],
    by_method: [],
    by_status: [],
  });
  const [feedbacks, setFeedbacks] = useState([]);
  const [recent, setRecent] = useState({
    recent_tickets: [],
    recent_feedbacks: [],
  });
  const [days, setDays] = useState(30);

  const loadAll = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [ov, rev, tk, fb, rc] = await Promise.all([
        getOverview(),
        getRevenue(days),
        getTicketBreakdown(),
        getFeedbackBreakdown(),
        getRecentActivity(8),
      ]);
      setOverview(ov);
      setRevenue(rev.data || []);
      setTickets(tk);
      setFeedbacks(fb.data || []);
      setRecent(rc);
    } catch (err) {
      setError(
        err?.response?.data?.error || err.message || "Không tải được thống kê.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [days]);

  const formatCurrency = (v) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(v || 0);

  const formatNumber = (v) => new Intl.NumberFormat("vi-VN").format(v || 0);

  if (isLoading && !overview) {
    return (
      <div className="h-full flex items-center justify-center bg-[#EEF2F6]">
        <Loader2 size={28} className="animate-spin text-[#169BA2]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[#EEF2F6] p-6">
        <AlertCircle size={48} className="text-[#C62828] mb-4" />
        <p className="text-sm text-[#C62828] mb-4">{error}</p>
        <button
          onClick={loadAll}
          className="px-4 py-2 rounded-lg bg-[#169BA2] text-white text-sm font-bold"
        >
          Thử lại
        </button>
      </div>
    );
  }

  const totalTicketsByType = tickets.by_type.reduce((s, t) => s + t.count, 0);

  return (
    <div className="h-full overflow-y-auto bg-[#EEF2F6]">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6 space-y-4">
        <PageHeader
          title="Thống kê"
          description="Tổng quan hoạt động hệ thống TBus"
          right={
            <button
              onClick={loadAll}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-[#E5EAF0] text-sm font-semibold text-[#4A5A7A] hover:bg-[#F8FAFC] disabled:opacity-50"
            >
              <RefreshCw
                size={14}
                className={isLoading ? "animate-spin" : ""}
              />
              Làm mới
            </button>
          }
        />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard
            icon={Users}
            label="Tổng người dùng"
            value={formatNumber(overview.total_users)}
            color="bg-[#E6F4F5] text-[#0F7075]"
          />
          <KpiCard
            icon={Ticket}
            label="Vé đã bán"
            value={formatNumber(overview.total_tickets_sold)}
            color="bg-[#FEF3E2] text-[#B45309]"
          />
          <KpiCard
            icon={TrendingUp}
            label="Doanh thu"
            value={formatCurrency(overview.total_revenue)}
            color="bg-[#F1F8F1] text-[#2E7D32]"
            small
          />
          <KpiCard
            icon={Activity}
            label="Vé đang active"
            value={formatNumber(overview.active_tickets)}
            color="bg-[#EEF2F6] text-[#4A5A7A]"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-white border border-[#E5EAF0] flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#FEF3E2] flex items-center justify-center">
              <MessageSquare size={18} className="text-[#B45309]" />
            </div>
            <div>
              <div className="text-[10px] text-[#8A9AAA] uppercase font-semibold">
                Feedback chờ xử lý
              </div>
              <div className="text-lg font-bold text-[#1A2332]">
                {formatNumber(overview.pending_feedback)}
              </div>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-white border border-[#E5EAF0] flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#E6F4F5] flex items-center justify-center">
              <Users size={18} className="text-[#0F7075]" />
            </div>
            <div>
              <div className="text-[10px] text-[#8A9AAA] uppercase font-semibold">
                Tổng vé theo loại
              </div>
              <div className="text-lg font-bold text-[#1A2332]">
                {formatNumber(totalTicketsByType)}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E5EAF0] p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-[#1A2332]">Doanh thu</h2>
              <p className="text-xs text-[#8A9AAA]">Theo ngày</p>
            </div>
            <div className="inline-flex bg-[#F8FAFC] rounded-lg p-1 border border-[#E5EAF0]">
              {[7, 30, 90].map((d) => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                    days === d
                      ? "bg-white text-[#169BA2] shadow-sm"
                      : "text-[#6A7A9A]"
                  }`}
                >
                  {d} ngày
                </button>
              ))}
            </div>
          </div>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenue}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#169BA2" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#169BA2" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F3F7" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "#8A9AAA" }}
                  tickFormatter={(d) => format(new Date(d), "dd/MM")}
                  interval="preserveStartEnd"
                  minTickGap={20}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#8A9AAA" }}
                  tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    border: "1px solid #E5EAF0",
                  }}
                  formatter={(v, name) => [
                    name === "revenue" ? formatCurrency(v) : v,
                    name === "revenue" ? "Doanh thu" : "Số vé",
                  ]}
                  labelFormatter={(d) => format(new Date(d), "dd/MM/yyyy")}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#169BA2"
                  strokeWidth={2}
                  fill="url(#revGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Tickets by type */}
          <div className="bg-white rounded-xl border border-[#E5EAF0] p-4">
            <h2 className="text-sm font-bold text-[#1A2332] mb-1">
              Vé theo loại
            </h2>
            <p className="text-xs text-[#8A9AAA] mb-4">
              Chỉ tính vé đã thanh toán
            </p>
            {tickets.by_type.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-sm text-[#8A9AAA]">
                Chưa có dữ liệu
              </div>
            ) : (
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={tickets.by_type.map((t) => ({
                        name: TICKET_LABELS[t.ticket_type] || t.ticket_type,
                        value: t.count,
                      }))}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      labelLine={false}
                    >
                      {tickets.by_type.map((_, i) => (
                        <Cell
                          key={i}
                          fill={PIE_COLORS[i % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v, name) => [`${v} vé`, name]}
                      contentStyle={{
                        fontSize: 12,
                        borderRadius: 8,
                        border: "1px solid #E5EAF0",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-[#E5EAF0] p-4">
            <h2 className="text-sm font-bold text-[#1A2332] mb-1">
              Feedback theo trạng thái
            </h2>
            <p className="text-xs text-[#8A9AAA] mb-4">
              Toàn bộ feedback hệ thống
            </p>
            {feedbacks.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-sm text-[#8A9AAA]">
                Chưa có dữ liệu
              </div>
            ) : (
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={feedbacks.map((f) => ({
                      name: STATUS_LABELS[f.status] || f.status,
                      count: f.count,
                      fill: FEEDBACK_COLORS[f.status] || "#8A9AAA",
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F3F7" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: "#8A9AAA" }}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "#8A9AAA" }}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        fontSize: 12,
                        borderRadius: 8,
                        border: "1px solid #E5EAF0",
                      }}
                      formatter={(v) => [`${v} feedback`, "Số lượng"]}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {feedbacks.map((f, i) => (
                        <Cell
                          key={i}
                          fill={FEEDBACK_COLORS[f.status] || "#8A9AAA"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className="bg-white rounded-xl border border-[#E5EAF0] p-4">
            <h2 className="text-sm font-bold text-[#1A2332] mb-3">
              Vé mới nhất
            </h2>
            {recent.recent_tickets.length === 0 ? (
              <div className="text-sm text-[#8A9AAA] text-center py-6">
                Chưa có giao dịch
              </div>
            ) : (
              <div className="space-y-2">
                {recent.recent_tickets.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between text-xs py-2 border-b border-[#F0F3F7] last:border-0"
                  >
                    <div>
                      <div className="font-bold text-[#1A2332]">
                        {TICKET_LABELS[t.ticket_type] || t.ticket_type}
                      </div>
                      <div className="text-[#8A9AAA] mt-0.5">
                        User #{t.user_id} · {t.payment_method || "—"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-[#169BA2]">
                        {formatCurrency(t.price)}
                      </div>
                      <div className="text-[10px] text-[#8A9AAA] mt-0.5">
                        {t.paid_at
                          ? format(new Date(t.paid_at), "dd/MM HH:mm")
                          : "—"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-[#E5EAF0] p-4">
            <h2 className="text-sm font-bold text-[#1A2332] mb-3">
              Feedback mới nhất
            </h2>
            {recent.recent_feedbacks.length === 0 ? (
              <div className="text-sm text-[#8A9AAA] text-center py-6">
                Chưa có feedback
              </div>
            ) : (
              <div className="space-y-2">
                {recent.recent_feedbacks.map((f) => (
                  <div
                    key={f.id}
                    className="text-xs py-2 border-b border-[#F0F3F7] last:border-0"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="font-bold text-[#1A2332] truncate">
                        {f.full_name}
                      </div>
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded shrink-0"
                        style={{
                          color: FEEDBACK_COLORS[f.status],
                          background: `${FEEDBACK_COLORS[f.status]}15`,
                        }}
                      >
                        {STATUS_LABELS[f.status] || f.status}
                      </span>
                    </div>
                    <div className="text-[#4A5A7A] line-clamp-1 mt-0.5">
                      {f.comment || "(không có nội dung)"}
                    </div>
                    <div className="text-[10px] text-[#8A9AAA] mt-0.5">
                      {format(new Date(f.created_at), "dd/MM HH:mm")}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, color, small }) {
  return (
    <div className="bg-white rounded-xl border border-[#E5EAF0] p-4">
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${color}`}
      >
        <Icon size={18} />
      </div>
      <div className="text-[11px] text-[#8A9AAA] uppercase font-semibold tracking-wider mb-1">
        {label}
      </div>
      <div
        className={`font-bold text-[#1A2332] ${small ? "text-base leading-tight" : "text-2xl"}`}
      >
        {value}
      </div>
    </div>
  );
}
