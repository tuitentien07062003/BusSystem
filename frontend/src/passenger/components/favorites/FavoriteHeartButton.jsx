import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import {
  listFavorites,
  addFavorite,
  removeFavorite,
} from "../../api/passengerApi";
import { useAuth } from "../../hooks/useAuth";

export function FavoriteHeartButton({ routeId, size = "md" }) {
  const { isAuthenticated } = useAuth();
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteId, setFavoriteId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const sizes = { sm: 16, md: 20, lg: 24 };
  const iconSize = sizes[size] || 20;

  useEffect(() => {
    if (!isAuthenticated || !routeId) return;
    listFavorites({ type: "route" })
      .then((res) => {
        const found = (res.data || []).find((f) => f.target_id === routeId);
        if (found) {
          setIsFavorited(true);
          setFavoriteId(found.id);
        }
      })
      .catch(() => {});
  }, [routeId, isAuthenticated]);

  const toggle = async (e) => {
    e?.stopPropagation();
    e?.preventDefault();

    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để lưu tuyến yêu thích.");
      return;
    }
    setIsLoading(true);
    try {
      if (isFavorited && favoriteId) {
        await removeFavorite(favoriteId);
        setIsFavorited(false);
        setFavoriteId(null);
        toast.success("Đã bỏ khỏi yêu thích");
      } else {
        const res = await addFavorite({ type: "route", target_id: routeId });
        setIsFavorited(true);
        setFavoriteId(res.data?.id);
        toast.success("Đã thêm vào yêu thích");
      }
    } catch (err) {
      toast.error(err?.response?.data?.error || "Thao tác thất bại");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={isLoading}
      title={isFavorited ? "Bỏ yêu thích" : "Yêu thích"}
      className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
        isFavorited
          ? "bg-[#FEF2F2] text-[#E11D48]"
          : "bg-white/90 text-[#8A9AAA] hover:text-[#E11D48] hover:bg-[#FEF2F2]"
      } shadow-sm disabled:opacity-50`}
    >
      <Heart
        size={iconSize}
        fill={isFavorited ? "currentColor" : "none"}
        className="transition-transform active:scale-90"
      />
    </button>
  );
}
