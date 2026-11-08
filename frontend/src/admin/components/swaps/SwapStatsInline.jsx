import { ArrowRightLeft, User as UserIcon, TrendingUp } from "lucide-react";
import { useSwapStats } from "@/hooks/useShiftSwaps";

export function SwapStatsInline({ from, to }) {
  const { data, isLoading } = useSwapStats({ from, to });

  const total = data?.total_swaps || 0;
  const topOriginal = data?.top_original_drivers || [];
  const topSubstitute = data?.top_substitute_drivers || [];

  if (isLoading) {
    return <div className="text-[11px] text-[#8A9AAA]">Đang tải...</div>;
  }

  if (total === 0) {
    return (
      <div className="text-[11px] text-[#8A9AAA]">
        Chưa có lượt đổi ca nào trong khoảng này
      </div>
    );
  }

  const topAn = topOriginal[0];
  const topBinh = topSubstitute[0];

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]">
      <div className="inline-flex items-center gap-1.5">
        <div className="w-4 h-4 rounded-md bg-[#9333EA] flex items-center justify-center flex-shrink-0">
          <ArrowRightLeft size={9} className="text-white" />
        </div>
        <span className="text-[#1A2332] font-bold">{total}</span>
        <span className="text-[#8A9AAA]">lượt swap</span>
      </div>

      {topAn && (
        <>
          <span className="text-[#E5EAF0]">·</span>
          <div className="inline-flex items-center gap-1.5">
            <UserIcon size={10} className="text-[#C62828]" />
            <span className="text-[#8A9AAA]">Bị thay nhiều:</span>
            <span className="text-[#1A2332] font-semibold">
              {topAn.full_name}
            </span>
            <span className="text-[#C62828] font-bold">
              ({topAn.swap_count})
            </span>
          </div>
        </>
      )}

      {topBinh && (
        <>
          <span className="text-[#E5EAF0]">·</span>
          <div className="inline-flex items-center gap-1.5">
            <TrendingUp size={10} className="text-[#2E7D32]" />
            <span className="text-[#8A9AAA]">Thay nhiều:</span>
            <span className="text-[#1A2332] font-semibold">
              {topBinh.full_name}
            </span>
            <span className="text-[#2E7D32] font-bold">
              ({topBinh.swap_count})
            </span>
          </div>
        </>
      )}
    </div>
  );
}
