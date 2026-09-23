import { cn } from '@/lib/utils';

export function Label({ className, children, ...props }) {
  return (
    <label
      className={cn('text-xs font-semibold text-[#4a5a7a] block', className)}
      {...props}
    >
      {children}
    </label>
  );
}
