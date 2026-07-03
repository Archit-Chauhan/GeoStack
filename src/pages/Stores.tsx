import { useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import {
  useStores,
  useCreateStore,
  useUpdateStore,
  useDeleteStore,
} from '@/features/stores/useStores';
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
import type { Store } from '@/types';

const emptyForm = {
  name: '',
  code: '',
  status: 'active' as 'active' | 'inactive',
  location: { lat: 0, lng: 0, address: '', city: '', country: '' },
};

type FormState = typeof emptyForm;

export default function Stores() {
  const { data, isLoading, isError, refetch } = useStores({ limit: 100 });
  const { can } = usePermissions();
  const create = useCreateStore();
  const update = useUpdateStore();
  const remove = useDeleteStore();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Store | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (s: Store) => {
    setEditing(s);
    setForm({
      name: s.name,
      code: s.code,
      status: s.status,
      location: {
        lat: s.location?.lat ?? 0,
        lng: s.location?.lng ?? 0,
        address: s.location?.address ?? '',
        city: s.location?.city ?? '',
        country: s.location?.country ?? '',
      },
    });
    setOpen(true);
  };

  const submit = async () => {
    if (!form.name || !form.code) return toast.error('Name and code are required');
    try {
      if (editing) {
        await update.mutateAsync({ id: eid(editing), body: form });
        toast.success('Store updated');
      } else {
        await create.mutateAsync(form);
        toast.success('Store created');
      }
      setOpen(false);
    } catch (err) {
      toast.error(apiMessage(err, 'Could not save store'));
    }
  };

  const onDelete = async (s: Store) => {
    if (!confirm(`Delete store "${s.name}"?`)) return;
    try {
      await remove.mutateAsync(eid(s));
      toast.success('Store deleted');
    } catch (err) {
      toast.error(apiMessage(err, 'Could not delete'));
    }
  };

  const items = data?.items ?? [];
  const canEdit = can('stores:update');
  const canDelete = can('stores:delete');

  return (
    <>
      <div className="page-lead reveal">
        <div>
          <h1>Stores</h1>
          <p>{data ? `${data.total} retail location${data.total === 1 ? '' : 's'}` : 'Your retail front-line.'}</p>
        </div>
        <Can permission="stores:create">
          <Button onClick={openCreate}>
            <Plus size={16} /> New store
          </Button>
        </Can>
      </div>

      <section className="card table-card reveal">
        <div className="table-head">
          <div className="card__title">All stores</div>
        </div>
        <div className="tbl-scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th>Store</th>
                <th>Manager</th>
                <th>City</th>
                <th>Country</th>
                <th>Status</th>
                <th className="r">Actions</th>
              </tr>
            </thead>
            {isLoading ? (
              <TableSkeleton rows={5} cols={6} />
            ) : (
              <tbody>
                {isError ? (
                  <tr>
                    <td colSpan={6}>
                      <ErrorState onRetry={() => refetch()} />
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <EmptyState
                        title="No stores yet"
                        message="Add a store to start selling and receiving transfers."
                        action={
                          <Can permission="stores:create">
                            <Button size="sm" onClick={openCreate}>
                              <Plus size={14} /> New store
                            </Button>
                          </Can>
                        }
                      />
                    </td>
                  </tr>
                ) : (
                  items.map((s) => (
                    <tr key={eid(s)}>
                      <td>
                        <div className="prod">
                          <span className="ic">{s.code?.slice(0, 2)}</span>
                          <div className="meta">
                            <div className="nm">{s.name}</div>
                            <div className="sku">{s.code}</div>
                          </div>
                        </div>
                      </td>
                      <td>{refName(s.manager)}</td>
                      <td className="mute">{s.location?.city || '—'}</td>
                      <td className="mute">{s.location?.country || '—'}</td>
                      <td>
                        <Pill tone={s.status === 'active' ? 'in-stock' : 'neutral'} dot>
                          {s.status === 'active' ? 'Active' : 'Inactive'}
                        </Pill>
                      </td>
                      <td className="r">
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          {canEdit && (
                            <button className="icon-btn" onClick={() => openEdit(s)} aria-label="edit">
                              <Pencil size={15} />
                            </button>
                          )}
                          {canDelete && (
                            <button className="icon-btn" onClick={() => onDelete(s)} aria-label="delete" style={{ color: 'var(--down)' }}>
                              <Trash2 size={15} />
                            </button>
                          )}
                          {!canEdit && !canDelete && <span className="mute">—</span>}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            )}
          </table>
        </div>
      </section>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Edit store' : 'New store'}
        wide
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} loading={create.isPending || update.isPending}>
              {editing ? 'Save changes' : 'Create store'}
            </Button>
          </>
        }
      >
        <div className="form-grid">
          <Field label="Name">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Miami Retail" />
          </Field>
          <Field label="Code">
            <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="MIA" />
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
          <Field label="Status" className="col-2">
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as 'active' | 'inactive' })}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </Field>
        </div>
      </Modal>
    </>
  );
}
