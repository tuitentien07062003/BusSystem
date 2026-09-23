// Hàm cn() để gộp class Tailwind (chuẩn shadcn)
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
