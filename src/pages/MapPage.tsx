import { useMemo, useState } from 'react';
import { MapPin, ArrowRight } from 'lucide-react';
import { useWarehouses, useWarehouseSummary } from '@/features/warehouses/useWarehouses';
import { useStores, useStoreSummary } from '@/features/stores/useStores';
import { usePermissions } from '@/app/hooks';
import { NetworkMap, storeNode, warehouseNode, type MapNode } from '@/components/NetworkMap';
import { CreateTransferModal } from '@/components/transfers/CreateTransferModal';
import { Card, Button, Select, Skeleton, EmptyState, Pill } from '@/components/ui';
import { Can } from '@/routes/PermissionGate';
import { formatCurrency, formatNumber } from '@/lib/format';
import type { LocationType } from '@/types';

export default function MapPage() {
  const { isReadOnly } = usePermissions();
  const warehouses = useWarehouses({ limit: 200 });
  const stores = useStores({ limit: 200 });

  const [selected, setSelected] = useState<MapNode | null>(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [transferOpen, setTransferOpen] = useState(false);

  const nodes = useMemo(() => {
    const w = (warehouses.data?.items ?? []).map(warehouseNode);
    const s = (stores.data?.items ?? []).map(storeNode);
    return [...w, ...s];
  }, [warehouses.data, stores.data]);

  const nodeById = (id: string) => nodes.find((n) => n.id === id);
  const route = { from: from ? nodeById(from) : undefined, to: to ? nodeById(to) : undefined };

  const loading = warehouses.isLoading || stores.isLoading;

  const transferDefaults = useMemo(() => {
    const f = from ? nodeById(from) : undefined;
    const t = to ? nodeById(to) : undefined;
    return {
      defaultFrom: f ? { type: f.kind === 'store' ? ('store' as LocationType) : ('warehouse' as LocationType), id: f.id } : undefined,
      defaultTo: t ? { type: t.kind === 'store' ? ('store' as LocationType) : ('warehouse' as LocationType), id: t.id } : undefined,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, nodes]);

  return (
    <>
      <div className="page-lead reveal">
        <div>
          <h1>Network map</h1>
          <p>Every warehouse, hub and store on one live command view.</p>
        </div>
      </div>

      <section className="grid-2">
        <Card className="map-card reveal" style={{ padding: 0 }}>
          <div className="map-toolbar">
            <div className="route-select">
              <span className="swatch" style={{ background: 'var(--primary)' }} />
              <Select value={from} onChange={(e) => setFrom(e.target.value)} aria-label="source">
                <option value="">Source…</option>
                {nodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.name}
                  </option>
                ))}
              </Select>
            </div>
            <span className="mute">
              <ArrowRight size={16} />
            </span>
            <div className="route-select">
              <span className="swatch" style={{ background: '#eaecef' }} />
              <Select value={to} onChange={(e) => setTo(e.target.value)} aria-label="destination">
                <option value="">Destination…</option>
                {nodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grow" />
            <Can permission="transfers:create">
              <Button size="sm" onClick={() => setTransferOpen(true)} disabled={!from || !to || from === to}>
                Start transfer
              </Button>
            </Can>
          </div>

          {loading ? (
            <Skeleton style={{ height: 520, borderRadius: 0 }} />
          ) : nodes.length === 0 ? (
            <div style={{ height: 520 }}>
              <EmptyState title="No locations to map" message="Create warehouses and stores to plot them here." />
            </div>
          ) : (
            <NetworkMap
              nodes={nodes}
              height={520}
              route={route}
              onSelect={setSelected}
              selectedId={selected?.id}
            />
          )}

          <div className="map-legend">
            <span className="li"><span className="sw" style={{ background: 'var(--primary)' }} /> Warehouse</span>
            <span className="li"><span className="sw" style={{ background: 'var(--up)' }} /> Distribution hub</span>
            <span className="li"><span className="sw" style={{ background: 'var(--info)' }} /> Cold storage</span>
            <span className="li"><span className="sw" style={{ background: '#eaecef' }} /> Store</span>
          </div>
        </Card>

        {/* Detail side panel */}
        <div className="reveal">
          {selected ? (
            <NodePanel node={selected} />
          ) : (
            <Card>
              <EmptyState
                icon={<MapPin size={22} />}
                title="Select a location"
                message="Click a marker on the map to see its manager, capacity, on-hand stock and alerts."
              />
            </Card>
          )}
        </div>
      </section>

      {!isReadOnly && (
        <CreateTransferModal
          open={transferOpen}
          onClose={() => setTransferOpen(false)}
          {...transferDefaults}
        />
      )}
    </>
  );
}

function NodePanel({ node }: { node: MapNode }) {
  const isStore = node.kind === 'store';
  const whSummary = useWarehouseSummary(!isStore ? node.id : undefined);
  const stSummary = useStoreSummary(isStore ? node.id : undefined);
  const summary = isStore ? stSummary : whSummary;
  const metrics = isStore ? stSummary.data?.metrics : whSummary.data?.metrics;

  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <span className={`geo-marker ${node.kind}`} style={{ boxShadow: 'none' }} />
        <h3 style={{ fontSize: 18, fontWeight: 600 }}>{node.name}</h3>
      </div>
      <div className="card__sub" style={{ marginBottom: 16 }}>
        {node.typeLabel} · Manager {node.manager || '—'}
      </div>

      {summary.isLoading ? (
        <>
          <Skeleton className="sk-line" style={{ width: '90%' }} />
          <Skeleton className="sk-line" style={{ width: '75%' }} />
          <Skeleton className="sk-line" style={{ width: '80%' }} />
        </>
      ) : (
        <div className="kv-list">
          {!isStore && whSummary.data ? (
            <div className="row">
              <span className="k">Utilization</span>
              <span className="v num">
                {metrics?.utilization ?? 0}% · {whSummary.data.warehouse.capacityPallets} pallets
              </span>
            </div>
          ) : null}
          <div className="row">
            <span className="k">Products</span>
            <span className="v num">{formatNumber(metrics?.products ?? 0)}</span>
          </div>
          <div className="row">
            <span className="k">On hand</span>
            <span className="v num">{formatNumber(metrics?.onHand ?? 0)} units</span>
          </div>
          <div className="row">
            <span className="k">Stock value</span>
            <span className="v num">{formatCurrency(metrics?.stockValue ?? 0)}</span>
          </div>
          <div className="row">
            <span className="k">Low-stock items</span>
            <span className="v">
              {(metrics?.lowStock ?? 0) > 0 ? (
                <Pill tone="low" dot>
                  {metrics?.lowStock}
                </Pill>
              ) : (
                <Pill tone="in-stock" dot>
                  None
                </Pill>
              )}
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}
