import { useSimulation } from "@/hooks/useSimulation";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

export function HeaderSection() {
  const { currentDir, setCurrentDir } = useSimulation();

  return (
    <div className="bg-white border-b border-[#d0d7e2] px-5 pt-4 pb-3">
      <h2 className="flex items-center gap-2 mb-3">
        <span className="text-[15px] font-semibold text-[#1a2332]">Tuyến</span>
        <Select value="19" onValueChange={() => {}}>
          <SelectTrigger className="text-[15px]">
            <SelectValue placeholder="19" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="19">19</SelectItem>
          </SelectContent>
        </Select>
      </h2>

      <div className="flex gap-1.5">
        <button
          onClick={() => setCurrentDir("go")}
          className={`flex-1 py-2 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
            currentDir === "go"
              ? "bg-[#169BA2] text-white border border-[#169BA2] shadow-sm"
              : "bg-[#e9edf2] text-[#169BA2] border border-[#A8D5D8] hover:bg-[#E6F4F5]"
          }`}
        >
          ↗ LƯỢT ĐI
        </button>
        <button
          onClick={() => setCurrentDir("return")}
          className={`flex-1 py-2 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
            currentDir === "return"
              ? "bg-[#169BA2] text-white border border-[#169BA2] shadow-sm"
              : "bg-[#e9edf2] text-[#169BA2] border border-[#A8D5D8] hover:bg-[#E6F4F5]"
          }`}
        >
          ↙ LƯỢT VỀ
        </button>
      </div>
    </div>
  );
}
