import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export const Textarea = forwardRef(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        'flex min-h-[80px] w-full rounded-md border border-[#cbd5e1] bg-white px-3 py-2 text-sm text-[#1a2332] outline-none transition-colors resize-y',
        'placeholder:text-[#8a9aaa]',
        'focus:border-[#5fc3e4] focus:ring-2 focus:ring-[#5fc3e4]/20',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  );
});
