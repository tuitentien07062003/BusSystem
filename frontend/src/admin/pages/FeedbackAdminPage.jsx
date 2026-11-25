import { useState, useEffect, useCallback } from "react";
import {
  MessageSquare,
  Loader2,
  CheckCircle2,
  Eye,
  Clock,
  X,
} from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { toast } from "sonner";
import axios from "axios";
import { format } from "date-fns";

export function FeedbackAdminPage() {
  const [tab, setTab] = useState("new");
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [viewImage, setViewImage] = useState(null);
  const [note, setNote] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchData = useCallback(() => {
    setIsLoading(true);
    const token = localStorage.getItem("admin_access_token");
    axios
      .get("/passenger-api/admin/feedbacks", {
        params: { status: tab },
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const list = res.data?.data ?? res.data?.feedbacks ?? res.data ?? [];
        const normalized = (Array.isArray(list) ? list : []).map((fb) => ({
          ...fb,
          content: fb.content ?? fb.message ?? fb.feedback_content ?? "",
          images: Array.isArray(fb.images)
            ? fb.images
            : typeof fb.images === "string"
              ? (() => {
                  try {
                    return JSON.parse(fb.images);
                  } catch {
                    return [];
                  }
                })()
              : [],
        }));
        setData(normalized);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [tab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpdateStatus = async (id, status) => {
    setIsProcessing(true);
    try {
      const token = localStorage.getItem("admin_access_token");
      await axios.patch(
        `/passenger-api/admin/feedbacks/${id}`,
        { status, admin_note: note || null },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toast.success("Đã cập nhật");
      setSelected(null);
      setNote("");
      fetchData();
    } catch (err) {
      toast.error("Cập nhật thất bại");
    } finally {
      setIsProcessing(false);
    }
  };

  const TABS = [
    { id: "new", label: "Mới" },
    { id: "reviewed", label: "Đã xem" },
    { id: "resolved", label: "Đã xử lý" },
  ];

  return (
    <div className="h-full overflow-y-auto bg-[#EEF2F6]">
      <div className="max-w-[1400px] mx-auto px-6 py-6 space-y-4">
        <PageHeader
          title="Góp ý & Phản hồi"
          description="Xem và xử lý góp ý từ hành khách"
        />

        <div className="bg-white rounded-xl border border-[#E5EAF0]">
          <div className="p-4 border-b border-[#E5EAF0]">
            <div className="inline-flex bg-[#F8FAFC] p-1 rounded-lg border border-[#E5EAF0]">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${
                    tab === t.id
                      ? "bg-white text-[#169BA2] shadow-sm"
                      : "text-[#6A7A9A] hover:text-[#1A2332]"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-[#F0F3F7]">
            {isLoading ? (
              <div className="py-16 text-center">
                <Loader2
                  size={24}
                  className="animate-spin text-[#169BA2] mx-auto"
                />
              </div>
            ) : data.length === 0 ? (
              <div className="py-16 text-center text-[#8A9AAA]">
                <MessageSquare
                  size={32}
                  className="mx-auto mb-2 text-[#B0BCCA]"
                />
                Không có góp ý nào.
              </div>
            ) : (
              data.map((fb) => (
                <div
                  key={fb.id}
                  onClick={() => setSelected(fb)}
                  className="p-4 hover:bg-[#F8FAFC] cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="text-sm font-bold text-[#1A2332]">
                        {fb.full_name}
                      </div>
                      <div className="text-xs text-[#8A9AAA] mt-0.5">
                        {fb.email || fb.phone || "Không có liên hệ"}
                        {fb.route_id && ` · Tuyến #${fb.route_id}`}
                      </div>
                    </div>
                    <div className="text-xs text-[#8A9AAA] whitespace-nowrap">
                      {format(new Date(fb.created_at), "dd/MM/yyyy HH:mm")}
                    </div>
                  </div>
                  <div className="text-sm text-[#4A5A7A] line-clamp-2">
                    {fb.content || fb.comment || "(Không có nội dung)"}
                  </div>
                  {fb.images?.length > 0 && (
                    <div className="mt-2 text-[10px] text-[#8A9AAA]">
                      📎 {fb.images.length} ảnh đính kèm
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50">
          <div className="bg-white w-full max-w-[500px] h-full flex flex-col animate-in slide-in-from-right">
            <div className="p-4 border-b border-[#E5EAF0] flex items-center justify-between">
              <h2 className="text-base font-bold text-[#1A2332]">
                Chi tiết góp ý
              </h2>
              <button
                onClick={() => {
                  setSelected(null);
                  setNote("");
                }}
                className="p-1 rounded-full hover:bg-[#F0F3F7]"
              >
                <X size={20} className="text-[#4A5A7A]" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div>
                <div className="text-xs text-[#8A9AAA] mb-1">Người gửi</div>
                <div className="text-sm font-bold text-[#1A2332]">
                  {selected.full_name}
                </div>
                <div className="text-xs text-[#4A5A7A] mt-1">
                  {selected.email} {selected.phone && `· ${selected.phone}`}
                </div>
              </div>
              <div>
                <div className="text-xs text-[#8A9AAA] mb-1">Nội dung</div>
                <div className="text-sm text-[#1A2332] leading-relaxed bg-[#F8FAFC] p-3 rounded-xl">
                  {selected.content ||
                    selected.comment ||
                    "(Không có nội dung)"}
                </div>
              </div>
              {selected.images?.length > 0 && (
                <div>
                  <div className="text-xs text-[#8A9AAA] mb-2">
                    Ảnh đính kèm
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {selected.images.map((img, i) => (
                      <img
                        key={i}
                        src={img}
                        alt=""
                        onClick={() => setViewImage(img)}
                        className="aspect-square object-cover rounded-lg cursor-pointer border border-[#E5EAF0]"
                      />
                    ))}
                  </div>
                </div>
              )}
              <div>
                <div className="text-xs text-[#8A9AAA] mb-1">Ghi chú xử lý</div>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  className="w-full p-3 rounded-xl border border-[#D0D7E2] text-sm outline-none focus:border-[#169BA2] resize-none"
                  placeholder="Ghi chú nội bộ..."
                />
              </div>
            </div>
            <div className="p-4 border-t border-[#E5EAF0] flex gap-2">
              <button
                onClick={() => handleUpdateStatus(selected.id, "reviewed")}
                disabled={isProcessing}
                className="flex-1 h-10 rounded-lg bg-[#FEF3E2] text-[#B45309] font-bold text-sm disabled:opacity-50"
              >
                Đã xem
              </button>
              <button
                onClick={() => handleUpdateStatus(selected.id, "resolved")}
                disabled={isProcessing}
                className="flex-1 h-10 rounded-lg bg-[#F1F8F1] text-[#2E7D32] font-bold text-sm disabled:opacity-50"
              >
                Đã xử lý
              </button>
            </div>
          </div>
        </div>
      )}

      {viewImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70"
          onClick={() => setViewImage(null)}
        >
          <img
            src={viewImage}
            alt=""
            className="max-h-[80vh] max-w-full object-contain rounded-lg"
          />
        </div>
      )}
    </div>
  );
}
