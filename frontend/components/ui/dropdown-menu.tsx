'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';
import { Menu as BaseMenu } from '@base-ui/react';

const DropdownMenu = BaseMenu.Root;
const DropdownMenuTrigger = BaseMenu.Trigger;
const DropdownMenuPortal = BaseMenu.Portal;
const DropdownMenuGroup = BaseMenu.Group;

const DropdownMenuContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof BaseMenu.Popup> & { align?: 'start' | 'center' | 'end'; sideOffset?: number }
>(({ className, children, align = 'end', sideOffset = 4, ...props }, ref) => (
  <BaseMenu.Portal>
    <BaseMenu.Positioner sideOffset={sideOffset} align={align} className="z-50 outline-none">
      <BaseMenu.Popup
        ref={ref}
        className={cn(
          'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 relative z-50 min-w-40 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 text-slate-900 shadow-lg outline-none',
          className,
        )}
        {...props}
      >
        {children}
      </BaseMenu.Popup>
    </BaseMenu.Positioner>
  </BaseMenu.Portal>
));
DropdownMenuContent.displayName = 'DropdownMenuContent';

const DropdownMenuItem = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof BaseMenu.Item> & {
    inset?: boolean;
    destructive?: boolean;
  }
>(({ className, inset, destructive, ...props }, ref) => (
  <BaseMenu.Item
    ref={ref}
    className={cn(
      'relative flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors outline-none select-none data-disabled:pointer-events-none data-disabled:opacity-50',
      destructive ? 'text-rose-600 focus:bg-rose-50' : 'text-slate-700 focus:bg-slate-100',
      inset && 'pl-8',
      className,
    )}
    {...props}
  />
));
DropdownMenuItem.displayName = 'DropdownMenuItem';

const DropdownMenuSeparator = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof BaseMenu.Separator>
>(({ className, ...props }, ref) => (
  <BaseMenu.Separator ref={ref} className={cn('-mx-1 my-1 h-px bg-slate-100', className)} {...props} />
));
DropdownMenuSeparator.displayName = 'DropdownMenuSeparator';

const DropdownMenuLabel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'px-2.5 py-1.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase',
      inset && 'pl-8',
      className,
    )}
    {...props}
  />
));
DropdownMenuLabel.displayName = 'DropdownMenuLabel';

export {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
};
