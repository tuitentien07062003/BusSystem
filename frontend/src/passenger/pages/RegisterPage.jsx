import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, User, Lock, Phone, Mail } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { toast } from "sonner";

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    full_name: "",
    username: "",
    password: "",
    phone: "",
    email: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.password || !formData.full_name) {
      toast.error("Vui lòng nhập đủ Họ tên, Tên đăng nhập và Mật khẩu.");
      return;
    }

    setIsSubmitting(true);
    try {
      await register(formData);
      toast.success("Đăng ký thành công! Vui lòng đăng nhập.");
      navigate("/passenger/login");
    } catch (err) {
      toast.error(err?.response?.data?.error || "Đăng ký thất bại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#1A2332] mb-1">
            Tạo tài khoản
          </h1>
          <p className="text-sm text-[#8A9AAA]">Tham gia cùng TBus Passenger</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#4A5A7A]">
              Họ và tên *
            </label>
            <div className="relative">
              <User
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A9AAA]"
              />
              <input
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="Nguyễn Văn A"
                className="w-full h-12 pl-10 pr-4 rounded-xl border border-[#D0D7E2] bg-white text-sm outline-none focus:border-[#169BA2] focus:ring-2 focus:ring-[#169BA2]/20 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#4A5A7A]">
              Tên đăng nhập *
            </label>
            <div className="relative">
              <User
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A9AAA]"
              />
              <input
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="nguyenvana"
                className="w-full h-12 pl-10 pr-4 rounded-xl border border-[#D0D7E2] bg-white text-sm outline-none focus:border-[#169BA2] focus:ring-2 focus:ring-[#169BA2]/20 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#4A5A7A]">
              Mật khẩu *
            </label>
            <div className="relative">
              <Lock
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A9AAA]"
              />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Ít nhất 6 ký tự"
                className="w-full h-12 pl-10 pr-4 rounded-xl border border-[#D0D7E2] bg-white text-sm outline-none focus:border-[#169BA2] focus:ring-2 focus:ring-[#169BA2]/20 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#4A5A7A]">
                SĐT
              </label>
              <div className="relative">
                <Phone
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A9AAA]"
                />
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="090..."
                  className="w-full h-12 pl-10 pr-4 rounded-xl border border-[#D0D7E2] bg-white text-sm outline-none focus:border-[#169BA2] focus:ring-2 focus:ring-[#169BA2]/20 transition-all"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#4A5A7A]">
                Email
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A9AAA]"
                />
                <input
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="a@gmail.com"
                  className="w-full h-12 pl-10 pr-4 rounded-xl border border-[#D0D7E2] bg-white text-sm outline-none focus:border-[#169BA2] focus:ring-2 focus:ring-[#169BA2]/20 transition-all"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 mt-4 rounded-xl bg-[#169BA2] text-white font-bold text-sm hover:bg-[#0F7075] transition-colors disabled:opacity-50 flex items-center justify-center"
          >
            {isSubmitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              "Đăng ký"
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-[#6A7A9A]">
          Đã có tài khoản?{" "}
          <Link
            to="/passenger/login"
            className="font-semibold text-[#169BA2] hover:underline"
          >
            Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}
