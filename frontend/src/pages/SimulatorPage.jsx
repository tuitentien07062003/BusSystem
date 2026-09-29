// Trang chính: kết hợp Sidebar + MapView
import { useEffect } from "react";
import { toast } from "sonner";
import { Sidebar } from "@/components/Sidebar/Sidebar";
import { MapView } from "@/components/MapView";
import { useSimulation } from "@/hooks/useSimulation";
import { useSimulationData } from "@/hooks/useSimulationData";

export function SimulatorPage() {
  const { currentDir, simData, loadData } = useSimulation();

  // Gọi API lấy dữ liệu mô phỏng cho hướng hiện tại
  const { data, isLoading, isError, error } = useSimulationData(currentDir, 30);

  // Khi có data mới → nạp vào engine
  useEffect(() => {
    if (data && data !== simData) {
      loadData(data);
    }
  }, [data, simData, loadData]);

  // Hiển thị toast khi có lỗi
  useEffect(() => {
    if (isError) {
      toast.error("Không tải được dữ liệu", {
        description: error?.response?.data?.error || error.message,
      });
    }
  }, [isError, error]);

  // Loading state toàn trang
  if (isLoading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-[#e9edf2]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#169BA2] border-t-transparent mx-auto mb-3" />
          <p className="text-sm text-[#4a5a7a]">Đang tải dữ liệu mô phỏng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-screen h-screen overflow-hidden">
      <Sidebar />
      <MapView />
    </div>
  );
}
