import { useState, useRef, useEffect } from "react";
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  ChevronRight,
  Clock,
  Bus,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../api/client";

const SUGGESTIONS = [
  "Đi từ Quận 1 đến Quận 7",
  "Từ Bến Thành đến Suối Tiên",
  "Tuyến 56 chạy mấy giờ",
];

export function TravelChatWidget() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Chào bạn! Tôi là TBus Travel Advisor 🚌\n\nHãy cho tôi biết bạn muốn đi từ đâu đến đâu, tôi sẽ tư vấn lộ trình phù hợp.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (isOpen && !userLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          }),
        () => {},
        { timeout: 5000 },
      );
    }
  }, [isOpen, userLocation]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isLoading]);

  const handleSend = async (text) => {
    const msg = (text || input).trim();
    if (!msg || isLoading) return;

    setInput("");
    const newMessages = [...messages, { role: "user", content: msg }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const history = newMessages.slice(-10).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await api.post("/discovery/chat", {
        message: msg,
        history,
        user_location: userLocation,
      });

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: res.data.answer,
          data: res.data.data,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            err?.response?.data?.error ||
            "Xin lỗi, tôi đang gặp sự cố. Bạn thử lại nhé.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-24 md:bottom-6 right-4 z-[90] w-14 h-14 rounded-full bg-gradient-to-br from-[#169BA2] to-[#0F7075] text-white shadow-lg hover:scale-105 transition-transform flex items-center justify-center"
          aria-label="Mở trợ lý lộ trình"
        >
          <MessageCircle size={24} />
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 md:inset-auto md:bottom-6 md:right-6 z-[100] md:w-[380px] md:h-[560px] bg-white md:rounded-2xl shadow-2xl border border-[#E5EAF0] flex flex-col md:animate-in md:zoom-in-95 animate-in slide-in-from-bottom">
          <div className="flex items-center justify-between p-4 border-b border-[#E5EAF0] bg-gradient-to-r from-[#169BA2] to-[#0F7075] text-white md:rounded-t-2xl">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-base">
                🚌
              </div>
              <div>
                <div className="text-sm font-bold">TBus Travel Advisor</div>
                <div className="text-[10px] text-white/80 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#7FE7B0]" />{" "}
                  Đang hoạt động
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-full hover:bg-white/20"
              aria-label="Đóng"
            >
              <X size={18} />
            </button>
          </div>

          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F8FAFC]"
          >
            {messages.map((m, i) => (
              <MessageBubble
                key={i}
                message={m}
                onNavigate={(path) => {
                  setIsOpen(false);
                  navigate(path);
                }}
              />
            ))}

            {messages.length === 1 && (
              <div className="pt-2 space-y-2">
                <div className="text-[10px] text-[#8A9AAA] uppercase font-semibold tracking-wider">
                  Gợi ý
                </div>
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(s)}
                    className="w-full text-left text-xs p-2.5 rounded-lg bg-white border border-[#E5EAF0] text-[#4A5A7A] hover:border-[#169BA2]/40 hover:text-[#169BA2] transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-[#8A9AAA]">
                <Loader2 size={14} className="animate-spin" />
                Đang tìm lộ trình...
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 border-t border-[#E5EAF0] bg-white md:rounded-b-2xl"
          >
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Nhập điểm đi và điểm đến..."
                disabled={isLoading}
                className="flex-1 h-10 px-3 rounded-xl border border-[#D0D7E2] text-sm outline-none focus:border-[#169BA2] disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="w-10 h-10 rounded-xl bg-[#169BA2] text-white disabled:opacity-50 flex items-center justify-center"
                aria-label="Gửi"
              >
                <Send size={16} />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

function MessageBubble({ message, onNavigate }) {
  const isUser = message.role === "user";
  const routes = [
    ...(message.data?.direct || []),
    ...(message.data?.transfer || []),
  ].slice(0, 3);

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className="max-w-[88%] space-y-2">
        <div
          className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
            isUser
              ? "bg-[#169BA2] text-white rounded-br-sm"
              : "bg-white text-[#1A2332] rounded-bl-sm border border-[#E5EAF0]"
          }`}
        >
          {message.content}
        </div>

        {routes.length > 0 && (
          <div className="space-y-2">
            <div className="text-[10px] text-[#8A9AAA] uppercase font-semibold">
              Lộ trình gợi ý
            </div>
            {routes.map((r, i) => (
              <RouteCard
                key={i}
                route={r}
                onClick={() => onNavigate(`/passenger/routes/${r.route_id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RouteCard({ route, onClick }) {
  const isTransfer = route.type === "transfer";
  return (
    <div
      onClick={onClick}
      className="p-3 rounded-xl bg-white border border-[#E5EAF0] hover:border-[#169BA2]/40 cursor-pointer transition-colors"
    >
      <div className="flex items-start gap-2.5">
        {isTransfer ? (
          <div className="flex items-center gap-1 flex-shrink-0">
            {route.routes?.slice(0, 2).map((r, i) => (
              <div key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronRight size={10} className="text-[#8A9AAA]" />}
                <div className="w-9 h-9 rounded-lg bg-[#FEF3E2] text-[#B45309] flex items-center justify-center font-bold text-[10px]">
                  {r.short_name}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="w-9 h-9 rounded-lg bg-[#E6F4F5] text-[#0F7075] flex items-center justify-center flex-shrink-0">
            <Bus size={16} />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <div className="text-xs font-bold text-[#1A2332]">
              {isTransfer
                ? `Chuyển ${route.transfers} lần`
                : `Tuyến ${route.route_short_name}`}
            </div>
            {!isTransfer && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#F1F8F1] text-[#2E7D32] font-bold">
                Trực tiếp
              </span>
            )}
          </div>
          <div className="text-[11px] text-[#6A7A9A] truncate mt-0.5">
            {isTransfer
              ? route.routes?.map((r) => r.short_name).join(" → ")
              : route.route_full_name}
          </div>
          <div className="flex items-center gap-2 mt-1 text-[10px] text-[#8A9AAA]">
            {route.duration_min && (
              <span className="inline-flex items-center gap-0.5">
                <Clock size={10} /> {route.duration_min} phút
              </span>
            )}
            {route.stops_count && <span>{route.stops_count} trạm</span>}
          </div>
        </div>

        <ChevronRight size={14} className="text-[#B0BCCA] flex-shrink-0 mt-1" />
      </div>
    </div>
  );
}
