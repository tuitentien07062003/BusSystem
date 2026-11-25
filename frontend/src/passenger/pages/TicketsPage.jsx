import { useState, useEffect } from "react";
import {
  Ticket as TicketIcon,
  Plus,
  Loader2,
  Calendar,
  Hash,
  CheckCircle2,
  History,
  Clock,
} from "lucide-react";
import QRCodeSVG from "react-qr-code";
import { listMyTickets, getTicketDetail } from "../api/ticketsApi";
import { BuyTicketDialog } from "../components/tickets/BuyTicketDialog";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

export function TicketsPage() {
  const [activeTab, setActiveTab] = useState("active");
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [buyOpen, setBuyOpen] = useState(false);

  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [liveTicket, setLiveTicket] = useState(null);
  const [isVerified, setIsVerified] = useState(false);

  const fetchTickets = () => {
    setIsLoading(true);
    listMyTickets()
      .then((res) => setTickets(res.data || []))
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    if (!selectedTicketId || isVerified || activeTab === "history") return;

    const interval = setInterval(async () => {
      try {
        const res = await getTicketDetail(selectedTicketId);
        setLiveTicket(res);

        const original = tickets.find((t) => t.id === selectedTicketId);
        if (
          res.status !== "active" ||
          (original && res.remaining_uses < original.remaining_uses)
        ) {
          setIsVerified(true);
          clearInterval(interval);
          fetchTickets();
        }
      } catch (err) {
        console.error("Polling error", err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [selectedTicketId, isVerified, tickets, activeTab]);

  const openTicket = async (ticket) => {
    setSelectedTicketId(ticket.id);
    setLiveTicket(null);
    setIsVerified(false);

    try {
      const detail = await getTicketDetail(ticket.id);
      setLiveTicket(detail);
    } catch (err) {
      console.error(err);
    }
  };

  const closeTicket = () => {
    setSelectedTicketId(null);
    setLiveTicket(null);
    setIsVerified(false);
  };

  const filteredTickets = tickets.filter((t) =>
    activeTab === "active" ? t.status === "active" : t.status !== "active",
  );

  return (
    <div className="p-5 md:p-8 max-w-[800px] mx-auto min-h-screen pb-24">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-[#1A2332]">Ví vé của tôi</h1>
        {activeTab === "active" && (
          <button
            onClick={() => setBuyOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#169BA2] text-white text-xs font-bold hover:bg-[#0F7075] transition-colors shadow-sm"
          >
            <Plus size={16} /> Mua vé
          </button>
        )}
      </div>

      <div className="flex bg-[#F8FAFC] p-1 rounded-xl mb-6 border border-[#E5EAF0]">
        <button
          onClick={() => setActiveTab("active")}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === "active" ? "bg-white text-[#169BA2] shadow-sm" : "text-[#8A9AAA]"}`}
        >
          Đang hoạt động
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === "history" ? "bg-white text-[#169BA2] shadow-sm" : "text-[#8A9AAA]"}`}
        >
          Lịch sử
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={24} className="animate-spin text-[#169BA2]" />
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="text-center py-20">
          <TicketIcon size={24} className="mx-auto text-[#B0BCCA] mb-2" />
          <p className="text-sm text-[#8A9AAA]">Chưa có vé nào.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTickets.map((ticket) => {
            const isHistory = activeTab === "history";
            return (
              <div
                key={ticket.id}
                onClick={() => openTicket(ticket)}
                className={`bg-white border border-[#E5EAF0] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer flex ${isHistory ? "grayscale opacity-80" : ""}`}
              >
                <div className="p-4 flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ticket.is_student ? "bg-[#E6F4F5] text-[#0F7075]" : "bg-[#FEF3E2] text-[#B45309]"}`}
                    >
                      {ticket.is_student ? "Sinh viên" : "Thường"}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase ${ticket.status === "active" ? "text-[#2E7D32]" : "text-[#8A9AAA]"}`}
                    >
                      {ticket.status === "active"
                        ? "Khả dụng"
                        : ticket.status === "used"
                          ? "Hết lượt"
                          : "Hết hạn"}
                    </span>
                  </div>
                  <h3 className="font-bold text-[#1A2332] text-sm mb-1 capitalize">
                    {ticket.ticket_type === "single"
                      ? "Vé lượt"
                      : ticket.ticket_type === "bundle"
                        ? "Vé tập 30"
                        : "Vé tháng"}
                  </h3>
                  <div className="text-xs text-[#8A9AAA] flex items-center gap-1 mt-2">
                    <Calendar size={12} /> HSD:{" "}
                    {format(new Date(ticket.expires_at), "dd/MM/yyyy", {
                      locale: vi,
                    })}
                  </div>
                  <div className="text-xs text-[#8A9AAA] flex items-center gap-1 mt-1">
                    <Hash size={12} /> Còn lại: {ticket.remaining_uses} lượt
                  </div>
                </div>

                {isHistory ? (
                  <div className="w-10 bg-[#B0BCCA] flex items-center justify-center border-l border-dashed border-white/40">
                    <History size={18} className="text-white" />
                  </div>
                ) : (
                  <div className="w-10 bg-[#169BA2] flex items-center justify-center border-l border-dashed border-white/40">
                    <span className="text-white text-[10px] font-bold uppercase tracking-wider rotate-90 whitespace-nowrap">
                      Quét QR
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {liveTicket && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-[340px] overflow-hidden animate-in zoom-in-95 text-center relative">
            {isVerified && activeTab === "active" && (
              <div className="absolute inset-0 z-50 bg-white/95 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
                <div className="w-24 h-24 bg-[#F1F8F1] rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2
                    size={56}
                    className="text-[#2E7D32] animate-bounce"
                  />
                </div>
                <h3 className="text-xl font-bold text-[#2E7D32]">
                  Đã soát vé!
                </h3>
                <p className="text-sm text-[#8A9AAA] mt-1">
                  Chúc bạn chuyến đi vui vẻ
                </p>
                <button
                  onClick={closeTicket}
                  className="mt-8 px-6 py-2 bg-[#F0F3F7] text-[#4A5A7A] font-semibold rounded-lg"
                >
                  Đóng
                </button>
              </div>
            )}

            <div
              className={`h-2 w-full ${liveTicket.is_student ? "bg-[#169BA2]" : "bg-[#E08940]"} ${activeTab === "history" ? "bg-gray-300" : ""}`}
            />

            <div className="p-6">
              <h2 className="text-xl font-bold text-[#1A2332] mb-1">
                {activeTab === "active" ? "Vé xe buýt" : "Lịch sử vé"}
              </h2>
              <p className="text-xs text-[#8A9AAA] mb-6">
                {activeTab === "active"
                  ? "Đưa mã này cho nhân viên soát vé"
                  : `Mã vé: ${liveTicket.qr_code}`}
              </p>

              {activeTab === "active" ? (
                <>
                  <div className="bg-white p-4 rounded-2xl border-2 border-[#169BA2] border-dashed inline-block mb-4">
                    <QRCodeSVG value={liveTicket.qr_code} size={180} />
                  </div>
                  <div className="bg-[#F0F9FA] py-2 px-4 rounded-lg inline-block mb-6 border border-[#A8D5D8]">
                    <span className="text-[10px] text-[#0F7075] font-bold uppercase block mb-0.5">
                      Mã soát vé
                    </span>
                    <span className="font-mono text-lg font-bold text-[#1A2332] tracking-widest">
                      {liveTicket.qr_code}
                    </span>
                  </div>
                </>
              ) : (
                <div className="mb-6">
                  <div className="w-16 h-16 bg-[#F8FAFC] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#E5EAF0]">
                    <History size={24} className="text-[#B0BCCA]" />
                  </div>

                  <h3 className="text-sm font-bold text-[#1A2332] mb-3 text-left">
                    Lịch sử quét vé
                  </h3>
                  <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1 text-left">
                    {liveTicket.usage_logs &&
                    liveTicket.usage_logs.length > 0 ? (
                      liveTicket.usage_logs.map((log) => (
                        <div
                          key={log.id}
                          className="flex items-start gap-3 p-3 rounded-xl bg-[#F8FAFC] border border-[#E5EAF0]"
                        >
                          <Clock
                            size={16}
                            className="text-[#169BA2] mt-0.5 flex-shrink-0"
                          />
                          <div>
                            <div className="text-sm font-bold text-[#1A2332]">
                              {format(
                                new Date(log.scanned_at),
                                "HH:mm - dd/MM/yyyy",
                              )}
                            </div>
                            <div className="text-xs text-[#8A9AAA] mt-1">
                              Xe buýt tuyến {log.route_id || "?"} (Chuyến #
                              {log.trip_id || "?"})
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-xs text-[#8A9AAA] py-4">
                        Chưa có lịch sử sử dụng.
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="text-left space-y-2 bg-[#F8FAFC] p-4 rounded-xl mb-6">
                <div className="flex justify-between text-xs">
                  <span className="text-[#8A9AAA]">Loại vé:</span>
                  <span className="font-bold text-[#1A2332] capitalize">
                    {liveTicket.ticket_type}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#8A9AAA]">Trạng thái:</span>
                  <span
                    className={`font-bold capitalize ${liveTicket.status === "active" ? "text-[#2E7D32]" : "text-[#C62828]"}`}
                  >
                    {liveTicket.status === "active"
                      ? "Khả dụng"
                      : liveTicket.status === "used"
                        ? "Đã hết lượt"
                        : "Hết hạn"}
                  </span>
                </div>
              </div>

              <button
                onClick={closeTicket}
                className="w-full h-11 rounded-xl bg-[#F0F3F7] text-[#4A5A7A] font-bold text-sm"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      <BuyTicketDialog
        isOpen={buyOpen}
        onClose={() => setBuyOpen(false)}
        onSuccess={fetchTickets}
      />
    </div>
  );
}
