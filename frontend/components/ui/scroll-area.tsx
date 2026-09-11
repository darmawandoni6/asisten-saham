'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';
import { ScrollArea as BaseScrollArea } from '@base-ui/react';

const ScrollArea = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<typeof BaseScrollArea.Root>>(
  ({ className, children, ...props }, ref) => (
    <BaseScrollArea.Root ref={ref} className={cn('relative overflow-hidden', className)} {...props}>
      <BaseScrollArea.Viewport className="h-full w-full rounded-[inherit]">{children}</BaseScrollArea.Viewport>
      <ScrollBar />
      <BaseScrollArea.Corner />
    </BaseScrollArea.Root>
  ),
);
ScrollArea.displayName = 'ScrollArea';

const ScrollBar = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<typeof BaseScrollArea.Scrollbar>>(
  ({ className, orientation = 'vertical', ...props }, ref) => (
    <BaseScrollArea.Scrollbar
      ref={ref}
      orientation={orientation}
      className={cn(
        'flex touch-none transition-colors select-none',
        orientation === 'vertical' && 'h-full w-2 border-l border-l-transparent p-[1px]',
        orientation === 'horizontal' && 'h-2 flex-col border-t border-t-transparent p-[1px]',
        className,
      )}
      {...props}
    >
      <BaseScrollArea.Thumb className="relative flex-1 rounded-full bg-slate-300 hover:bg-slate-400" />
    </BaseScrollArea.Scrollbar>
  ),
);
ScrollBar.displayName = 'ScrollBar';

export { ScrollArea, ScrollBar };
