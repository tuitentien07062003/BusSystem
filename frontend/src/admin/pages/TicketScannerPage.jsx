import { useState } from "react";
import {
  ScanLine,
  CheckCircle2,
  XCircle,
  Loader2,
  Search,
  ArrowRight,
} from "lucide-react";
import { verifyTicketQr } from "@/passenger/api/ticketsAdminApi";
import { toast } from "sonner";

export function TicketScannerPage() {
  const [qrCode, setQrCode] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState(null);

  const MOCK_TRIP_ID = 10;
  const MOCK_VEHICLE_ID = 1;
  const MOCK_ROUTE_ID = 3;

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!qrCode.trim()) return;

    setIsChecking(true);
    setResult(null);

    try {
      const res = await verifyTicketQr({
        qr_code: qrCode.trim(),
        trip_id: MOCK_TRIP_ID,
        vehicle_id: MOCK_VEHICLE_ID,
        route_id: MOCK_ROUTE_ID,
        lat: 10.7725,
        lng: 106.698,
      });

      if (res.valid) {
        setResult({ success: true, data: res.ticket });
        toast.success("Hợp lệ! Mời khách lên xe.");
      } else {
        setResult({ success: false, error: res.reason });
        toast.error("Vé không hợp lệ!");
      }
    } catch (err) {
      setResult({
        success: false,
        error: err?.response?.data?.error || "Lỗi kết nối server.",
      });
      toast.error("Lỗi máy chủ.");
    } finally {
      setIsChecking(false);
      setQrCode("");
    }
  };

  return (
    <div className="h-full bg-[#EEF2F6] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-[500px]">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-[#169BA2] rounded-3xl mx-auto flex items-center justify-center shadow-lg mb-4">
            <ScanLine size={40} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#1A2332]">Máy Quét Vé</h1>
          <p className="text-sm text-[#6A7A9A] mt-1">
            Dành cho nhân viên soát vé
          </p>
        </div>

        <form
          onSubmit={handleVerify}
          className="bg-white rounded-2xl p-6 shadow-sm border border-[#E5EAF0]"
        >
          <label className="text-xs font-bold text-[#4A5A7A] uppercase tracking-wider mb-2 block">
            Nhập mã QR (Giả lập quét Camera)
          </label>
          <div className="relative mb-4">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8A9AAA]"
              size={20}
            />
            <input
              type="text"
              value={qrCode}
              onChange={(e) => setQrCode(e.target.value)}
              placeholder="VD: TB-ABCD1234-XYZ"
              className="w-full h-14 pl-12 pr-4 rounded-xl border-2 border-[#E5EAF0] bg-[#F8FAFC] text-lg font-mono text-[#1A2332] outline-none focus:border-[#169BA2] focus:bg-white transition-all"
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={!qrCode.trim() || isChecking}
            className="w-full h-14 rounded-xl bg-[#169BA2] text-white font-bold text-base hover:bg-[#0F7075] disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
          >
            {isChecking ? (
              <>
                <Loader2 size={20} className="animate-spin" /> Đang kiểm tra...
              </>
            ) : (
              "XÁC NHẬN VÉ"
            )}
          </button>
        </form>

        {result && (
          <div
            className={`mt-6 rounded-2xl p-6 border-2 animate-in slide-in-from-bottom-4 ${result.success ? "bg-[#F1F8F1] border-[#A8D5A8]" : "bg-[#FEF2F2] border-[#FFC8C8]"}`}
          >
            <div className="flex items-start gap-4">
              {result.success ? (
                <CheckCircle2
                  size={40}
                  className="text-[#2E7D32] flex-shrink-0"
                />
              ) : (
                <XCircle size={40} className="text-[#C62828] flex-shrink-0" />
              )}
              <div>
                <h3
                  className={`text-xl font-bold ${result.success ? "text-[#2E7D32]" : "text-[#C62828]"}`}
                >
                  {result.success ? "VÉ HỢP LỆ" : "VÉ KHÔNG HỢP LỆ"}
                </h3>

                {result.success ? (
                  <div className="mt-3 space-y-1 text-sm text-[#4A5A7A]">
                    <p>
                      <span className="font-semibold text-[#1A2332]">
                        Loại vé:
                      </span>{" "}
                      {result.data.ticket_type.toUpperCase()}{" "}
                      {result.data.is_student ? "(Sinh viên)" : ""}
                    </p>
                    <p>
                      <span className="font-semibold text-[#1A2332]">
                        Số lượt còn lại:
                      </span>{" "}
                      {result.data.remaining_uses}
                    </p>
                    <p>
                      <span className="font-semibold text-[#1A2332]">
                        Hết hạn:
                      </span>{" "}
                      {new Date(result.data.expires_at).toLocaleDateString(
                        "vi-VN",
                      )}
                    </p>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-[#C62828] font-medium">
                    {result.error}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
