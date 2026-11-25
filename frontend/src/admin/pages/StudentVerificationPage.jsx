import { useState, useEffect, useCallback } from "react";
import {
  GraduationCap,
  Check,
  X,
  Search,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { getStudentVerifications, verifyStudent } from "@/api/adminStudentsApi";
import { PageHeader } from "../components/PageHeader";
import { toast } from "sonner";
import { format } from "date-fns";

export function StudentVerificationPage() {
  const [tab, setTab] = useState("pending");
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewImage, setViewImage] = useState(null);

  const fetchData = useCallback(() => {
    setIsLoading(true);
    getStudentVerifications({ status: tab, q: search })
      .then((res) => setData(res.data || []))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [tab, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleVerify = async (id, status, reason = null) => {
    setIsProcessing(true);
    try {
      await verifyStudent(id, { status, rejection_reason: reason });
      toast.success(
        status === "verified" ? "Đã duyệt sinh viên" : "Đã từ chối",
      );
      setRejectingId(null);
      setRejectReason("");
      fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.error || "Thao tác thất bại");
    } finally {
      setIsProcessing(false);
    }
  };

  const TABS = [
    { id: "pending", label: "Chờ duyệt" },
    { id: "verified", label: "Đã duyệt" },
    { id: "rejected", label: "Từ chối" },
  ];

  return (
    <div className="h-full overflow-y-auto bg-[#EEF2F6]">
      <div className="max-w-[1400px] mx-auto px-6 py-6 space-y-4">
        <PageHeader
          title="Xác minh Sinh viên"
          description="Quản lý và phê duyệt thông tin để mua vé ưu đãi"
        />

        <div className="bg-white rounded-xl border border-[#E5EAF0] flex flex-col">
          <div className="p-4 border-b border-[#E5EAF0] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex bg-[#F8FAFC] p-1 rounded-lg border border-[#E5EAF0]">
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

            <div className="relative w-full sm:w-[300px]">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A9AAA]"
                size={16}
              />
              <input
                type="text"
                placeholder="Tìm MSSV, tên..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-9 pl-9 pr-3 rounded-md border border-[#D0D7E2] text-sm outline-none focus:border-[#169BA2]"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#F8FAFC] border-b border-[#E5EAF0] text-[#6A7A9A] uppercase text-[11px] font-bold tracking-wider">
                <tr>
                  <th className="px-4 py-3">MSSV / CCCD</th>
                  <th className="px-4 py-3">Họ tên / Năm sinh</th>
                  <th className="px-4 py-3">Trường</th>
                  <th className="px-4 py-3">Ngày gửi</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F3F7]">
                {data.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-[#F8FAFC] transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="font-bold text-[#1A2332] font-mono">
                        {item.mssv}
                      </div>
                      <div className="text-xs text-[#8A9AAA] mt-0.5">
                        {item.cccd}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-[#1A2332]">
                        {item.full_name}
                      </div>
                      <div className="text-xs text-[#8A9AAA] mt-0.5">
                        {item.birth_year}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#4A5A7A]">
                      <div>{item.school}</div>
                      <div className="text-xs text-[#8A9AAA] mt-0.5">
                        {item.enrollment_year} - {item.graduation_year}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#4A5A7A]">
                      {format(new Date(item.created_at), "dd/MM/yyyy HH:mm")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setViewImage(item.student_card_image)}
                          className="px-2.5 py-1.5 rounded bg-[#E6F4F5] text-[#169BA2] hover:bg-[#A8D5D8] font-semibold text-xs transition-colors"
                        >
                          Xem ảnh
                        </button>

                        {tab === "pending" ? (
                          <>
                            <button
                              onClick={() => handleVerify(item.id, "verified")}
                              disabled={isProcessing}
                              className="px-2.5 py-1.5 rounded bg-[#F1F8F1] text-[#2E7D32] hover:bg-[#A8D5A8] font-semibold text-xs transition-colors disabled:opacity-50"
                            >
                              Duyệt
                            </button>
                            <button
                              onClick={() => setRejectingId(item.id)}
                              disabled={isProcessing}
                              className="px-2.5 py-1.5 rounded bg-[#FEF2F2] text-[#C62828] hover:bg-[#FFC8C8] font-semibold text-xs transition-colors disabled:opacity-50"
                            >
                              Từ chối
                            </button>
                          </>
                        ) : tab === "rejected" ? (
                          <span className="text-xs text-[#C62828] italic max-w-[100px] truncate">
                            {item.rejection_reason}
                          </span>
                        ) : (
                          <span className="text-xs text-[#2E7D32] font-semibold">
                            Đã duyệt
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {viewImage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70">
          <div className="bg-white rounded-xl shadow-2xl max-w-[500px] w-full overflow-hidden animate-in zoom-in-95">
            <div className="p-4 border-b border-[#E5EAF0] flex justify-between items-center">
              <h3 className="font-bold text-[#1A2332]">Ảnh thẻ sinh viên</h3>
              <button
                onClick={() => setViewImage(null)}
                className="p-1 rounded-full hover:bg-[#F0F3F7]"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 bg-[#F8FAFC] flex justify-center">
              <img
                src={viewImage}
                alt="Thẻ SV"
                className="max-h-[60vh] object-contain rounded-lg shadow-sm"
              />
            </div>
            <div className="p-4 text-center">
              <button
                onClick={() => setViewImage(null)}
                className="px-6 py-2 rounded-lg bg-[#169BA2] text-white font-bold text-sm"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {rejectingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-[400px] p-6 animate-in zoom-in-95">
            <div className="flex items-center gap-3 mb-4 text-[#C62828]">
              <AlertCircle size={24} />
              <h2 className="text-lg font-bold">Từ chối xác minh</h2>
            </div>
            <p className="text-sm text-[#4A5A7A] mb-4">
              Vui lòng nhập lý do từ chối để sinh viên biết và cập nhật lại.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full h-24 p-3 rounded-lg border border-[#D0D7E2] text-sm outline-none focus:border-[#C62828] resize-none mb-4"
              placeholder="VD: Ảnh thẻ sinh viên bị mờ, CCCD không khớp..."
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRejectingId(null)}
                className="px-4 py-2 rounded-lg border border-[#D0D7E2] text-sm font-semibold text-[#6A7A9A] hover:bg-[#F8FAFC]"
              >
                Hủy
              </button>
              <button
                onClick={() =>
                  handleVerify(rejectingId, "rejected", rejectReason)
                }
                disabled={!rejectReason.trim() || isProcessing}
                className="px-4 py-2 rounded-lg bg-[#C62828] text-white text-sm font-bold hover:bg-[#A32222] disabled:opacity-50"
              >
                {isProcessing ? "Đang xử lý..." : "Xác nhận từ chối"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
