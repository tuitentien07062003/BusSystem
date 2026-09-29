import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export const Input = forwardRef(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        'flex h-9 w-full rounded-md border border-[#cbd5e1] bg-white px-3 py-1 text-sm text-[#1a2332] outline-none transition-colors',
        'placeholder:text-[#8a9aaa]',
        'focus:border-[#169BA2] focus:ring-2 focus:ring-[#169BA2]/20',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  );
});
