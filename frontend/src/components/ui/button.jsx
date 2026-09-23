import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
  {
    variants: {
      variant: {
        primary: 'bg-[#2e7d5a] text-white hover:bg-[#3a9a70]',
        secondary: 'bg-[#e9edf2] text-[#4a5a7a] hover:bg-[#d0d7e2] hover:text-[#1a2332]',
        ghost: 'hover:bg-[#eef2f6] text-[#4a5a7a]',
        outline: 'border border-[#d0d7e2] bg-white hover:bg-[#eef2f6]',
        danger: 'bg-[#c0392b] text-white hover:bg-[#a93226]',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-10 px-6',
        full: 'h-9 w-full px-4 py-2',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
);

export function Button({ className, variant, size, asChild = false, ...props }) {
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />
  );
}
