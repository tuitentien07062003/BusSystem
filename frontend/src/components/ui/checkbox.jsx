import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Checkbox({ className, checked, ...props }) {
  return (
    <CheckboxPrimitive.Root
      checked={checked}
      className={cn(
        'peer h-4 w-4 shrink-0 rounded border border-[#cbd5e1] bg-white',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#169BA2]/40',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'data-[state=checked]:bg-[#169BA2] data-[state=checked]:border-[#169BA2]',
        'data-[state=indeterminate]:bg-[#169BA2] data-[state=indeterminate]:border-[#169BA2]',
        'transition-colors cursor-pointer flex items-center justify-center',
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center text-white">
        {checked === 'indeterminate' ? <Minus size={10} /> : <Check size={12} />}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}
