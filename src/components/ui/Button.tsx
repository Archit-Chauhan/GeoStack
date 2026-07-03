import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import { Spinner } from './Spinner';

type Variant = 'primary' | 'secondary' | 'ghost' | 'up' | 'down';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: 'md' | 'sm';
  pill?: boolean;
  block?: boolean;
  loading?: boolean;
}

const variantClass: Record<Variant, string> = {
  primary: 'btn--primary',
  secondary: 'btn--secondary',
  ghost: 'btn--ghost',
  up: 'btn--up',
  down: 'btn--down',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', pill, block, loading, className, children, disabled, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      className={cn(
        'btn',
        variantClass[variant],
        size === 'sm' && 'btn--sm',
        pill && 'btn--pill',
        block && 'btn--block',
        className
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <Spinner size={16} /> : children}
    </button>
  );
});
