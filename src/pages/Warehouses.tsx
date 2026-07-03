import { useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import {
  useWarehouses,
  useCreateWarehouse,
  useUpdateWarehouse,
  useDeleteWarehouse,
} from '@/features/warehouses/useWarehouses';
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
import type { Warehouse, WarehouseType } from '@/types';

const emptyForm = {
  name: '',
  code: '',
  type: 'standard' as WarehouseType,
  capacityPallets: 0,
  usedPallets: 0,
  status: 'active' as 'active' | 'inactive',
  location: { lat: 0, lng: 0, address: '', city: '', country: '' },
};

type FormState = typeof emptyForm;

export default function Warehouses() {
  const { data, isLoading, isError, refetch } = useWarehouses({ limit: 100 });
  const { can } = usePermissions();
  const create = useCreateWarehouse();
  const update = useUpdateWarehouse();
  const remove = useDeleteWarehouse();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Warehouse | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (w: Warehouse) => {
    setEditing(w);
    setForm({
      name: w.name,
      code: w.code,
      type: w.type,
      capacityPallets: w.capacityPallets,
      usedPallets: w.usedPallets,
      status: w.status,
      location: {
        lat: w.location?.lat ?? 0,
        lng: w.location?.lng ?? 0,
        address: w.location?.address ?? '',
        city: w.location?.city ?? '',
        country: w.location?.country ?? '',
      },
    });
    setOpen(true);
  };

  const submit = async () => {
    if (!form.name || !form.code) return toast.error('Name and code are required');
    try {
      if (editing) {
        await update.mutateAsync({ id: eid(editing), body: form });
        toast.success('Warehouse updated');
      } else {
        await create.mutateAsync(form);
        toast.success('Warehouse created');
      }
      setOpen(false);
    } catch (err) {
      toast.error(apiMessage(err, 'Could not save warehouse'));
    }
  };

  const onDelete = async (w: Warehouse) => {
    if (!confirm(`Delete warehouse "${w.name}"? This cannot be undone.`)) return;
    try {
      await remove.mutateAsync(eid(w));
      toast.success('Warehouse deleted');
    } catch (err) {
      toast.error(apiMessage(err, 'Could not delete'));
    }
  };

  const items = data?.items ?? [];
  const canEdit = can('warehouses:update');
  const canDelete = can('warehouses:delete');

  return (
    <>
      <div className="page-lead reveal">
        <div>
          <h1>Warehouses</h1>
          <p>{data ? `${data.total} location${data.total === 1 ? '' : 's'}` : 'Manage your distribution network.'}</p>
        </div>
        <Can permission="warehouses:create">
          <Button onClick={openCreate}>
            <Plus size={16} /> New warehouse
          </Button>
        </Can>
      </div>

      <section className="card table-card reveal">
        <div className="table-head">
          <div className="card__title">All warehouses</div>
        </div>
        <div className="tbl-scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th>Warehouse</th>
                <th>Type</th>
                <th>Manager</th>
                <th className="r">Utilization</th>
                <th className="r">Capacity</th>
                <th>Status</th>
                <th className="r">Actions</th>
              </tr>
            </thead>
            {isLoading ? (
              <TableSkeleton rows={5} cols={7} />
            ) : (
              <tbody>
                {isError ? (
                  <tr>
                    <td colSpan={7}>
                      <ErrorState onRetry={() => refetch()} />
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <EmptyState
                        title="No warehouses yet"
                        message="Create your first warehouse to start tracking inventory."
                        action={
                          <Can permission="warehouses:create">
                            <Button size="sm" onClick={openCreate}>
                              <Plus size={14} /> New warehouse
                            </Button>
                          </Can>
                        }
                      />
                    </td>
                  </tr>
                ) : (
                  items.map((w) => {
                    const util = w.utilization ?? (w.capacityPallets ? Math.round((w.usedPallets / w.capacityPallets) * 100) : 0);
                    return (
                      <tr key={eid(w)}>
                        <td>
                          <div className="prod">
                            <span className="ic">{w.code?.slice(0, 2)}</span>
                            <div className="meta">
                              <div className="nm">{w.name}</div>
                              <div className="sku">{w.code}</div>
                            </div>
                          </div>
                        </td>
                        <td className="mute" style={{ textTransform: 'capitalize' }}>{w.type}</td>
                        <td>{refName(w.manager)}</td>
                        <td className="r">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
                            <div className={`progress ${util > 90 ? 'warn' : ''}`} style={{ width: 70 }}>
                              <span style={{ width: `${Math.min(util, 100)}%` }} />
                            </div>
                            <span className="qty">{util}%</span>
                          </div>
                        </td>
                        <td className="r qty">{formatNumber(w.capacityPallets)}</td>
                        <td>
                          <Pill tone={w.status === 'active' ? 'in-stock' : 'neutral'} dot>
                            {w.status === 'active' ? 'Active' : 'Inactive'}
                          </Pill>
                        </td>
                        <td className="r">
                          <div style={{ display: 'inline-flex', gap: 6 }}>
                            {canEdit && (
                              <button className="icon-btn" onClick={() => openEdit(w)} aria-label="edit">
                                <Pencil size={15} />
                              </button>
                            )}
                            {canDelete && (
                              <button className="icon-btn" onClick={() => onDelete(w)} aria-label="delete" style={{ color: 'var(--down)' }}>
                                <Trash2 size={15} />
                              </button>
                            )}
                            {!canEdit && !canDelete && <span className="mute">—</span>}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            )}
          </table>
        </div>
      </section>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Edit warehouse' : 'New warehouse'}
        wide
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} loading={create.isPending || update.isPending}>
              {editing ? 'Save changes' : 'Create warehouse'}
            </Button>
          </>
        }
      >
        <div className="form-grid">
          <Field label="Name">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Dallas DC" />
          </Field>
          <Field label="Code">
            <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="DAL" />
          </Field>
          <Field label="Type">
            <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as WarehouseType })}>
              <option value="standard">Standard</option>
              <option value="cold">Cold</option>
              <option value="hub">Hub</option>
            </Select>
          </Field>
          <Field label="Status">
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as 'active' | 'inactive' })}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </Field>
          <Field label="Capacity (pallets)">
            <Input type="number" value={form.capacityPallets} onChange={(e) => setForm({ ...form, capacityPallets: Number(e.target.value) })} />
          </Field>
          <Field label="Used (pallets)">
            <Input type="number" value={form.usedPallets} onChange={(e) => setForm({ ...form, usedPallets: Number(e.target.value) })} />
          </Field>
          <Field label="City">
            <Input value={form.location.city} onChange={(e) => setForm({ ...form, location: { ...form.location, city: e.target.value } })} />
          </Field>
          <Field label="Country">
            <Input value={form.location.country} onChange={(e) => setForm({ ...form, location: { ...form.location, country: e.target.value } })} />
          </Field>
          <Field label="Latitude">
            <Input type="number" value={form.location.lat} onChange={(e) => setForm({ ...form, location: { ...form.location, lat: Number(e.target.value) } })} />
          </Field>
          <Field label="Longitude">
            <Input type="number" value={form.location.lng} onChange={(e) => setForm({ ...form, location: { ...form.location, lng: Number(e.target.value) } })} />
          </Field>
        </div>
      </Modal>
    </>
  );
}
