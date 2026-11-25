import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  Bus,
  Ticket,
  MapPin,
  ChevronRight,
  GraduationCap,
  Shield,
  Sparkles,
  Navigation,
  ArrowRight,
  MessageSquare,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { listMyTickets } from "../api/ticketsApi";

const QUICK_ACTIONS = [
  {
    icon: Search,
    label: "Tìm đường",
    to: "/passenger/search",
    color: "bg-[#E6F4F5] text-[#0F7075]",
  },
  {
    icon: Bus,
    label: "Tuyến xe",
    to: "/passenger/routes",
    color: "bg-[#FEF3E2] text-[#B45309]",
  },
  {
    icon: Ticket,
    label: "Mua vé",
    to: "/passenger/tickets",
    color: "bg-[#EEF2F6] text-[#4A5A7A]",
  },
  {
    icon: MessageSquare,
    label: "Góp ý",
    to: "/passenger/feedback",
    color: "bg-[#F1F8F1] text-[#2E7D32]",
  },
];

const FEATURES = [
  {
    icon: MapPin,
    title: "Tìm trạm gần bạn",
    desc: "Định vị GPS tự động hiển thị các trạm xung quanh chỉ trong vài giây.",
  },
  {
    icon: Bus,
    title: "Tra cứu 200+ tuyến",
    desc: "Toàn bộ mạng lưới xe buýt TP.HCM, cập nhật lộ trình và giờ chạy.",
  },
  {
    icon: Ticket,
    title: "Mua vé điện tử",
    desc: "Thanh toán Momo, vé lưu trên điện thoại, không cần tiền mặt.",
  },
  {
    icon: GraduationCap,
    title: "Ưu đãi sinh viên",
    desc: "Xác minh thẻ sinh viên online, giảm 50% giá vé cho sinh viên.",
  },
  {
    icon: Navigation,
    title: "Chỉ đường thông minh",
    desc: "Gợi ý lộ trình tối ưu, kể cả khi cần chuyển tuyến.",
  },
  {
    icon: Shield,
    title: "An toàn & tin cậy",
    desc: "Dữ liệu từ Trung tâm Quản lý Giao thông Công cộng TP.HCM.",
  },
];

const TIPS = [
  {
    icon: "💰",
    title: "Chuẩn bị tiền lẻ",
    desc: "Mang sẵn tiền lẻ hoặc dùng vé điện tử để lên xe nhanh hơn.",
  },
  {
    icon: "⏰",
    title: "Đến trạm sớm 5 phút",
    desc: "Xe buýt có thể đến sớm hơn dự kiến, đặc biệt giờ cao điểm.",
  },
  {
    icon: "🔢",
    title: "Quan sát số tuyến trên xe",
    desc: "Kiểm tra kỹ số tuyến trước khi lên để tránh nhầm chuyến.",
  },
  {
    icon: "📱",
    title: "Dùng app tra cứu",
    desc: "Mở TBus để xem lộ trình và thời gian xe đến trạm theo thời gian thực.",
  },
];

const STEPS = [
  {
    step: "1",
    title: "Nhập điểm đi và điểm đến",
    desc: "Hoặc chọn trạm gần bạn trên bản đồ.",
  },
  {
    step: "2",
    title: "Chọn tuyến phù hợp",
    desc: "Xem giờ xe, số trạm và thời gian di chuyển.",
  },
  {
    step: "3",
    title: "Mua vé điện tử",
    desc: "Thanh toán qua Momo, vé lưu ngay trên app.",
  },
  {
    step: "4",
    title: "Lên xe và quét mã",
    desc: "Đưa mã QR cho nhân viên soát vé khi lên xe.",
  },
];

