import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Loader2, User, Lock, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { toast } from "sonner";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/passenger";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error("Vui lòng nhập đầy đủ thông tin.");
      return;
    }

    setIsSubmitting(true);
    try {
      await login(username, password);
      toast.success("Đăng nhập thành công!");
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err?.response?.data?.error || "Đăng nhập thất bại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-[#169BA2] to-[#0F7075] text-white p-12 flex-col justify-between">
        <div className="flex items-center gap-2">
          <span className="text-3xl">🚌</span>
          <span className="text-xl font-bold">TBus Passenger</span>
        </div>
        <div>
          <h2 className="text-4xl font-bold mb-4 leading-tight">
            Đi lại thông minh
            <br />
            cùng xe buýt TP.HCM
          </h2>
          <p className="text-white/80">
            Tra cứu tuyến, xem xe realtime, mua vé điện tử
          </p>
        </div>
        <div className="text-sm opacity-60">© 2026 TBus</div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-[400px]">
          <div className="md:hidden flex flex-col items-center mb-8">
            <div className="w-20 h-20 rounded-2xl bg-[#169BA2] flex items-center justify-center mb-4">
              <span className="text-4xl">🚌</span>
            </div>
            <h1 className="text-2xl font-bold text-[#1A2332] mb-1">
              TBus Passenger
            </h1>
            <p className="text-sm text-[#8A9AAA]">Đăng nhập để tiếp tục</p>
          </div>

          <div className="hidden md:block mb-6 text-center">
            <h1 className="text-2xl font-bold text-[#1A2332] mb-1">
              Đăng nhập
            </h1>
            <p className="text-sm text-[#8A9AAA]">Chào mừng bạn quay lại</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#4A5A7A]">
                Tên đăng nhập
              </label>
              <div className="relative">
                <User
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A9AAA]"
                />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nhập tên đăng nhập"
                  className="w-full h-12 pl-10 pr-4 rounded-xl border border-[#D0D7E2] bg-white text-sm outline-none focus:border-[#169BA2] focus:ring-2 focus:ring-[#169BA2]/20 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#4A5A7A]">
                Mật khẩu
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A9AAA]"
                />
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu"
                  className="w-full h-12 pl-10 pr-10 rounded-xl border border-[#D0D7E2] bg-white text-sm outline-none focus:border-[#169BA2] focus:ring-2 focus:ring-[#169BA2]/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A9AAA] hover:text-[#1A2332]"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 mt-2 rounded-xl bg-[#169BA2] text-white font-bold text-sm hover:bg-[#0F7075] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Đang đăng
                  nhập...
                </>
              ) : (
                "Đăng nhập"
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-[#6A7A9A]">
            Chưa có tài khoản?{" "}
            <Link
              to="/passenger/register"
              className="font-semibold text-[#169BA2] hover:underline"
            >
              Đăng ký ngay
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
