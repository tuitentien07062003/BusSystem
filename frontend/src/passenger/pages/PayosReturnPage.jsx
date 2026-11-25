import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { payosPoll } from "../api/ticketsApi";

export function PayosReturnPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    const orderCode = params.get("orderCode");
    const code = params.get("code");
    const cancel = params.get("cancel");

    if (!orderCode) {
      setStatus("error");
      return;
    }

    if (cancel === "true" || code !== "00") {
      setStatus("error");
      return;
    }

    let attempts = 0;
    const iv = setInterval(async () => {
      attempts++;
      try {
        const res = await payosPoll(Number(orderCode));
        if (res.status === "paid") {
          clearInterval(iv);
          setStatus("success");
          setTimeout(
            () => navigate("/passenger/tickets", { replace: true }),
            1500,
          );
          return;
        }
        if (attempts >= 6) {
          clearInterval(iv);
          setStatus("pending");
        }
      } catch {
        if (attempts >= 6) {
          clearInterval(iv);
          setStatus("pending");
        }
      }
    }, 1500);

    return () => clearInterval(iv);
  }, [params, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      {status === "checking" && (
        <>
          <Loader2 size={40} className="animate-spin text-[#169BA2] mb-4" />
          <h2 className="text-lg font-bold text-[#1A2332]">Đang xác nhận...</h2>
          <p className="text-sm text-[#8A9AAA] mt-1">
            Vui lòng đợi trong giây lát
          </p>
        </>
      )}
      {status === "success" && (
        <>
          <CheckCircle2 size={56} className="text-[#2E7D32] mb-4" />
          <h2 className="text-lg font-bold text-[#1A2332]">
            Thanh toán thành công!
          </h2>
          <p className="text-sm text-[#8A9AAA] mt-1">
            Đang chuyển về trang vé...
          </p>
        </>
      )}
      {status === "pending" && (
        <>
          <Loader2 size={40} className="text-[#B45309] mb-4" />
          <h2 className="text-lg font-bold text-[#1A2332]">Đang xử lý</h2>
          <p className="text-sm text-[#8A9AAA] mt-1 mb-6">
            Giao dịch có thể mất 1-2 phút. Vé sẽ xuất hiện trong mục Vé của tôi.
          </p>
          <button
            onClick={() => navigate("/passenger/tickets")}
            className="px-5 py-2.5 rounded-xl bg-[#169BA2] text-white font-bold text-sm"
          >
            Về trang vé
          </button>
        </>
      )}
      {status === "error" && (
        <>
          <XCircle size={56} className="text-[#C62828] mb-4" />
          <h2 className="text-lg font-bold text-[#1A2332]">
            Thanh toán thất bại
          </h2>
          <p className="text-sm text-[#8A9AAA] mt-1 mb-6">
            Giao dịch đã bị huỷ hoặc không hoàn tất.
          </p>
          <button
            onClick={() => navigate("/passenger/tickets")}
            className="px-5 py-2.5 rounded-xl bg-[#169BA2] text-white font-bold text-sm"
          >
            Về trang vé
          </button>
        </>
      )}
    </div>
  );
}
