import { COLORS } from '@/lib/colors';

interface SparklineProps {
  points: number[];
  stroke?: string;
  width?: number;
  height?: number;
  fill?: boolean;
}

/** Lightweight inline SVG sparkline (used inside KPI stat cards). */
export function Sparkline({ points, stroke = COLORS.primary, width = 120, height = 34, fill }: SparklineProps) {
  if (!points.length) {
    return <svg className="spark" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" />;
  }
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const step = points.length > 1 ? width / (points.length - 1) : width;
  const coords = points.map((p, i) => {
    const x = i * step;
    const y = height - 3 - ((p - min) / range) * (height - 6);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const linePath = coords.join(' ');
  const areaPath = `${coords[0]} ${linePath} ${(points.length - 1) * step},${height} 0,${height}`;

  return (
    <svg className="spark" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      {fill ? <polygon points={areaPath} fill={stroke} opacity={0.12} /> : null}
      <polyline points={linePath} fill="none" stroke={stroke} strokeWidth={2} />
    </svg>
  );
}
