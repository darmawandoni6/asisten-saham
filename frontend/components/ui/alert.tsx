import * as React from 'react';

import { type VariantProps, cva } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const alertVariants = cva(
  'relative w-full rounded-xl border p-4 text-xs [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-slate-950',
  {
    variants: {
      variant: {
        default: 'border-slate-200 bg-white text-slate-900',
        destructive: 'border-rose-200 bg-rose-50 text-rose-800 [&>svg]:text-rose-600',
        warning: 'border-amber-200 bg-amber-50 text-amber-900 [&>svg]:text-amber-600',
        success: 'border-emerald-200 bg-emerald-50 text-emerald-800 [&>svg]:text-emerald-600',
        info: 'border-purple-200 bg-purple-50 text-purple-900 [&>svg]:text-purple-600',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
));
Alert.displayName = 'Alert';

const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5 ref={ref} className={cn('mb-1 text-xs leading-none font-semibold tracking-tight', className)} {...props} />
  ),
);
AlertTitle.displayName = 'AlertTitle';

const AlertDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('text-xs leading-relaxed opacity-90 [&_p]:leading-relaxed', className)} {...props} />
  ),
);
AlertDescription.displayName = 'AlertDescription';

export { Alert, AlertTitle, AlertDescription };
