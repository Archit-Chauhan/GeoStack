import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, Boxes, ArrowLeftRight, TriangleAlert, Plus } from 'lucide-react';
import { useCurrentUser, usePermissions } from '@/app/hooks';
import { useOverview, useStockByCategory, useThroughput } from '@/features/analytics/useAnalytics';
import { useWarehouses } from '@/features/warehouses/useWarehouses';
import { useStores } from '@/features/stores/useStores';
import { useTransfers } from '@/features/transfers/useTransfers';
import { useInventory } from '@/features/inventory/useInventory';
import { StatCard } from '@/components/StatCard';
import { TransferPipeline } from '@/components/TransferPipeline';
import { NetworkMap, storeNode, warehouseNode } from '@/components/NetworkMap';
import { ThroughputChart } from '@/components/charts/ThroughputChart';
import { CategoryDonut } from '@/components/charts/CategoryDonut';
import { CreateTransferModal } from '@/components/transfers/CreateTransferModal';
import { Card, CardHead, Pill, StatCardSkeleton, Skeleton, TableSkeleton, EmptyState, ErrorState, Button } from '@/components/ui';
import { Can } from '@/routes/PermissionGate';
import { eid, refName } from '@/lib/entity';
import { formatCompact, formatCompactCurrency, formatNumber, greeting, formatDate } from '@/lib/format';
import { stockStatus } from '@/lib/status';
import { COLORS } from '@/lib/colors';
import type { Inventory, Product } from '@/types';

function locationLabel(entity: unknown): string {
  if (entity && typeof entity === 'object' && 'name' in entity) {
    return (entity as { name: string }).name;
  }
  return '—';
}

