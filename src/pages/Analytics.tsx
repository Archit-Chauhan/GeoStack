import { useState } from 'react';
import { TrendingUp, Package, DollarSign, TriangleAlert } from 'lucide-react';
import {
  useOverview,
  useThroughput,
  useStockByCategory,
  useFastMoving,
  useAnalyticsLowStock,
} from '@/features/analytics/useAnalytics';
import { StatCard } from '@/components/StatCard';
import { ThroughputChart } from '@/components/charts/ThroughputChart';
import { CategoryDonut } from '@/components/charts/CategoryDonut';
import { Card, CardHead, Pill, Skeleton, StatCardSkeleton, EmptyState, ErrorState, Select } from '@/components/ui';
import { eid, refName } from '@/lib/entity';
import { formatCompactCurrency, formatNumber } from '@/lib/format';
import { stockStatus } from '@/lib/status';
import type { FastMovingRow, Inventory, Product } from '@/types';

export default function Analytics() {
  const [days, setDays] = useState(7);
  const overview = useOverview();
  const throughput = useThroughput(days);
  const categories = useStockByCategory();
  const fastMoving = useFastMoving();
  const lowStock = useAnalyticsLowStock();
  const kpi = overview.data;

  return (
    <>
      <div className="page-lead reveal">
        <div>
          <h1>Analytics</h1>
          <p>Throughput, category mix and fast movers across your network.</p>
        </div>
      </div>

      <section className="kpi-row">
        {overview.isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard label="Revenue (MTD)" value={formatCompactCurrency(kpi?.revenueMTD ?? 0)} icon={<DollarSign size={18} />} delta={kpi?.revenueDeltaPct} footNote="vs last month" />
            <StatCard label="Inventory value" value={formatCompactCurrency(kpi?.inventoryValue ?? 0)} icon={<Package size={18} />} delta={kpi?.inventoryDeltaPct} footNote={`${formatNumber(kpi?.totalUnits ?? 0)} units`} />
            <StatCard label="Active transfers" value={formatNumber(kpi?.activeTransfers ?? 0)} icon={<TrendingUp size={18} />} accent={false} footNote={`${kpi?.transfersAwaitingApproval ?? 0} awaiting`} />
            <StatCard label="Low-stock alerts" value={formatNumber(kpi?.lowStockCount ?? 0)} icon={<TriangleAlert size={18} />} accent={false} footNote={`${kpi?.criticalCount ?? 0} critical`} />
          </>
        )}
      </section>

      <section className="grid-2">
        <Card className="reveal">
          <CardHead
            title="Warehouse throughput"
            sub="Units dispatched vs received"
            action={
              <Select value={days} onChange={(e) => setDays(Number(e.target.value))} style={{ height: 34, width: 'auto' }}>
                <option value={7}>Last 7 days</option>
                <option value={14}>Last 14 days</option>
                <option value={30}>Last 30 days</option>
              </Select>
            }
          />
          {throughput.isLoading ? (
            <Skeleton style={{ height: 200 }} />
          ) : throughput.isError ? (
            <ErrorState onRetry={() => throughput.refetch()} />
          ) : (throughput.data ?? []).length === 0 ? (
            <EmptyState title="No throughput data" />
          ) : (
            <ThroughputChart data={throughput.data ?? []} />
          )}
        </Card>

        <Card className="reveal">
          <CardHead title="Stock by category" />
          {categories.isLoading ? (
            <Skeleton style={{ height: 150, width: 150, borderRadius: '50%' }} />
          ) : categories.isError ? (
            <ErrorState onRetry={() => categories.refetch()} />
          ) : (categories.data ?? []).length === 0 ? (
            <EmptyState title="No category data" />
          ) : (
            <CategoryDonut data={categories.data ?? []} />
          )}
        </Card>
      </section>

      <section className="grid-2">
        {/* Fast moving */}
        <Card className="table-card reveal" style={{ padding: 0 }}>
          <div className="table-head">
            <div className="card__title">Fast-moving products</div>
          </div>
          <div className="tbl-scroll">
            <table className="tbl" style={{ minWidth: 380 }}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th className="r">Units moved</th>
                </tr>
              </thead>
              {fastMoving.isLoading ? (
                <tbody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={3}><Skeleton className="sk-line" style={{ marginBottom: 0 }} /></td>
                    </tr>
                  ))}
                </tbody>
              ) : (
                <tbody>
                  {(fastMoving.data ?? []).length === 0 ? (
                    <tr><td colSpan={3}><EmptyState title="No movement data yet" /></td></tr>
                  ) : (
                    (fastMoving.data ?? []).map((row: FastMovingRow, i) => {
                      const p = typeof row.product === 'object' ? (row.product as Product) : null;
                      return (
                        <tr key={i}>
                          <td>{row.productName ?? p?.name ?? 'Product'}</td>
                          <td className="sku num">{row.sku ?? p?.sku ?? '—'}</td>
                          <td className="r qty up">{formatNumber(row.unitsMoved)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              )}
            </table>
          </div>
        </Card>

        {/* Low stock */}
        <Card className="table-card reveal" style={{ padding: 0 }}>
          <div className="table-head">
            <div className="card__title">Low-stock watchlist</div>
          </div>
          <div className="tbl-scroll">
            <table className="tbl" style={{ minWidth: 420 }}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Location</th>
                  <th className="r">Available</th>
                  <th className="r">Status</th>
                </tr>
              </thead>
              {lowStock.isLoading ? (
                <tbody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={4}><Skeleton className="sk-line" style={{ marginBottom: 0 }} /></td>
                    </tr>
                  ))}
                </tbody>
              ) : (
                <tbody>
                  {(lowStock.data ?? []).length === 0 ? (
                    <tr><td colSpan={4}><EmptyState title="Nothing low on stock" message="All inventory is above threshold." /></td></tr>
                  ) : (
                    (lowStock.data ?? []).map((row: Inventory) => {
                      const p = typeof row.product === 'object' ? (row.product as Product) : null;
                      const { tone, label } = stockStatus(row.available, p?.minStock ?? 0);
                      const loc = row.locationType === 'warehouse' ? row.warehouse : row.store;
                      return (
                        <tr key={eid(row)}>
                          <td>{p?.name ?? 'Product'}</td>
                          <td className="mute">{refName(loc)}</td>
                          <td className="r qty">{formatNumber(row.available)}</td>
                          <td className="r"><Pill tone={tone} dot>{label}</Pill></td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              )}
            </table>
          </div>
        </Card>
      </section>
    </>
  );
}
