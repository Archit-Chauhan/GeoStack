import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2 } from 'lucide-react';
import { Button, Field, Modal, Select, Textarea } from '@/components/ui';
import { useWarehouses } from '@/features/warehouses/useWarehouses';
import { useStores } from '@/features/stores/useStores';
import { useProducts } from '@/features/products/useProducts';
import { useCreateTransfer } from '@/features/transfers/useTransfers';
import { apiMessage } from '@/lib/api';
import { eid } from '@/lib/entity';
import type { LocationType } from '@/types';

interface LineItem {
  product: string;
  quantity: number;
}

export function CreateTransferModal({
  open,
  onClose,
  defaultFrom,
  defaultTo,
}: {
  open: boolean;
  onClose: () => void;
  defaultFrom?: { type: LocationType; id: string };
  defaultTo?: { type: LocationType; id: string };
}) {
  const { data: warehouses } = useWarehouses({ limit: 100 });
  const { data: stores } = useStores({ limit: 100 });
  const { data: products } = useProducts({ limit: 200 });
  const create = useCreateTransfer();

  const [fromType, setFromType] = useState<LocationType>(defaultFrom?.type ?? 'warehouse');
  const [from, setFrom] = useState(defaultFrom?.id ?? '');
  const [toType, setToType] = useState<LocationType>(defaultTo?.type ?? 'store');
  const [to, setTo] = useState(defaultTo?.id ?? '');
  const [items, setItems] = useState<LineItem[]>([{ product: '', quantity: 1 }]);
  const [notes, setNotes] = useState('');

  const locations = useMemo(
    () => ({
      warehouse: warehouses?.items ?? [],
      store: stores?.items ?? [],
    }),
    [warehouses, stores]
  );

  const reset = () => {
    setItems([{ product: '', quantity: 1 }]);
    setNotes('');
  };

  const submit = async () => {
    const cleanItems = items.filter((i) => i.product && i.quantity > 0);
    if (!from || !to) return toast.error('Choose a source and destination');
    if (from === to) return toast.error('Source and destination must differ');
    if (cleanItems.length === 0) return toast.error('Add at least one product');
    try {
      await create.mutateAsync({ fromType, from, toType, to, items: cleanItems, notes });
      toast.success('Transfer created');
      reset();
      onClose();
    } catch (err) {
      toast.error(apiMessage(err, 'Could not create transfer'));
    }
  };

  const setItem = (idx: number, patch: Partial<LineItem>) =>
    setItems((arr) => arr.map((it, i) => (i === idx ? { ...it, ...patch } : it)));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New transfer"
      wide
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} loading={create.isPending}>
            Create transfer
          </Button>
        </>
      }
    >
      <div className="form-grid">
        <Field label="From type">
          <Select value={fromType} onChange={(e) => { setFromType(e.target.value as LocationType); setFrom(''); }}>
            <option value="warehouse">Warehouse</option>
            <option value="store">Store</option>
          </Select>
        </Field>
        <Field label="Source">
          <Select value={from} onChange={(e) => setFrom(e.target.value)}>
            <option value="">Select…</option>
            {locations[fromType].map((l) => (
              <option key={eid(l)} value={eid(l)}>
                {l.name} ({l.code})
              </option>
            ))}
          </Select>
        </Field>
        <Field label="To type">
          <Select value={toType} onChange={(e) => { setToType(e.target.value as LocationType); setTo(''); }}>
            <option value="warehouse">Warehouse</option>
            <option value="store">Store</option>
          </Select>
        </Field>
        <Field label="Destination">
          <Select value={to} onChange={(e) => setTo(e.target.value)}>
            <option value="">Select…</option>
            {locations[toType].map((l) => (
              <option key={eid(l)} value={eid(l)}>
                {l.name} ({l.code})
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div style={{ marginTop: 8, marginBottom: 8, fontWeight: 600, fontSize: 13 }}>Items</div>
      {items.map((it, idx) => (
        <div key={idx} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
          <Select
            value={it.product}
            onChange={(e) => setItem(idx, { product: e.target.value })}
            style={{ flex: 1 }}
          >
            <option value="">Select product…</option>
            {(products?.items ?? []).map((p) => (
              <option key={eid(p)} value={eid(p)}>
                {p.name} · {p.sku}
              </option>
            ))}
          </Select>
          <input
            className="input"
            type="number"
            min={1}
            style={{ width: 96 }}
            value={it.quantity}
            onChange={(e) => setItem(idx, { quantity: Number(e.target.value) })}
          />
          <button
            className="icon-btn"
            onClick={() => setItems((arr) => arr.filter((_, i) => i !== idx))}
            aria-label="remove item"
            disabled={items.length === 1}
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setItems((arr) => [...arr, { product: '', quantity: 1 }])}
      >
        <Plus size={14} /> Add item
      </Button>

      <Field label="Notes" className="col-2" htmlFor="tnotes">
        <Textarea id="tnotes" placeholder="Optional notes for this transfer…" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>
    </Modal>
  );
}
