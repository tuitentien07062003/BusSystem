import { cn } from "@/lib/utils";

export function Slider({ className, ...props }) {
  return (
    <input
      type="range"
      className={cn("slider-custom w-full", className)}
      {...props}
    />
  );
}
