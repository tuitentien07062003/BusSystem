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
              ? "bg-[#2e7d5a] text-white border border-[#2e7d5a] shadow-sm"
              : "bg-[#e9edf2] text-[#2e7d5a] border border-[#b8d4b0] hover:bg-[#dce8de]"
          }`}
        >
          ↗ LƯỢT ĐI
        </button>
        <button
          onClick={() => setCurrentDir("return")}
          className={`flex-1 py-2 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
            currentDir === "return"
              ? "bg-[#1a5a8a] text-white border border-[#1a5a8a] shadow-sm"
              : "bg-[#e9edf2] text-[#1a5a8a] border border-[#a8c8e8] hover:bg-[#dce8f0]"
          }`}
        >
          ↙ LƯỢT VỀ
        </button>
      </div>
    </div>
  );
}
