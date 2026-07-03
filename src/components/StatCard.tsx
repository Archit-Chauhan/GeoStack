import type { CSSProperties, ReactNode } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { cn } from '@/lib/cn';
import { COLORS } from '@/lib/colors';
import { Sparkline } from './charts/Sparkline';

export interface StatCardProps {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  /** yellow accent value (KPI headline) vs plain strong text */
  accent?: boolean;
  delta?: number;
  /** treat a rising value as bad (e.g. low-stock alerts) → red up-arrow */
  invertDelta?: boolean;
  footNote?: ReactNode;
  spark?: number[];
  sparkColor?: string;
  style?: CSSProperties;
}

export function StatCard({
  label,
  value,
  icon,
  accent = true,
  delta,
  invertDelta,
  footNote,
  spark,
  sparkColor,
  style,
}: StatCardProps) {
  const hasDelta = delta !== undefined && delta !== null;
  const positive = (delta ?? 0) >= 0;
  const good = invertDelta ? !positive : positive;

  return (
    <div className="stat-card reveal" style={style}>
      <div className="top">
        <span className="label">{label}</span>
        {icon ? <span className="ico">{icon}</span> : null}
      </div>
      <div className={cn('value', !accent && 'plain')}>{value}</div>
      <div className="foot">
        {hasDelta ? (
          <span className={cn('delta', good ? 'up' : 'down')}>
            {positive ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
            {Math.abs(delta as number)}
            {invertDelta ? '' : '%'}
          </span>
        ) : null}
        {footNote ? <span className="mute">{footNote}</span> : null}
      </div>
      {spark ? (
        <div style={{ marginTop: 10 }}>
          <Sparkline points={spark} stroke={sparkColor ?? COLORS.primary} />
        </div>
      ) : null}
    </div>
  );
}
