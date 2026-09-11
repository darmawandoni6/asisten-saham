'use client';

import * as React from 'react';

import { Check, ChevronDown } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Select as BaseSelect } from '@base-ui/react';

const Select = BaseSelect.Root;
const SelectGroup = BaseSelect.Group;
const SelectValue = BaseSelect.Value;

const SelectTrigger = React.forwardRef<HTMLButtonElement, React.ComponentPropsWithoutRef<typeof BaseSelect.Trigger>>(
  ({ className, children, ...props }, ref) => (
    <BaseSelect.Trigger
      ref={ref}
      className={cn(
        'flex h-9 w-full cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 py-1 text-xs text-slate-900 shadow-2xs transition-colors placeholder:text-slate-400 focus:ring-1 focus:ring-emerald-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1',
        className,
      )}
      {...props}
    >
      {children}
      <BaseSelect.Icon className="h-4 w-4 opacity-50">
        <ChevronDown className="h-4 w-4" />
      </BaseSelect.Icon>
    </BaseSelect.Trigger>
  ),
);
SelectTrigger.displayName = 'SelectTrigger';

const SelectContent = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<typeof BaseSelect.Popup>>(
  ({ className, children, ...props }, ref) => (
    <BaseSelect.Portal>
      <BaseSelect.Positioner sideOffset={4} className="z-50">
        <BaseSelect.Popup
          ref={ref}
          className={cn(
            'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 relative max-h-96 min-w-[8rem] overflow-hidden rounded-xl border border-slate-200 bg-white p-1 text-slate-950 shadow-md',
            className,
          )}
          {...props}
        >
          {children}
        </BaseSelect.Popup>
      </BaseSelect.Positioner>
    </BaseSelect.Portal>
  ),
);
SelectContent.displayName = 'SelectContent';

const SelectLabel = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<typeof BaseSelect.GroupLabel>>(
  ({ className, ...props }, ref) => (
    <BaseSelect.GroupLabel
      ref={ref}
      className={cn('px-2 py-1.5 text-xs font-semibold text-slate-500', className)}
      {...props}
    />
  ),
);
SelectLabel.displayName = 'SelectLabel';

const SelectItem = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<typeof BaseSelect.Item>>(
  ({ className, children, ...props }, ref) => (
    <BaseSelect.Item
      ref={ref}
      className={cn(
        'relative flex w-full cursor-pointer items-center rounded-lg py-1.5 pr-8 pl-2 text-xs text-slate-700 outline-none select-none focus:bg-slate-100 focus:text-slate-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className,
      )}
      {...props}
    >
      <BaseSelect.ItemIndicator className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
        <Check className="h-4 w-4 text-emerald-600" />
      </BaseSelect.ItemIndicator>
      <BaseSelect.ItemText>{children}</BaseSelect.ItemText>
    </BaseSelect.Item>
  ),
);
SelectItem.displayName = 'SelectItem';

const SelectSeparator = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<typeof BaseSelect.Separator>>(
  ({ className, ...props }, ref) => (
    <BaseSelect.Separator ref={ref} className={cn('-mx-1 my-1 h-px bg-slate-100', className)} {...props} />
  ),
);
SelectSeparator.displayName = 'SelectSeparator';

export { Select, SelectGroup, SelectValue, SelectTrigger, SelectContent, SelectLabel, SelectItem, SelectSeparator };
