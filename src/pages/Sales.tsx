import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2, RotateCcw } from 'lucide-react';
import { useSales, useCreateSale, useRefundSale, type CreateSaleBody } from '@/features/sales/useSales';
import { useStores } from '@/features/stores/useStores';
import { useProducts } from '@/features/products/useProducts';
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
import { formatCurrency, formatDateTime, formatNumber } from '@/lib/format';
import type { Product, Sale } from '@/types';

export default function Sales() {
  const { can } = usePermissions();
  const { data, isLoading, isError, refetch } = useSales({ limit: 50 });
  const refund = useRefundSale();
  const [open, setOpen] = useState(false);

  const items = data?.items ?? [];
  const canRefund = can('sales:refund');

  const onRefund = async (s: Sale) => {
    if (!confirm(`Refund sale ${s.code ?? eid(s)}? Stock will be returned.`)) return;
    try {
      await refund.mutateAsync(eid(s));
      toast.success('Sale refunded');
    } catch (err) {
      toast.error(apiMessage(err, 'Could not refund'));
    }
  };

  return (
    <>
      <div className="page-lead reveal">
        <div>
          <h1>Sales</h1>
          <p>Point-of-sale transactions across your stores.</p>
        </div>
        <Can permission="sales:create">
          <Button onClick={() => setOpen(true)}>
            <Plus size={16} /> New sale
          </Button>
        </Can>
      </div>

      <section className="card table-card reveal">
        <div className="table-head">
          <div className="card__title">Recent sales</div>
        </div>
        <div className="tbl-scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th>Sale</th>
                <th>Store</th>
                <th>Customer</th>
                <th className="r">Items</th>
                <th className="r">Subtotal</th>
                <th className="r">Tax</th>
                <th className="r">Total</th>
                <th>Status</th>
                {canRefund ? <th className="r">Action</th> : null}
              </tr>
            </thead>
            {isLoading ? (
              <TableSkeleton rows={6} cols={canRefund ? 9 : 8} />
            ) : (
              <tbody>
                {isError ? (
                  <tr>
                    <td colSpan={canRefund ? 9 : 8}>
                      <ErrorState onRetry={() => refetch()} />
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={canRefund ? 9 : 8}>
                      <EmptyState title="No sales yet" message="Record a sale to see it here." />
                    </td>
                  </tr>
                ) : (
                  items.map((s) => {
                    const count = s.items?.reduce((sum, it) => sum + it.quantity, 0) ?? 0;
                    const tone = s.status === 'completed' ? 'in-stock' : s.status === 'returned' ? 'low' : 'critical';
                    return (
                      <tr key={eid(s)}>
                        <td>
                          <div className="meta">
                            <div className="nm num" style={{ fontSize: 13 }}>{(s as { code?: string }).code ?? eid(s).slice(-6)}</div>
                            <div className="sku">{formatDateTime(s.createdAt)}</div>
                          </div>
                        </td>
                        <td>{refName(s.store)}</td>
                        <td className="mute">{s.customer?.name || 'Walk-in'}</td>
                        <td className="r qty">{formatNumber(count)}</td>
                        <td className="r qty">{formatCurrency(s.subtotal)}</td>
                        <td className="r qty">{formatCurrency(s.tax)}</td>
                        <td className="r qty" style={{ fontWeight: 600 }}>{formatCurrency(s.total)}</td>
                        <td>
                          <Pill tone={tone} dot>
                            {s.status}
                          </Pill>
                        </td>
                        {canRefund ? (
                          <td className="r">
                            {s.status === 'completed' ? (
                              <button className="icon-btn" onClick={() => onRefund(s)} aria-label="refund" title="Refund">
                                <RotateCcw size={15} />
                              </button>
                            ) : (
                              <span className="mute">—</span>
                            )}
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

      <Can permission="sales:create">
        <NewSaleModal open={open} onClose={() => setOpen(false)} />
      </Can>
    </>
  );
}

interface Line {
  product: string;
  quantity: number;
}

function NewSaleModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const stores = useStores({ limit: 100 });
  const products = useProducts({ limit: 200 });
  const create = useCreateSale();

  const [store, setStore] = useState('');
  const [lines, setLines] = useState<Line[]>([{ product: '', quantity: 1 }]);
  const [tax, setTax] = useState(0);
  const [customer, setCustomer] = useState('');

  const productMap = useMemo(() => {
    const m = new Map<string, Product>();
    (products.data?.items ?? []).forEach((p) => m.set(eid(p), p));
    return m;
  }, [products.data]);

  const subtotal = lines.reduce((sum, l) => {
    const p = productMap.get(l.product);
    return sum + (p ? p.price * l.quantity : 0);
  }, 0);
  const total = subtotal + Number(tax || 0);

  const setLine = (i: number, patch: Partial<Line>) =>
    setLines((arr) => arr.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  const submit = async () => {
    const clean = lines.filter((l) => l.product && l.quantity > 0);
    if (!store) return toast.error('Choose a store');
    if (clean.length === 0) return toast.error('Add at least one product');
    const body: CreateSaleBody = {
      store,
      items: clean,
      tax: Number(tax) || 0,
      customer: customer ? { name: customer } : undefined,
    };
    try {
      await create.mutateAsync(body);
      toast.success('Sale recorded');
      setLines([{ product: '', quantity: 1 }]);
      setTax(0);
      setCustomer('');
      onClose();
    } catch (err) {
      toast.error(apiMessage(err, 'Could not record sale'));
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New sale"
      wide
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} loading={create.isPending}>
            Record sale · {formatCurrency(total)}
          </Button>
        </>
      }
    >
      <div className="form-grid">
        <Field label="Store">
          <Select value={store} onChange={(e) => setStore(e.target.value)}>
            <option value="">Select store…</option>
            {(stores.data?.items ?? []).map((s) => (
              <option key={eid(s)} value={eid(s)}>
                {s.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Customer (optional)">
          <Input value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="Walk-in" />
        </Field>
      </div>

      <div style={{ margin: '4px 0 8px', fontWeight: 600, fontSize: 13 }}>Items</div>
      {lines.map((l, i) => {
        const p = productMap.get(l.product);
        return (
          <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'center' }}>
            <Select value={l.product} onChange={(e) => setLine(i, { product: e.target.value })} style={{ flex: 1 }}>
              <option value="">Select product…</option>
              {(products.data?.items ?? []).map((prod) => (
                <option key={eid(prod)} value={eid(prod)}>
                  {prod.name} · {formatCurrency(prod.price)}
                </option>
              ))}
            </Select>
            <input
              className="input"
              type="number"
              min={1}
              style={{ width: 84 }}
              value={l.quantity}
              onChange={(e) => setLine(i, { quantity: Number(e.target.value) })}
            />
            <span className="qty" style={{ width: 84, textAlign: 'right' }}>
              {p ? formatCurrency(p.price * l.quantity) : '—'}
            </span>
            <button
              className="icon-btn"
              onClick={() => setLines((arr) => arr.filter((_, idx) => idx !== i))}
              disabled={lines.length === 1}
              aria-label="remove"
            >
              <Trash2 size={16} />
            </button>
          </div>
        );
      })}
      <Button variant="secondary" size="sm" onClick={() => setLines((arr) => [...arr, { product: '', quantity: 1 }])}>
        <Plus size={14} /> Add item
      </Button>

      <div className="form-grid" style={{ marginTop: 16 }}>
        <Field label="Tax">
          <Input type="number" value={tax} onChange={(e) => setTax(Number(e.target.value))} />
        </Field>
        <div className="field" style={{ alignSelf: 'end' }}>
          <div className="kv-list">
            <div className="row">
              <span className="k">Subtotal</span>
              <span className="v num">{formatCurrency(subtotal)}</span>
            </div>
            <div className="row">
              <span className="k">Total</span>
              <span className="v num" style={{ fontWeight: 700 }}>{formatCurrency(total)}</span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
