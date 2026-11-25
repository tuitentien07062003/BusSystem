import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "../hooks/useAdminAuth";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export function AdminLoginPage() {
  const { login } = useAdminAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await login(username, password);
      toast.success("Đăng nhập Admin thành công!");
      navigate("/admin/stops");
    } catch (err) {
      toast.error(
        err?.response?.data?.error || err.message || "Đăng nhập thất bại",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#EEF2F6] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-[400px] p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#E6F4F5] rounded-2xl mx-auto flex items-center justify-center mb-4">
            <ShieldCheck size={32} className="text-[#169BA2]" />
          </div>
          <h1 className="text-2xl font-bold text-[#1A2332]">TBus Admin</h1>
          <p className="text-sm text-[#8A9AAA] mt-1">
            Hệ thống quản lý vận hành
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-[#4A5A7A] uppercase tracking-wider block mb-1.5">
              Tên đăng nhập
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full h-11 px-4 rounded-xl border border-[#D0D7E2] text-sm outline-none focus:border-[#169BA2] focus:ring-2 focus:ring-[#169BA2]/20 transition-all"
              placeholder="admin"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs font-bold text-[#4A5A7A] uppercase tracking-wider block mb-1.5">
              Mật khẩu
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-11 px-4 rounded-xl border border-[#D0D7E2] text-sm outline-none focus:border-[#169BA2] focus:ring-2 focus:ring-[#169BA2]/20 transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !username || !password}
            className="w-full h-11 mt-4 rounded-xl bg-[#169BA2] text-white font-bold text-sm hover:bg-[#0F7075] transition-colors disabled:opacity-50 flex items-center justify-center"
          >
            {isSubmitting ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              "Đăng nhập"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
