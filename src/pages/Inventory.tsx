import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { SlidersHorizontal } from 'lucide-react';
import { useInventory, useAdjustInventory, type AdjustBody } from '@/features/inventory/useInventory';
import { useWarehouses } from '@/features/warehouses/useWarehouses';
import { useStores } from '@/features/stores/useStores';
import { usePermissions } from '@/app/hooks';
import { Can } from '@/routes/PermissionGate';
import {
  Button,
  Field,
  Input,
  Modal,
  Pill,
  Select,
  TableSkeleton,
  EmptyState,
  ErrorState,
} from '@/components/ui';
import { apiMessage } from '@/lib/api';
import { eid, refName } from '@/lib/entity';
import { formatNumber } from '@/lib/format';
import { stockStatus } from '@/lib/status';
import type { Inventory, Product } from '@/types';

type LocFilter = { kind: 'all' } | { kind: 'warehouse' | 'store'; id: string };

export default function InventoryPage() {
  const { can } = usePermissions();
  const canAdjust = can('inventory:adjust');

  const warehouses = useWarehouses({ limit: 100 });
  const stores = useStores({ limit: 100 });

  const [locFilter, setLocFilter] = useState<LocFilter>({ kind: 'all' });
  const [lowStock, setLowStock] = useState(false);
  const [q, setQ] = useState('');

  const params = useMemo(() => {
    const p: Record<string, unknown> = { limit: 100 };
    if (locFilter.kind === 'warehouse') p.warehouse = locFilter.id;
    if (locFilter.kind === 'store') p.store = locFilter.id;
    if (lowStock) p.lowStock = true;
    if (q) p.q = q;
    return p;
  }, [locFilter, lowStock, q]);

  const { data, isLoading, isError, refetch } = useInventory(params);
  const items = data?.items ?? [];

  const [adjustRow, setAdjustRow] = useState<Inventory | null>(null);

  const onLocChange = (val: string) => {
    if (val === 'all') return setLocFilter({ kind: 'all' });
    const [kind, id] = val.split(':');
    setLocFilter({ kind: kind as 'warehouse' | 'store', id });
  };

  const locValue =
    locFilter.kind === 'all' ? 'all' : `${locFilter.kind}:${locFilter.id}`;

  return (
    <>
      <div className="page-lead reveal">
        <div>
          <h1>Inventory</h1>
          <p>Track stock across every warehouse and store.</p>
        </div>
      </div>

      <section className="card table-card reveal">
        <div className="table-head">
          <div className="filters">
            <span className="mute" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <SlidersHorizontal size={14} /> Filters
            </span>
            <Select value={locValue} onChange={(e) => onLocChange(e.target.value)} aria-label="location filter">
              <option value="all">All locations</option>
              <optgroup label="Warehouses">
                {(warehouses.data?.items ?? []).map((w) => (
                  <option key={eid(w)} value={`warehouse:${eid(w)}`}>
                    {w.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Stores">
                {(stores.data?.items ?? []).map((s) => (
                  <option key={eid(s)} value={`store:${eid(s)}`}>
                    {s.name}
                  </option>
                ))}
              </optgroup>
            </Select>
            <Input placeholder="Search SKU / product…" value={q} onChange={(e) => setQ(e.target.value)} style={{ height: 38 }} />
            <label className="toggle">
              <input type="checkbox" checked={lowStock} onChange={(e) => setLowStock(e.target.checked)} />
              Low stock only
            </label>
          </div>
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
                <th className="r">Damaged</th>
                <th className="r">Status</th>
                {canAdjust ? <th className="r">Action</th> : null}
              </tr>
            </thead>
            {isLoading ? (
              <TableSkeleton rows={8} cols={canAdjust ? 9 : 8} />
            ) : (
              <tbody>
                {isError ? (
                  <tr>
                    <td colSpan={canAdjust ? 9 : 8}>
                      <ErrorState onRetry={() => refetch()} />
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={canAdjust ? 9 : 8}>
                      <EmptyState title="No inventory matches" message="Try clearing filters or adjusting stock." />
                    </td>
                  </tr>
                ) : (
                  items.map((row) => {
                    const product = (typeof row.product === 'object' ? row.product : null) as Product | null;
                    const { tone, label } = stockStatus(row.available, product?.minStock ?? 0);
                    const loc = row.locationType === 'warehouse' ? row.warehouse : row.store;
                    return (
                      <tr key={eid(row)}>
                        <td>
                          <div className="prod">
                            <span className="ic">{(product?.name ?? '??').slice(0, 2).toUpperCase()}</span>
                            <div className="meta">
                              <div className="nm">{product?.name ?? 'Unknown'}</div>
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
                        <td className={`r qty ${row.damaged > 0 ? 'down' : 'mute'}`}>{formatNumber(row.damaged)}</td>
                        <td className="r">
                          <Pill tone={tone} dot>
                            {label}
                          </Pill>
                        </td>
                        {canAdjust ? (
                          <td className="r">
                            <Button size="sm" variant="secondary" onClick={() => setAdjustRow(row)}>
                              Adjust
                            </Button>
                          </td>
                        ) : null}
                      </tr>
                    );
                  })
                )}
              </tbody>
            )}
          </table>
        </div>
      </section>

      <Can permission="inventory:adjust">
        <AdjustModal row={adjustRow} onClose={() => setAdjustRow(null)} />
      </Can>
    </>
  );
}

function AdjustModal({ row, onClose }: { row: Inventory | null; onClose: () => void }) {
  const adjust = useAdjustInventory();
  const [field, setField] = useState<AdjustBody['field']>('available');
  const [delta, setDelta] = useState(0);
  const [note, setNote] = useState('');

  const product = row && typeof row.product === 'object' ? (row.product as Product) : null;

  const submit = async () => {
    if (!row) return;
    if (!delta) return toast.error('Enter a non-zero delta');
    const locId = eid(row.locationType === 'warehouse' ? row.warehouse : row.store);
    const body: AdjustBody = {
      product: eid(row.product),
      locationType: row.locationType,
      [row.locationType]: locId,
      field,
      delta,
      note: note || undefined,
    } as AdjustBody;
    try {
      await adjust.mutateAsync(body);
      toast.success('Stock adjusted');
      setDelta(0);
      setNote('');
      onClose();
    } catch (err) {
      toast.error(apiMessage(err, 'Could not adjust stock'));
    }
  };

  return (
    <Modal
      open={!!row}
      onClose={onClose}
      title={`Adjust stock · ${product?.name ?? ''}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} loading={adjust.isPending}>
            Apply adjustment
          </Button>
        </>
      }
    >
      {row ? (
        <>
          <div className="card__sub" style={{ marginBottom: 16 }}>
            {product?.sku} · currently {formatNumber(row.available)} available
          </div>
          <Field label="Field">
            <Select value={field} onChange={(e) => setField(e.target.value as AdjustBody['field'])}>
              <option value="available">Available</option>
              <option value="reserved">Reserved</option>
              <option value="incoming">Incoming</option>
              <option value="outgoing">Outgoing</option>
              <option value="damaged">Damaged</option>
            </Select>
          </Field>
          <Field label="Delta (use a negative number to decrease)">
            <Input type="number" value={delta} onChange={(e) => setDelta(Number(e.target.value))} />
          </Field>
          <Field label="Note (optional)">
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reason for adjustment" />
          </Field>
        </>
      ) : null}
    </Modal>
  );
}