export default function Dashboard() {
  const user = useCurrentUser();
  const { isReadOnly } = usePermissions();
  const [transferOpen, setTransferOpen] = useState(false);

  const overview = useOverview();
  const throughput = useThroughput(7);
  const categories = useStockByCategory();
  const warehouses = useWarehouses({ limit: 100 });
  const stores = useStores({ limit: 100 });
  const transfers = useTransfers({ limit: 5 });
  const inventory = useInventory({ limit: 6 });

  const nodes = useMemo(() => {
    const w = (warehouses.data?.items ?? []).map(warehouseNode);
    const s = (stores.data?.items ?? []).map(storeNode);
    return [...w, ...s];
  }, [warehouses.data, stores.data]);

  const inTransit = (transfers.data?.items ?? []).filter((t) => t.status === 'in_transit').length;
  const kpi = overview.data;

  return (
    <>
      <div className="page-lead reveal">
        <div>
          <h1>
            {greeting()}, {user?.name?.split(' ')[0] ?? 'there'} 👋
          </h1>
          <p>Here's what's moving across your network today, {formatDate(new Date())}.</p>
        </div>
        <Can permission="transfers:create">
          <Button onClick={() => setTransferOpen(true)}>
            <Plus size={16} /> New transfer
          </Button>
        </Can>
      </div>

      {/* KPI ROW */}
      <section className="kpi-row">
        {overview.isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : overview.isError ? (
          <Card style={{ gridColumn: '1 / -1' }}>
            <ErrorState message="Could not load KPIs." onRetry={() => overview.refetch()} />
          </Card>
        ) : (
          <>
            <StatCard
              label="Revenue (MTD)"
              value={formatCompactCurrency(kpi?.revenueMTD ?? 0)}
              icon={<DollarSign size={18} />}
              delta={kpi?.revenueDeltaPct}
              footNote="vs last month"
              spark={[26, 24, 27, 18, 20, 12, 15, 7, 9].reverse()}
              sparkColor={COLORS.up}
              style={{ animationDelay: '.05s' }}
            />
            <StatCard
              label="Inventory value"
              value={formatCompactCurrency(kpi?.inventoryValue ?? 0)}
              icon={<Boxes size={18} />}
              delta={kpi?.inventoryDeltaPct}
              footNote={`${formatNumber(kpi?.totalUnits ?? 0)} units`}
              spark={[20, 22, 18, 19, 15, 17, 13, 14, 10]}
              sparkColor={COLORS.primary}
              style={{ animationDelay: '.1s' }}
            />
            <StatCard
              label="Active transfers"
              value={formatNumber(kpi?.activeTransfers ?? 0)}
              icon={<ArrowLeftRight size={18} />}
              accent={false}
              delta={kpi?.transfersDelta}
              invertDelta
              footNote={`${kpi?.transfersAwaitingApproval ?? 0} awaiting approval`}
              spark={[18, 20, 16, 17, 12, 14, 10, 12, 8]}
              sparkColor={COLORS.primary}
              style={{ animationDelay: '.15s' }}
            />
            <StatCard
              label="Low-stock alerts"
              value={formatNumber(kpi?.lowStockCount ?? 0)}
              icon={<TriangleAlert size={18} />}
              accent={false}
              delta={kpi?.lowStockDelta}
              invertDelta
              footNote={`${kpi?.criticalCount ?? 0} critical`}
              spark={[10, 12, 9, 14, 11, 16, 14, 19, 17]}
              sparkColor={COLORS.down}
              style={{ animationDelay: '.2s' }}
            />
          </>
        )}
      </section>

      {/* MAP + TRANSFERS */}
      <section className="grid-2">
        <Card className="map-card reveal" style={{ animationDelay: '.2s' }}>
          <div className="map-toolbar">
            <div>
              <div className="card__title">Live network map</div>
              <div className="card__sub">
                {nodes.length} nodes · {inTransit} transfer{inTransit === 1 ? '' : 's'} in transit
              </div>
            </div>
            <div className="grow" />
            <Link className="link" to="/map" style={{ fontSize: 13 }}>
              Open full map →
            </Link>
          </div>
          {warehouses.isLoading || stores.isLoading ? (
            <Skeleton style={{ height: 380, borderRadius: 0 }} />
          ) : nodes.length === 0 ? (
            <div style={{ height: 380 }}>
              <EmptyState title="No locations yet" message="Add a warehouse or store to see it on the map." />
            </div>
          ) : (
            <NetworkMap nodes={nodes} height={380} />
          )}
          <div className="map-legend">
            <span className="li"><span className="sw" style={{ background: 'var(--primary)' }} /> Warehouse</span>
            <span className="li"><span className="sw" style={{ background: 'var(--up)' }} /> Distribution hub</span>
            <span className="li"><span className="sw" style={{ background: '#eaecef' }} /> Store</span>
            <span className="li"><span className="sw" style={{ background: 'var(--info)' }} /> Cold storage</span>
            <span className="li mute" style={{ marginLeft: 'auto' }}>Tip: click a node for detail</span>
          </div>
        </Card>

        {/* Transfer pipeline */}
        <Card className="reveal" style={{ animationDelay: '.25s' }}>
          <CardHead
            title="Transfer pipeline"
            action={<Link className="link" to="/transfers" style={{ fontSize: 13 }}>View all</Link>}
          />
          {transfers.isLoading ? (
            <>
              <Skeleton className="sk-line" style={{ width: '60%' }} />
              <Skeleton style={{ height: 30, marginBottom: 20 }} />
              <Skeleton className="sk-line" style={{ width: '60%' }} />
              <Skeleton style={{ height: 30 }} />
            </>
          ) : transfers.isError ? (
            <ErrorState onRetry={() => transfers.refetch()} />
          ) : (transfers.data?.items ?? []).length === 0 ? (
            <EmptyState title="No transfers yet" message="Stock movements will appear here." />
          ) : (
            (transfers.data?.items ?? []).slice(0, 4).map((t) => (
              <div className="transfer-item" key={eid(t)}>
                <div className="th">
                  <span className="id">{t.code}</span>
                  <span className="rt">
                    {locationLabel(t.from)} → {locationLabel(t.to)}
                  </span>
                </div>
                <TransferPipeline status={t.status} />
              </div>
            ))
          )}
        </Card>
      </section>

      {/* ANALYTICS */}
      <section className="grid-2">
        <Card className="reveal">
          <CardHead title="Warehouse throughput" sub="Units dispatched vs received · last 7 days" />
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
          <CardHead
            title="Stock by category"
            action={<span className="card__sub">{formatCompact(kpi?.totalUnits)} units</span>}
          />
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

      {/* INVENTORY TABLE */}
      <section className="card table-card reveal">
        <div className="table-head">
          <div className="card__title">Inventory</div>
          <Link className="link" to="/inventory" style={{ fontSize: 13 }}>
            Manage inventory →
          </Link>
        </div>
        <div className="tbl-scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Location</th>
                <th className="r">Available</th>
                <th className="r">Reserved</th>
                <th className="r">Incoming</th>
                <th className="r">Status</th>
              </tr>
            </thead>
            {inventory.isLoading ? (
              <TableSkeleton rows={6} cols={7} />
            ) : (
              <tbody>
                {(inventory.data?.items ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <EmptyState title="No inventory" message="Adjust stock to populate this table." />
                    </td>
                  </tr>
                ) : (
                  (inventory.data?.items ?? []).map((row) => <InventoryRow key={eid(row)} row={row} />)
                )}
              </tbody>
            )}
          </table>
        </div>
      </section>

      {!isReadOnly && (
        <CreateTransferModal open={transferOpen} onClose={() => setTransferOpen(false)} />
      )}
    </>
  );
}

function InventoryRow({ row }: { row: Inventory }) {
  const product = (typeof row.product === 'object' ? row.product : null) as Product | null;
  const minStock = product?.minStock ?? 0;
  const { tone, label } = stockStatus(row.available, minStock);
  const loc = row.locationType === 'warehouse' ? row.warehouse : row.store;
  const iconText = (product?.name ?? '??').slice(0, 2).toUpperCase();

  return (
    <tr>
      <td>
        <div className="prod">
          <span className="ic">{iconText}</span>
          <div className="meta">
            <div className="nm">{product?.name ?? 'Unknown product'}</div>
            <div className="sku">{product?.sku ?? '—'}</div>
          </div>
        </div>
      </td>
      <td className="mute">{product?.category ?? '—'}</td>
      <td>{refName(loc)}</td>
      <td className="r qty">{formatNumber(row.available)}</td>
      <td className="r qty">{formatNumber(row.reserved)}</td>
      <td className={`r qty ${row.incoming > 0 ? 'up' : 'mute'}`}>
        {row.incoming > 0 ? `+${formatNumber(row.incoming)}` : '0'}
      </td>
      <td className="r">
        <Pill tone={tone} dot>
          {label}
        </Pill>
      </td>
    </tr>
  );
}
