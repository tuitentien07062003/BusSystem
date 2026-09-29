import { cn } from '@/lib/utils';

const VARIANTS = {
  success: 'bg-[#E6F4F5] text-[#169BA2] border-[#A8D5D8]',
  danger: 'bg-[#fde8e8] text-[#c0392b] border-[#f5b7b1]',
  info: 'bg-[#E6F4F5] text-[#169BA2] border-[#A8D5D8]',
  muted: 'bg-[#eef2f6] text-[#6a7a9a] border-[#d0d7e2]',
  warning: 'bg-[#fdf2e3] text-[#d48c2c] border-[#f5d7a1]',
};

export function Badge({ variant = 'muted', className, children, ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap',
        VARIANTS[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
