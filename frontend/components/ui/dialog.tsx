'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';
import { Dialog as BaseDialog } from '@base-ui/react';

const Dialog = BaseDialog.Root;
const DialogTrigger = BaseDialog.Trigger;
const DialogPortal = BaseDialog.Portal;
const DialogClose = BaseDialog.Close;

const DialogOverlay = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<typeof BaseDialog.Backdrop>>(
  ({ className, ...props }, ref) => (
    <BaseDialog.Backdrop
      ref={ref}
      className={cn(
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs',
        className,
      )}
      {...props}
    />
  ),
);
DialogOverlay.displayName = 'DialogOverlay';

const DialogContent = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<typeof BaseDialog.Popup>>(
  ({ className, children, ...props }, ref) => (
    <DialogPortal>
      <DialogOverlay />
      <BaseDialog.Popup
        ref={ref}
        className={cn(
          'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] fixed top-[50%] left-[50%] z-50 flex grid max-h-[88vh] w-[calc(100%-2rem)] max-w-3xl translate-x-[-50%] translate-y-[-50%] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl duration-200 sm:max-h-[90vh]',
          className,
        )}
        {...props}
      >
        {children}
      </BaseDialog.Popup>
    </DialogPortal>
  ),
);
DialogContent.displayName = 'DialogContent';

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex shrink-0 flex-col space-y-1.5 border-b border-slate-100 bg-white/95 p-5 text-center backdrop-blur-xs sm:p-6 sm:text-left',
      className,
    )}
    {...props}
  />
);
DialogHeader.displayName = 'DialogHeader';

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex shrink-0 flex-col-reverse border-t border-slate-100 bg-slate-50/80 p-4 backdrop-blur-xs sm:flex-row sm:justify-end sm:space-x-2',
      className,
    )}
    {...props}
  />
);
DialogFooter.displayName = 'DialogFooter';

const DialogTitle = React.forwardRef<HTMLHeadingElement, React.ComponentPropsWithoutRef<typeof BaseDialog.Title>>(
  ({ className, ...props }, ref) => (
    <BaseDialog.Title
      ref={ref}
      className={cn('text-base leading-none font-bold tracking-tight text-slate-900 sm:text-lg', className)}
      {...props}
    />
  ),
);
DialogTitle.displayName = 'DialogTitle';

const DialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.ComponentPropsWithoutRef<typeof BaseDialog.Description>
>(({ className, ...props }, ref) => (
  <BaseDialog.Description ref={ref} className={cn('text-xs text-slate-500', className)} {...props} />
));
DialogDescription.displayName = 'DialogDescription';

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