export function HomePage() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [activeTicket, setActiveTicket] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      listMyTickets({ status: "active" })
        .then((res) => {
          if (res.data?.length > 0) setActiveTicket(res.data[0]);
        })
        .catch(() => {});
    }
  }, [isAuthenticated]);

  return (
    <div className="min-h-screen pb-20">
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#169BA2] via-[#128A90] to-[#0F7075] text-white">
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/10" />
        <div className="absolute -bottom-16 -left-10 w-48 h-48 rounded-full bg-white/5" />

        <div className="relative px-6 pt-10 pb-10 md:pt-16 md:pb-14">
          <div className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-2">
            TBus · Xe buýt TP.HCM
          </div>
          <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-3">
            Đi lại thông minh
            <br />
            cùng xe buýt
          </h1>
          <p className="text-white/85 text-sm md:text-base max-w-md mb-6 leading-relaxed">
            Tra cứu tuyến, xem giờ xe realtime, mua vé điện tử và nhận ưu đãi
            sinh viên — tất cả trong một ứng dụng.
          </p>

          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => navigate("/passenger/search")}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-[#0F7075] font-bold text-sm hover:bg-white/95 transition-colors shadow-lg"
            >
              <Search size={16} />
              Tìm đường đi
            </button>
            <button
              onClick={() => navigate("/passenger/routes")}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/15 text-white font-bold text-sm hover:bg-white/25 transition-colors backdrop-blur"
            >
              <Bus size={16} />
              Xem tuyến xe
            </button>
          </div>

          {isAuthenticated && user && (
            <div className="mt-6 text-sm text-white/80">
              Xin chào,{" "}
              <span className="font-bold text-white">
                {user.full_name?.split(" ").pop()}
              </span>{" "}
              👋
            </div>
          )}
        </div>
      </section>

      {/* QUICK ACTIONS */}
      <section className="px-4 md:px-6 -mt-6 md:-mt-8 relative z-10">
        <div className="grid grid-cols-4 gap-1 md:gap-3 bg-white rounded-2xl p-2 md:p-4 shadow-lg border border-[#E5EAF0]">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.to}
                to={action.to}
                className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-[#F8FAFC] transition-colors"
              >
                <div
                  className={`w-11 h-11 md:w-12 md:h-12 rounded-xl flex items-center justify-center ${action.color}`}
                >
                  <Icon size={20} />
                </div>
                <span className="text-[11px] md:text-xs font-semibold text-[#4A5A7A] text-center">
                  {action.label}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ACTIVE TICKET */}
      {activeTicket && (
        <section className="px-4 md:px-6 mt-4">
          <Link
            to="/passenger/tickets"
            className="flex items-center gap-3 bg-gradient-to-r from-[#169BA2] to-[#0F7075] p-4 rounded-2xl shadow-md text-white hover:scale-[1.01] transition-transform"
          >
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Ticket size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-semibold text-white/80 uppercase tracking-wider">
                Vé đang sẵn sàng
              </div>
              <div className="text-sm font-bold truncate">
                {activeTicket.ticket_type === "single"
                  ? "Vé lượt"
                  : activeTicket.ticket_type === "bundle"
                    ? "Vé tập 30"
                    : "Vé tháng"}
                <span className="font-normal text-white/70 ml-2">
                  Còn {activeTicket.remaining_uses} lượt
                </span>
              </div>
            </div>
            <div className="bg-white text-[#169BA2] px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap">
              Mở vé
            </div>
          </Link>
        </section>
      )}

      {/* FEATURES */}
      <section className="px-4 md:px-6 mt-8">
        <div className="mb-4">
          <h2 className="text-lg md:text-xl font-bold text-[#1A2332]">
            Tính năng nổi bật
          </h2>
          <p className="text-xs text-[#8A9AAA] mt-0.5">
            Mọi thứ bạn cần cho một chuyến đi suôn sẻ
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                className="flex items-start gap-3 p-4 rounded-2xl border border-[#E5EAF0] bg-white hover:border-[#169BA2]/30 hover:shadow-sm transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-[#E6F4F5] text-[#0F7075] flex items-center justify-center flex-shrink-0">
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-[#1A2332] mb-0.5">
                    {f.title}
                  </div>
                  <div className="text-xs text-[#8A9AAA] leading-relaxed">
                    {f.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* GUIDE */}
      <section className="px-4 md:px-6 mt-8">
        <div className="mb-4">
          <h2 className="text-lg md:text-xl font-bold text-[#1A2332]">
            Cẩm nang đi xe buýt
          </h2>
          <p className="text-xs text-[#8A9AAA] mt-0.5">
            Mẹo nhỏ cho người mới bắt đầu
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {TIPS.map((tip, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-4 rounded-2xl bg-gradient-to-br from-[#F8FAFC] to-[#EEF2F6] border border-[#E5EAF0]"
            >
              <div className="text-2xl flex-shrink-0">{tip.icon}</div>
              <div className="flex-1">
                <div className="text-sm font-bold text-[#1A2332] mb-0.5">
                  {tip.title}
                </div>
                <div className="text-xs text-[#6A7A9A] leading-relaxed">
                  {tip.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* STEPS */}
      <section className="px-4 md:px-6 mt-8">
        <h2 className="text-lg md:text-xl font-bold text-[#1A2332] mb-4">
          Cách sử dụng
        </h2>
        <div className="space-y-3">
          {STEPS.map((s) => (
            <div key={s.step} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#169BA2] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                {s.step}
              </div>
              <div className="flex-1 pt-0.5">
                <div className="text-sm font-bold text-[#1A2332]">
                  {s.title}
                </div>
                <div className="text-xs text-[#8A9AAA] mt-0.5">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 md:px-6 mt-8 mb-4">
        <div className="rounded-2xl bg-gradient-to-br from-[#169BA2] to-[#0F7075] p-6 text-white text-center">
          <Sparkles size={28} className="mx-auto mb-3 opacity-90" />
          <h3 className="text-lg font-bold mb-1">Sẵn sàng cho chuyến đi?</h3>
          <p className="text-sm text-white/80 mb-4">
            Bắt đầu tra cứu tuyến xe buýt ngay hôm nay
          </p>
          <button
            onClick={() => navigate("/passenger/search")}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white text-[#0F7075] font-bold text-sm"
          >
            Bắt đầu ngay
            <ArrowRight size={16} />
          </button>
        </div>
      </section>
    </div>
  );
}
