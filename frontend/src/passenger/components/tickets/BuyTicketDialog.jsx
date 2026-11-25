import { useState, useEffect, useRef } from "react";
import {
  X,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Clock,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import {
  getMyStudentVerify,
  payosCheckout,
  payosPoll,
  payosCancel,
} from "../../api/ticketsApi";
import { StudentVerifyDialog } from "./StudentVerifyDialog";

const TICKET_TYPES = [
  {
    id: "single",
    name: "Vé lượt",
    price: 7000,
    studentPrice: 3500,
    desc: "Sử dụng 1 lần",
  },
  {
    id: "bundle",
    name: "Vé tập 30",
    price: 175000,
    studentPrice: 87500,
    desc: "30 lượt / 30 ngày",
  },
  {
    id: "monthly",
    name: "Vé tháng",
    price: 250000,
    studentPrice: 125000,
    desc: "Không giới hạn / 30 ngày",
  },
];

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 10 * 60 * 1000;

export function BuyTicketDialog({ isOpen, onClose, onSuccess }) {
  const [step, setStep] = useState("select");
  const [selectedType, setSelectedType] = useState(TICKET_TYPES[0]);
  const [isStudent, setIsStudent] = useState(false);
  const [verifyRecord, setVerifyRecord] = useState(null);
  const [isEligible, setIsEligible] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [orderCode, setOrderCode] = useState(null);
  const [checkoutUrl, setCheckoutUrl] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [pollCount, setPollCount] = useState(0);

  const pollTimerRef = useRef(null);
  const startedAtRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    setStep("select");
    setSelectedType(TICKET_TYPES[0]);
    setIsStudent(false);
    setOrderCode(null);
    setCheckoutUrl(null);
    setErrorMsg(null);
    setPollCount(0);

    getMyStudentVerify()
      .then((res) => {
        setVerifyRecord(res.data);
        if (res.data?.status === "verified") setIsEligible(true);
      })
      .catch(() => {});
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, []);

  if (!isOpen) return null;

  const currentPrice =
    isStudent && isEligible ? selectedType.studentPrice : selectedType.price;

  const handleCreatePayment = async () => {
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      const data = await payosCheckout({
        ticket_type: selectedType.id,
        is_student: isStudent && isEligible,
      });

      setOrderCode(data.order_code);
      setCheckoutUrl(data.checkout_url);
      setStep("waiting");
      setPollCount(0);
      startedAtRef.current = Date.now();

      window.open(data.checkout_url, "_blank", "noopener,noreferrer");

      startPolling(data.order_code);
    } catch (err) {
      const msg = err?.response?.data?.error || "Không tạo được thanh toán.";
      setErrorMsg(msg);
      setStep("error");
    } finally {
      setIsProcessing(false);
    }
  };

  const startPolling = (oc) => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);

    pollTimerRef.current = setInterval(async () => {
      if (Date.now() - startedAtRef.current > POLL_TIMEOUT_MS) {
        clearInterval(pollTimerRef.current);
        setErrorMsg("Hết thời gian chờ. Vui lòng kiểm tra lại trong mục Vé.");
        setStep("error");
        return;
      }

      try {
        const res = await payosPoll(oc);
        setPollCount((c) => c + 1);

        if (res.status === "paid") {
          clearInterval(pollTimerRef.current);
          setStep("success");
        } else if (res.status === "cancelled") {
          clearInterval(pollTimerRef.current);
          setErrorMsg("Giao dịch đã bị huỷ.");
          setStep("error");
        }
      } catch (err) {
        console.warn("[poll]", err?.response?.data?.error || err.message);
      }
    }, POLL_INTERVAL_MS);
  };

  const handleCancel = async () => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    if (orderCode) {
      try {
        await payosCancel(orderCode);
      } catch (e) {}
    }
    setStep("select");
    setOrderCode(null);
    setCheckoutUrl(null);
  };

  const handleClose = () => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    onClose();
  };

  const handleReopenTab = () => {
    if (checkoutUrl) {
      window.open(checkoutUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50">
        <div className="bg-white rounded-2xl w-full max-w-[420px] overflow-hidden animate-in zoom-in-95">
          {step === "select" && (
            <div className="flex items-center justify-between p-4 border-b border-[#E5EAF0]">
              <h2 className="text-base font-bold text-[#1A2332]">
                Mua vé xe buýt
              </h2>
              <button
                onClick={handleClose}
                className="p-1 rounded-full hover:bg-[#F0F3F7]"
              >
                <X size={20} className="text-[#4A5A7A]" />
              </button>
            </div>
          )}
          {(step === "waiting" || step === "error" || step === "success") && (
            <div className="flex items-center justify-between p-4 border-b border-[#E5EAF0]">
              <h2 className="text-base font-bold text-[#1A2332]">
                {step === "waiting"
                  ? "Chờ thanh toán"
                  : step === "error"
                    ? "Có lỗi xảy ra"
                    : "Hoàn tất"}
              </h2>
              {step !== "success" && (
                <button
                  onClick={handleClose}
                  className="p-1 rounded-full hover:bg-[#F0F3F7]"
                >
                  <X size={20} className="text-[#4A5A7A]" />
                </button>
              )}
            </div>
          )}

          {step === "select" && (
            <div className="p-4 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="space-y-2">
                <div className="text-xs font-semibold text-[#4A5A7A] mb-1">
                  Chọn loại vé
                </div>
                {TICKET_TYPES.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setSelectedType(t)}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                      selectedType.id === t.id
                        ? "border-[#169BA2] bg-[#F0F9FA]"
                        : "border-[#E5EAF0] bg-white"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-sm text-[#1A2332]">
                        {t.name}
                      </span>
                      <span className="font-bold text-sm text-[#169BA2]">
                        {(isStudent && isEligible
                          ? t.studentPrice
                          : t.price
                        ).toLocaleString("vi-VN")}
                        đ
                      </span>
                    </div>
                    <div className="text-xs text-[#8A9AAA]">{t.desc}</div>
                  </div>
                ))}
              </div>

              <StudentCheckbox
                verifyRecord={verifyRecord}
                isStudent={isStudent}
                isEligible={isEligible}
                onChange={setIsStudent}
                onRegister={() => setVerifyOpen(true)}
              />

              <div className="flex items-center gap-3 p-3 rounded-xl border-2 border-[#169BA2] bg-[#F0F9FA]">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                  style={{
                    background:
                      "linear-gradient(135deg,#0068FF 0%,#00A3FF 100%)",
                  }}
                >
                  P
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-[#1A2332]">PayOS</div>
                  <div className="text-[11px] text-[#8A9AAA]">
                    Chuyển khoản qua VietQR — quét bằng app banking
                  </div>
                </div>
                <CheckCircle2
                  size={20}
                  className="text-[#169BA2] flex-shrink-0"
                />
              </div>

              <button
                onClick={handleCreatePayment}
                disabled={isProcessing}
                className="w-full h-11 rounded-xl bg-[#169BA2] text-white font-bold text-sm hover:bg-[#0F7075] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Đang tạo
                    mã...
                  </>
                ) : (
                  `Thanh toán ${currentPrice.toLocaleString("vi-VN")}đ`
                )}
              </button>
            </div>
          )}

          {step === "waiting" && (
            <div className="p-6 space-y-4">
              <div className="text-center">
                <div className="relative w-20 h-20 mx-auto mb-4">
                  <div className="w-20 h-20 rounded-full border-4 border-[#E6F4F5]" />
                  <div className="absolute inset-0 w-20 h-20 rounded-full border-4 border-transparent border-t-[#169BA2] animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl">💳</span>
                  </div>
                </div>
                <h3 className="text-base font-bold text-[#1A2332] mb-1">
                  Đang chờ thanh toán...
                </h3>
                <p className="text-xs text-[#8A9AAA] leading-relaxed">
                  Trang PayOS đã được mở ở tab mới. Vui lòng hoàn tất thanh toán
                  bằng cách quét mã VietQR.
                </p>
              </div>

              <div className="bg-[#F8FAFC] rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-[#8A9AAA]">Số tiền</span>
                  <span className="font-bold text-[#1A2332]">
                    {currentPrice.toLocaleString("vi-VN")}đ
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#8A9AAA]">Mã đơn</span>
                  <span className="font-mono text-[#1A2332]">{orderCode}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#8A9AAA]">Trạng thái</span>
                  <span className="text-[#B45309] font-semibold flex items-center gap-1">
                    <Clock size={11} /> Chờ thanh toán
                  </span>
                </div>
              </div>

              <div className="text-center text-[10px] text-[#8A9AAA]">
                Đang kiểm tra trạng thái ({pollCount} lần) · Tự cập nhật mỗi 3
                giây
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleReopenTab}
                  className="flex-1 h-10 rounded-lg border border-[#D0D7E2] text-[#4A5A7A] font-semibold text-xs hover:bg-[#F8FAFC] flex items-center justify-center gap-1.5"
                >
                  <ExternalLink size={14} />
                  Mở lại PayOS
                </button>
                <button
                  onClick={handleCancel}
                  className="flex-1 h-10 rounded-lg border border-[#FFC8C8] text-[#C62828] font-semibold text-xs hover:bg-[#FEF2F2]"
                >
                  Huỷ giao dịch
                </button>
              </div>
            </div>
          )}

          {step === "success" && (
            <div className="p-6 text-center">
              <CheckCircle2 size={56} className="text-[#2E7D32] mx-auto mb-4" />
              <h3 className="text-lg font-bold text-[#1A2332] mb-1">
                Thanh toán thành công!
              </h3>
              <p className="text-sm text-[#8A9AAA] mb-1">
                Vé điện tử đã được thêm vào ví của bạn.
              </p>
              <p className="text-xs text-[#8A9AAA] mb-6">
                Thanh toán qua PayOS · VietQR
              </p>
              <button
                onClick={() => {
                  onSuccess?.();
                  onClose();
                }}
                className="w-full h-11 rounded-xl bg-[#169BA2] text-white font-bold text-sm"
              >
                Xem vé của tôi
              </button>
            </div>
          )}

          {step === "error" && (
            <div className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-[#FEF2F2] flex items-center justify-center mx-auto mb-4">
                <X size={32} className="text-[#C62828]" />
              </div>
              <h3 className="text-lg font-bold text-[#1A2332] mb-1">
                Thanh toán chưa hoàn tất
              </h3>
              <p className="text-sm text-[#8A9AAA] mb-6">
                {errorMsg || "Vui lòng thử lại."}
              </p>
              <button
                onClick={() => {
                  setStep("select");
                  setOrderCode(null);
                  setCheckoutUrl(null);
                  setErrorMsg(null);
                }}
                className="w-full h-11 rounded-xl bg-[#169BA2] text-white font-bold text-sm"
              >
                Thử lại
              </button>
            </div>
          )}
        </div>
      </div>

      <StudentVerifyDialog
        isOpen={verifyOpen}
        onClose={() => setVerifyOpen(false)}
        onSuccess={() => {
          getMyStudentVerify().then((res) => {
            setVerifyRecord(res.data);
            if (res.data?.status === "verified") setIsEligible(true);
          });
        }}
      />
    </>
  );
}

