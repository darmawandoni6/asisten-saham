'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';
import { Separator as BaseSeparator } from '@base-ui/react';

const Separator = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<typeof BaseSeparator>>(
  ({ className, orientation = 'horizontal', ...props }, ref) => (
    <BaseSeparator
      ref={ref}
      orientation={orientation}
      className={cn(
        'shrink-0 bg-slate-100',
        orientation === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]',
        className,
      )}
      {...props}
    />
  ),
);
Separator.displayName = 'Separator';

export { Separator };
