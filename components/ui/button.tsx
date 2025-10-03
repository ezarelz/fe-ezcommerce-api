'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        // CTA hitam "Get Now"
        brand:
          'cursor-pointer bg-[rgb(var(--brand-black))] text-white hover:opacity-90 focus-visible:ring-white/40',

        default:
          'cursor-pointer bg-zinc-900 text-zinc-50 hover:cursor-pointer bg-zinc-900/90 focus-visible:ring-zinc-300',

        // Outline seperti "Load More"
        outline:
          'border border-zinc-900 text-zinc-900 hover:cursor-pointer bg-white hover:opacity-90 focus-visible:ring-zinc-300',

        // Ghost (ikon-only atau subtle action)
        ghost: 'text-zinc-900 hover:cursor-pointer bg-zinc-100',

        // Link-style
        link: 'text-zinc-900 underline-offset-4 hover:underline',

        // Soft beige (opsional untuk surface hero)
        beige:
          'cursor-pointer bg-[rgb(var(--brand-beige))] text-zinc-900 hover:brightness-95 focus-visible:ring-zinc-300',

        // destructive (Logout/Delete dsb.)
        destructive:
          'cursor-pointer bg-red-600 text-white hover:bg-red-600/90 focus-visible:ring-red-600',
      },
      size: {
        sm: 'h-9 px-3',
        md: 'h-10 px-4',
        lg: 'h-12 px-5 text-base',
        icon: 'h-10 w-10 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
