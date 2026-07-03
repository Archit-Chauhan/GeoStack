import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, type TooltipProps } from 'recharts';
import type { CategorySlice } from '@/types';
import { formatNumber } from '@/lib/format';
import { CATEGORY_PALETTE, useThemeColors } from '@/lib/colors';

function Tip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const row = payload[0];
  return (
    <div className="chart-tip">
      <span className="k">{row.name}: </span>
      <span className="v">{formatNumber(row.value as number)} units</span>
    </div>
  );
}

export function CategoryDonut({ data }: { data: CategorySlice[] }) {
  const c = useThemeColors();
  const total = data.reduce((sum, d) => sum + d.units, 0);
  const withPct = data.map((d) => ({ ...d, pct: total ? Math.round((d.units / total) * 100) : 0 }));

  return (
    <div className="donut-wrap">
      <div style={{ width: 150, height: 150, position: 'relative', flex: 'none' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={withPct}
              dataKey="units"
              nameKey="category"
              innerRadius={48}
              outerRadius={70}
              paddingAngle={2}
              stroke="none"
            >
              {withPct.map((_, i) => (
                <Cell key={i} fill={CATEGORY_PALETTE[i % CATEGORY_PALETTE.length]} />
              ))}
            </Pie>
            <Tooltip content={<Tip />} />
          </PieChart>
        </ResponsiveContainer>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            placeItems: 'center',
            pointerEvents: 'none',
            textAlign: 'center',
          }}
        >
          <div>
            <div className="num" style={{ fontWeight: 700, fontSize: 20, color: c.text }}>{data.length}</div>
            <div style={{ fontSize: 10, color: c.muted }}>categories</div>
          </div>
        </div>
      </div>
      <div className="donut-legend">
        {withPct.map((d, i) => (
          <div className="li" key={d.category}>
            <span className="sw" style={{ background: CATEGORY_PALETTE[i % CATEGORY_PALETTE.length] }} />
            {d.category}
            <span className="val">{d.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
