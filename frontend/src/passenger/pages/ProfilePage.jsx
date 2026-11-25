import { useState, useEffect } from "react";
import {
  LogOut,
  User,
  Phone,
  Mail,
  Ticket,
  ChevronRight,
  GraduationCap,
  CheckCircle2,
  XCircle,
  Clock,
  Heart,
  MapPin,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";
import { getMyStudentVerify } from "../api/ticketsApi";
import { StudentVerifyDialog } from "../components/tickets/StudentVerifyDialog";
import { listFavorites } from "../api/passengerApi";

export function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [verifyData, setVerifyData] = useState(null);
  const [isLoadingVerify, setIsLoadingVerify] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [favorites, setFavorites] = useState([]);

  const fetchVerify = () => {
    setIsLoadingVerify(true);
    getMyStudentVerify()
      .then((res) => setVerifyData(res.data))
      .catch((err) => console.error(err))
      .finally(() => setIsLoadingVerify(false));
  };

  useEffect(() => {
    fetchVerify();
  }, []);

  const handleLogout = async () => {
    if (confirm("Bạn có chắc muốn đăng xuất?")) {
      await logout();
      navigate("/passenger");
    }
  };

  const renderVerifyStatus = () => {
    if (isLoadingVerify)
      return <span className="text-xs text-[#8A9AAA]">Đang tải...</span>;
    if (!verifyData) {
      return (
        <button
          onClick={() => setDialogOpen(true)}
          className="px-3 py-1.5 bg-[#169BA2] text-white text-xs font-bold rounded-lg hover:bg-[#0F7075]"
        >
          Đăng ký ngay
        </button>
      );
    }

    const { status, rejection_reason, mssv, school } = verifyData;

    if (status === "pending") {
      return (
        <div className="text-right">
          <span className="inline-flex items-center gap-1 text-[#E08940] text-xs font-bold bg-[#FEF3E2] px-2 py-1 rounded-md">
            <Clock size={12} /> Chờ duyệt
          </span>
          <div className="text-[10px] text-[#8A9AAA] mt-1">
            {mssv} - {school}
          </div>
        </div>
      );
    }
    if (status === "verified") {
      return (
        <div className="text-right">
          <span className="inline-flex items-center gap-1 text-[#2E7D32] text-xs font-bold bg-[#F1F8F1] px-2 py-1 rounded-md">
            <CheckCircle2 size={12} /> Đã xác minh
          </span>
          <div className="text-[10px] text-[#8A9AAA] mt-1">
            {mssv} - {school}
          </div>
        </div>
      );
    }
    if (status === "rejected") {
      return (
        <div className="text-right">
          <span className="inline-flex items-center gap-1 text-[#C62828] text-xs font-bold bg-[#FEF2F2] px-2 py-1 rounded-md">
            <XCircle size={12} /> Bị từ chối
          </span>
          <div
            className="text-[10px] text-[#C62828] mt-1 max-w-[150px] truncate"
            title={rejection_reason}
          >
            Lý do: {rejection_reason}
          </div>
          <button
            onClick={() => setDialogOpen(true)}
            className="text-[10px] text-[#169BA2] font-semibold underline mt-1"
          >
            Gửi lại
          </button>
        </div>
      );
    }
  };

  return (
    <div className="p-5 md:p-8 max-w-[600px] mx-auto min-h-screen">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-full bg-[#169BA2] flex items-center justify-center text-white text-2xl font-bold shadow-md">
          {user?.full_name?.charAt(0)?.toUpperCase() || "U"}
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#1A2332]">
            {user?.full_name}
          </h1>
          <p className="text-sm text-[#8A9AAA]">@{user?.username}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#E5EAF0] overflow-hidden mb-6">
        <div className="flex items-center gap-3 p-4 bg-[#F8FAFC] border-b border-[#E5EAF0]">
          <GraduationCap size={20} className="text-[#169BA2]" />
          <span className="flex-1 text-sm font-bold text-[#1A2332]">
            Tài khoản Sinh viên
          </span>
        </div>
        <div className="p-4 flex items-center justify-between">
          <div className="text-sm text-[#6A7A9A]">Trạng thái xác minh:</div>
          {renderVerifyStatus()}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#E5EAF0] overflow-hidden mb-6">
        <div className="flex items-center gap-3 p-4 border-b border-[#F0F3F7]">
          <Phone size={18} className="text-[#8A9AAA]" />
          <div className="flex-1">
            <div className="text-[10px] font-semibold text-[#8A9AAA] uppercase">
              Số điện thoại
            </div>
            <div className="text-sm text-[#1A2332] font-medium">
              {user?.phone || "Chưa cập nhật"}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4">
          <Mail size={18} className="text-[#8A9AAA]" />
          <div className="flex-1">
            <div className="text-[10px] font-semibold text-[#8A9AAA] uppercase">
              Email
            </div>
            <div className="text-sm text-[#1A2332] font-medium">
              {user?.email || "Chưa cập nhật"}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#E5EAF0] overflow-hidden mb-6">
        <div className="flex items-center gap-3 p-4 bg-[#F8FAFC] border-b border-[#E5EAF0]">
          <Heart size={18} className="text-[#E11D48]" fill="currentColor" />
          <span className="flex-1 text-sm font-bold text-[#1A2332]">
            Tuyến yêu thích ({favorites.length})
          </span>
        </div>
        <div className="divide-y divide-[#F0F3F7]">
          {favorites.map((fav) => (
            <Link
              key={fav.id}
              to={`/passenger/routes/${fav.target_id}`}
              className="flex items-center gap-3 p-4 hover:bg-[#F8FAFC] transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-[#E6F4F5] flex items-center justify-center flex-shrink-0">
                <MapPin size={16} className="text-[#169BA2]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-[#1A2332]">
                  Tuyến #{fav.target_id}
                </div>
                <div className="text-xs text-[#8A9AAA] mt-0.5">
                  Đã thêm {new Date(fav.created_at).toLocaleDateString("vi-VN")}
                </div>
              </div>
              <ChevronRight size={18} className="text-[#B0BCCA]" />
            </Link>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#E5EAF0] overflow-hidden mb-6">
        <Link
          to="/passenger/tickets"
          className="flex items-center gap-3 p-4 hover:bg-[#F8FAFC] transition-colors"
        >
          <Ticket size={18} className="text-[#169BA2]" />
          <span className="flex-1 text-sm font-semibold text-[#1A2332]">
            Vé của tôi
          </span>
          <ChevronRight size={18} className="text-[#B0BCCA]" />
        </Link>
      </div>

      <button
        onClick={handleLogout}
        className="w-full h-12 flex items-center justify-center gap-2 rounded-xl border border-[#FFC8C8] text-[#C62828] font-semibold text-sm hover:bg-[#FEF2F2] transition-colors"
      >
        <LogOut size={16} /> Đăng xuất
      </button>

      <StudentVerifyDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSuccess={fetchVerify}
      />
    </div>
  );
}
