import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type PillTone = 'in-stock' | 'low' | 'critical' | 'neutral' | 'info';

export function Pill({
  tone = 'neutral',
  dot,
  children,
  className,
}: {
  tone?: PillTone;
  dot?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={cn('pill', tone, dot && 'pill--dot', className)}>{children}</span>
  );
}

export function Tag({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn('tag', className)}>{children}</span>;
}
