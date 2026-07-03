import type { CSSProperties } from 'react';
import { cn } from '@/lib/cn';

export function Skeleton({
  className,
  style,
  w,
  h,
}: {
  className?: string;
  style?: CSSProperties;
  w?: number | string;
  h?: number | string;
}) {
  return (
    <div
      className={cn('skeleton', className)}
      style={{ width: w, height: h, ...style }}
    />
  );
}

export function SkeletonLines({ count = 3, widths }: { count?: number; widths?: string[] }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton
          key={i}
          className="sk-line"
          style={{ width: widths?.[i] ?? `${60 + ((i * 13) % 30)}%` }}
        />
      ))}
    </>
  );
}

/** A full stat-card skeleton matching the KPI tiles. */
export function StatCardSkeleton() {
  return (
    <div className="stat-card">
      <div className="top">
        <Skeleton className="sk-line" style={{ width: '52%', marginBottom: 0 }} />
        <Skeleton w={34} h={34} style={{ borderRadius: 6 }} />
      </div>
      <Skeleton style={{ width: '44%', height: 30, margin: '6px 0 14px' }} />
      <Skeleton className="sk-line" style={{ width: '70%' }} />
    </div>
  );
}

/** Rows for a loading table body. */
export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <tbody>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r}>
          {Array.from({ length: cols }).map((_, c) => (
            <td key={c}>
              <Skeleton className="sk-line" style={{ width: c === 0 ? '80%' : '50%', marginBottom: 0 }} />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}
