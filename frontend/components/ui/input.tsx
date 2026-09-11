'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';
import { Input as BaseInput } from '@base-ui/react';

const Input = React.forwardRef<HTMLInputElement, React.ComponentPropsWithoutRef<typeof BaseInput>>(
  ({ className, type, ...props }, ref) => {
    return (
      <BaseInput
        type={type}
        className={cn(
          'flex h-9 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-1 text-xs shadow-2xs transition-colors file:border-0 file:bg-transparent file:text-xs file:font-medium file:text-slate-950 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-emerald-500 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-xs',
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';

export { Input };