function StudentCheckbox({
  verifyRecord,
  isStudent,
  isEligible,
  onChange,
  onRegister,
}) {
  if (!verifyRecord) {
    return (
      <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E5EAF0] text-center">
        <p className="text-xs text-[#6A7A9A] mb-2">
          Bạn chưa đăng ký tài khoản sinh viên.
        </p>
        <button
          onClick={onRegister}
          className="text-xs font-bold text-[#169BA2] underline"
        >
          Đăng ký ngay để nhận ưu đãi 50%
        </button>
      </div>
    );
  }

  const isPending = verifyRecord.status === "pending";
  const isRejected = verifyRecord.status === "rejected";

  return (
    <div
      className={`flex items-center justify-between p-3 rounded-xl border ${
        isPending
          ? "bg-[#FEF3E2] border-[#FCD9A0]"
          : isRejected
            ? "bg-[#FEF2F2] border-[#FFC8C8]"
            : "bg-[#F8FAFC] border-[#E5EAF0]"
      }`}
    >
      <div className="flex items-center gap-2">
        <ShieldCheck
          size={18}
          className={
            isPending
              ? "text-[#E08940]"
              : isRejected
                ? "text-[#C62828]"
                : "text-[#169BA2]"
          }
        />
        <div>
          <span className="text-sm font-semibold text-[#1A2332] block">
            Mua vé sinh viên
          </span>
          {isPending && (
            <span className="text-[10px] text-[#E08940] flex items-center gap-1">
              <Clock size={10} /> Đang chờ duyệt hồ sơ
            </span>
          )}
          {isRejected && (
            <span className="text-[10px] text-[#C62828]">Hồ sơ bị từ chối</span>
          )}
        </div>
      </div>
      <input
        type="checkbox"
        checked={isStudent}
        disabled={!isEligible}
        onChange={(e) => onChange(e.target.checked)}
        className="w-5 h-5 accent-[#169BA2] disabled:opacity-50"
      />
    </div>
  );
}
