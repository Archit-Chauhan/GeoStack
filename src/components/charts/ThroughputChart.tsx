import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from 'recharts';
import type { ThroughputPoint } from '@/types';
import { formatNumber } from '@/lib/format';
import { useThemeColors } from '@/lib/colors';

function ChartTip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tip">
      <div className="k" style={{ marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', gap: 10, justifyContent: 'space-between' }}>
          <span className="k" style={{ textTransform: 'capitalize' }}>{p.name}</span>
          <span className="v">{formatNumber(p.value as number)}</span>
        </div>
      ))}
    </div>
  );
}

export function ThroughputChart({ data }: { data: ThroughputPoint[] }) {
  const c = useThemeColors();
  return (
    <>
      <div className="legend-inline" style={{ justifyContent: 'flex-end', marginBottom: 8 }}>
        <span className="li"><span className="sw" style={{ background: c.primary }} /> Dispatched</span>
        <span className="li"><span className="sw" style={{ background: c.elevated }} /> Received</span>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} barGap={4} margin={{ top: 6, right: 4, left: -18, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={c.hairline} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fill: c.muted, fontSize: 11 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: c.muted, fontSize: 11 }}
            width={44}
          />
          <Tooltip content={<ChartTip />} cursor={{ fill: c.elevated, opacity: 0.4 }} />
          <Bar dataKey="dispatched" fill={c.primary} radius={[3, 3, 0, 0]} maxBarSize={26} />
          <Bar dataKey="received" fill={c.elevated} radius={[3, 3, 0, 0]} maxBarSize={26} />
        </BarChart>
      </ResponsiveContainer>
    </>
  );
}
