import { useState, useEffect, useRef } from "react";
import {
  Send,
  Loader2,
  X,
  Image as ImageIcon,
  CheckCircle2,
  MessageSquare,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import axios from "axios";
import { toast } from "sonner";

export function FeedbackPage() {
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  const [routes, setRoutes] = useState([]);
  const [formData, setFormData] = useState({
    route_id: "",
    full_name: "",
    email: "",
    phone: "",
    content: "",
  });
  const [images, setImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        full_name: prev.full_name || user.full_name || "",
        email: prev.email || user.email || "",
        phone: prev.phone || user.phone || "",
      }));
    }
  }, [user]);

  useEffect(() => {
    axios
      .get("/passenger-api/discovery/map/network")
      .then((res) => {
        setRoutes(res.data.network?.map((n) => n.route) || []);
      })
      .catch(() => {});
  }, []);

  const compressImage = (file, maxWidth = 1280, quality = 0.7) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;
        if (width > maxWidth) {
          height = Math.round((maxWidth / width) * height);
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const handleFileChange = async (e) => {
  const files = Array.from(e.target.files || []);
  const remaining = 3 - images.length;
  if (remaining <= 0) {
    toast.error("Chỉ được đính kèm tối đa 3 ảnh.");
    return;
  }
  const toAdd = files.slice(0, remaining);
  for (const file of toAdd) {
    if (file.size > 2 * 1024 * 1024) {
      toast.error(`Ảnh "${file.name}" vượt quá 2MB.`);
      continue;
    }
    const base64 = await compressImage(file);
    setImages((prev) => [...prev, { file, base64 }]);
  }
  e.target.value = "";
};

  const removeImage = (idx) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.full_name.trim()) {
      toast.error("Vui lòng nhập họ tên.");
      return;
    }
    if (!formData.content.trim() || formData.content.trim().length < 10) {
      toast.error("Nội dung góp ý tối thiểu 10 ký tự.");
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post("/passenger-api/feedbacks", {
        route_id: formData.route_id || null,
        full_name: formData.full_name.trim(),
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        content: formData.content.trim(),
        images: images.map((i) => i.base64),
      });
      setIsSuccess(true);
    } catch (err) {
      toast.error(err?.response?.data?.error || "Gửi góp ý thất bại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      route_id: "",
      full_name: user?.full_name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      content: "",
    });
    setImages([]);
    setIsSuccess(false);
  };

  if (isSuccess) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 bg-[#F1F8F1] rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 size={40} className="text-[#2E7D32]" />
        </div>
        <h2 className="text-xl font-bold text-[#1A2332] mb-2">
          Cảm ơn bạn đã góp ý!
        </h2>
        <p className="text-sm text-[#8A9AAA] mb-8 max-w-[280px]">
          Ý kiến của bạn sẽ được ban quản lý xem xét và phản hồi sớm nhất có
          thể.
        </p>
        <button
          onClick={resetForm}
          className="px-6 py-3 rounded-xl bg-[#169BA2] text-white font-bold text-sm hover:bg-[#0F7075]"
        >
          Gửi góp ý khác
        </button>
      </div>
    );
  }

  return (
    <div className="p-5 md:p-8 max-w-[600px] mx-auto min-h-screen pb-24">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#E6F4F5] flex items-center justify-center">
            <MessageSquare size={20} className="text-[#169BA2]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#1A2332]">
              Góp ý & Phản hồi
            </h1>
            <p className="text-xs text-[#8A9AAA]">
              Giúp TBus phục vụ bạn tốt hơn
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[#4A5A7A]">
            Tuyến xe (không bắt buộc)
          </label>
          <select
            value={formData.route_id}
            onChange={(e) =>
              setFormData({ ...formData, route_id: e.target.value })
            }
            className="w-full h-11 px-3 rounded-xl border border-[#D0D7E2] bg-white text-sm outline-none focus:border-[#169BA2]"
          >
            <option value="">-- Chọn tuyến --</option>
            {routes.map((r) => (
              <option key={r.id} value={r.id}>
                Tuyến {r.short_name} - {r.full_name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[#4A5A7A]">
            Họ và tên <span className="text-[#C62828]">*</span>
          </label>
          <input
            type="text"
            value={formData.full_name}
            onChange={(e) =>
              setFormData({ ...formData, full_name: e.target.value })
            }
            placeholder="Nguyễn Văn A"
            className="w-full h-11 px-3 rounded-xl border border-[#D0D7E2] text-sm outline-none focus:border-[#169BA2]"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#4A5A7A]">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="a@example.com"
              className="w-full h-11 px-3 rounded-xl border border-[#D0D7E2] text-sm outline-none focus:border-[#169BA2]"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#4A5A7A]">
              Số điện thoại
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              placeholder="090..."
              className="w-full h-11 px-3 rounded-xl border border-[#D0D7E2] text-sm outline-none focus:border-[#169BA2]"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[#4A5A7A]">
            Nội dung góp ý <span className="text-[#C62828]">*</span>
          </label>
          <textarea
            value={formData.content}
            onChange={(e) =>
              setFormData({ ...formData, content: e.target.value })
            }
            rows={5}
            maxLength={1000}
            placeholder="Vui lòng mô tả chi tiết vấn đề bạn gặp phải hoặc đề xuất cải thiện..."
            className="w-full p-3 rounded-xl border border-[#D0D7E2] text-sm outline-none focus:border-[#169BA2] resize-none"
          />
          <div className="text-[10px] text-[#8A9AAA] text-right">
            {formData.content.length} / 1000
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-[#4A5A7A]">
            Ảnh đính kèm (tối đa 3)
          </label>
          <div className="grid grid-cols-3 gap-2">
            {images.map((img, idx) => (
              <div
                key={idx}
                className="relative aspect-square rounded-lg overflow-hidden border border-[#E5EAF0]"
              >
                <img
                  src={img.base64}
                  alt=""
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            {images.length < 3 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-lg border-2 border-dashed border-[#D0D7E2] flex flex-col items-center justify-center text-[#8A9AAA] hover:border-[#169BA2] hover:bg-[#F8FAFC] transition-colors"
              >
                <ImageIcon size={20} />
                <span className="text-[10px] mt-1">Thêm ảnh</span>
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-12 rounded-xl bg-[#169BA2] text-white font-bold text-sm hover:bg-[#0F7075] disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Đang gửi...
            </>
          ) : (
            <>
              <Send size={16} /> Gửi góp ý
            </>
          )}
        </button>
      </form>
    </div>
  );
}
