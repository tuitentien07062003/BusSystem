import { useState, useRef } from "react";
import {
  X,
  Loader2,
  Upload,
  CheckCircle2,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { submitStudentVerify } from "../../api/ticketsApi";

export function StudentVerifyDialog({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    mssv: "",
    school: "",
    cccd: "",
    full_name: "",
    birth_year: "",
    enrollment_year: "",
    graduation_year: "",
  });

  const [imageBase64, setImageBase64] = useState(null);
  const [isAgreed, setIsAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ảnh không được vượt quá 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImageBase64(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !formData.mssv ||
      !formData.school ||
      !formData.cccd ||
      !formData.full_name ||
      !formData.birth_year ||
      !formData.enrollment_year ||
      !formData.graduation_year
    ) {
      toast.error("Vui lòng nhập đầy đủ thông tin.");
      return;
    }
    if (!imageBase64) {
      toast.error("Vui lòng tải lên ảnh thẻ sinh viên.");
      return;
    }
    if (!isAgreed) {
      toast.error("Bạn cần đồng ý chia sẻ thông tin để tiếp tục.");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitStudentVerify({
        ...formData,
        birth_year: parseInt(formData.birth_year),
        enrollment_year: parseInt(formData.enrollment_year),
        graduation_year: parseInt(formData.graduation_year),
        student_card_image: imageBase64,
      });
      toast.success("Đã gửi yêu cầu xác minh sinh viên!");
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.error || "Gửi xác minh thất bại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 9 + i);
  const enrollYears = years.map((y) => y - 5);
  const gradYears = years;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-[400px] my-8 overflow-hidden animate-in zoom-in-95">
        <div className="flex items-center justify-between p-4 border-b border-[#E5EAF0] sticky top-0 bg-white z-10">
          <h2 className="text-base font-bold text-[#1A2332]">
            Xác minh sinh viên
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-[#F0F3F7]"
          >
            <X size={20} className="text-[#4A5A7A]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#4A5A7A]">
              Họ và tên *
            </label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) =>
                setFormData({ ...formData, full_name: e.target.value })
              }
              className="w-full h-10 px-3 rounded-lg border border-[#D0D7E2] text-sm outline-none focus:border-[#169BA2]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#4A5A7A]">
              Mã số sinh viên *
            </label>
            <input
              type="text"
              value={formData.mssv}
              onChange={(e) =>
                setFormData({ ...formData, mssv: e.target.value })
              }
              className="w-full h-10 px-3 rounded-lg border border-[#D0D7E2] text-sm outline-none focus:border-[#169BA2]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#4A5A7A]">
              Trường *
            </label>
            <input
              type="text"
              value={formData.school}
              onChange={(e) =>
                setFormData({ ...formData, school: e.target.value })
              }
              className="w-full h-10 px-3 rounded-lg border border-[#D0D7E2] text-sm outline-none focus:border-[#169BA2]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#4A5A7A]">
                Năm nhập học *
              </label>
              <select
                value={formData.enrollment_year}
                onChange={(e) =>
                  setFormData({ ...formData, enrollment_year: e.target.value })
                }
                className="w-full h-10 px-3 rounded-lg border border-[#D0D7E2] text-sm outline-none focus:border-[#169BA2] bg-white"
              >
                <option value="">Chọn năm</option>
                {enrollYears.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#4A5A7A]">
                Năm ra trường *
              </label>
              <select
                value={formData.graduation_year}
                onChange={(e) =>
                  setFormData({ ...formData, graduation_year: e.target.value })
                }
                className="w-full h-10 px-3 rounded-lg border border-[#D0D7E2] text-sm outline-none focus:border-[#169BA2] bg-white"
              >
                <option value="">Chọn năm</option>
                {gradYears.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#4A5A7A]">
                CCCD *
              </label>
              <input
                type="text"
                value={formData.cccd}
                onChange={(e) =>
                  setFormData({ ...formData, cccd: e.target.value })
                }
                className="w-full h-10 px-3 rounded-lg border border-[#D0D7E2] text-sm outline-none focus:border-[#169BA2]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#4A5A7A]">
                Năm sinh *
              </label>
              <input
                type="number"
                value={formData.birth_year}
                onChange={(e) =>
                  setFormData({ ...formData, birth_year: e.target.value })
                }
                className="w-full h-10 px-3 rounded-lg border border-[#D0D7E2] text-sm outline-none focus:border-[#169BA2]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#4A5A7A]">
              Ảnh thẻ sinh viên *
            </label>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />

            {!imageBase64 ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-24 border-2 border-dashed border-[#D0D7E2] rounded-xl flex flex-col items-center justify-center text-[#8A9AAA] hover:border-[#169BA2] hover:bg-[#F8FAFC] transition-colors"
              >
                <Upload size={20} className="mb-2" />
                <span className="text-xs font-semibold">
                  Nhấn để tải ảnh lên
                </span>
              </button>
            ) : (
              <div className="relative w-full h-32 rounded-xl overflow-hidden border border-[#E5EAF0]">
                <img
                  src={imageBase64}
                  alt="Thẻ SV"
                  className="w-full h-full object-contain bg-[#F8FAFC]"
                />
                <button
                  type="button"
                  onClick={() => setImageBase64(null)}
                  className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>

          <div className="flex items-start gap-2 pt-2">
            <input
              type="checkbox"
              id="consent"
              checked={isAgreed}
              onChange={(e) => setIsAgreed(e.target.checked)}
              className="mt-1 w-4 h-4 accent-[#169BA2]"
            />
            <label
              htmlFor="consent"
              className="text-[11px] text-[#6A7A9A] leading-relaxed cursor-pointer"
            >
              Tôi đồng ý chia sẻ thông tin cá nhân và ảnh thẻ sinh viên cho TBus
              để xác minh ưu đãi.
            </label>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-11 mt-2 rounded-xl bg-[#169BA2] text-white font-bold text-sm flex items-center justify-center disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              "Gửi xác minh"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
