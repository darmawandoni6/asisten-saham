'use client';

import * as React from 'react';

import { type VariantProps, cva } from 'class-variance-authority';

import { cn } from '@/lib/utils';
import { Field } from '@base-ui/react';

const labelVariants = cva(
  'text-xs font-medium leading-none text-slate-700 peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
);

const Label = React.forwardRef<
  HTMLLabelElement,
  React.ComponentPropsWithoutRef<typeof Field.Label> & VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => <Field.Label ref={ref} className={cn(labelVariants(), className)} {...props} />);
Label.displayName = 'Label';

export { Label };
