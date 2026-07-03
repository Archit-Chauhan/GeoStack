import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { UserPlus, Trash2, Sun, Moon } from 'lucide-react';
import { useAppDispatch, useAppSelector, useCurrentUser, usePermissions } from '@/app/hooks';
import { toggleTheme } from '@/app/uiSlice';
import { useUpdateProfile } from '@/features/auth/useAuth';
import { useCompany, useUpdateCompany } from '@/features/company/useCompany';
import { useUsers, useInviteUser, useAssignRole, useDeleteUser } from '@/features/users/useUsers';
import { Can } from '@/routes/PermissionGate';
import {
  Button,
  Card,
  CardHead,
  Field,
  Input,
  Modal,
  Pill,
  Select,
  Skeleton,
  EmptyState,
} from '@/components/ui';
import { apiMessage } from '@/lib/api';
import { eid } from '@/lib/entity';
import { ROLE_LABELS } from '@/lib/rbac';
import { initials } from '@/lib/format';
import type { Role, User } from '@/types';

const TABS = ['Profile', 'Company', 'Team', 'Preferences'] as const;
type Tab = (typeof TABS)[number];

export default function Settings() {
  const { can } = usePermissions();
  const [tab, setTab] = useState<Tab>('Profile');
  const visibleTabs = TABS.filter((t) => (t === 'Team' ? can('users:read') : true));

  return (
    <>
      <div className="page-lead reveal">
        <div>
          <h1>Settings</h1>
          <p>Manage your profile, company and team.</p>
        </div>
      </div>

      <div className="tabs reveal">
        {visibleTabs.map((t) => (
          <span key={t} className={`tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
            {t}
          </span>
        ))}
      </div>

      {tab === 'Profile' && <ProfileTab />}
      {tab === 'Company' && <CompanyTab />}
      {tab === 'Team' && can('users:read') && <TeamTab />}
      {tab === 'Preferences' && <PreferencesTab />}
    </>
  );
}

function ProfileTab() {
  const user = useCurrentUser();
  const update = useUpdateProfile();
  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [pw, setPw] = useState('');
  const [currentPw, setCurrentPw] = useState('');

  const saveProfile = async () => {
    try {
      await update.mutateAsync({ name, phone });
      toast.success('Profile updated');
    } catch (err) {
      toast.error(apiMessage(err, 'Could not update profile'));
    }
  };

  const changePassword = async () => {
    if (pw.length < 8) return toast.error('New password must be at least 8 characters');
    try {
      await update.mutateAsync({ password: pw, currentPassword: currentPw });
      toast.success('Password changed');
      setPw('');
      setCurrentPw('');
    } catch (err) {
      toast.error(apiMessage(err, 'Could not change password'));
    }
  };

  return (
    <section className="grid-2--even reveal" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
      <Card>
        <CardHead title="Your profile" />
        <Field label="Full name">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Email">
          <Input value={user?.email ?? ''} disabled />
        </Field>
        <Field label="Phone">
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 000 0000" />
        </Field>
        <Button onClick={saveProfile} loading={update.isPending}>
          Save profile
        </Button>
      </Card>

      <Card>
        <CardHead title="Change password" />
        <Field label="Current password">
          <Input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} autoComplete="current-password" />
        </Field>
        <Field label="New password">
          <Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" />
        </Field>
        <Button variant="secondary" onClick={changePassword} loading={update.isPending}>
          Update password
        </Button>
      </Card>
    </section>
  );
}

function CompanyTab() {
  const { data, isLoading } = useCompany();
  const update = useUpdateCompany();
  const { can } = usePermissions();
  const editable = can('company:update');

  const [form, setForm] = useState({ name: '', industry: '', currency: 'USD' });
  useEffect(() => {
    if (data) setForm({ name: data.name ?? '', industry: data.industry ?? '', currency: data.currency ?? 'USD' });
  }, [data]);

  const save = async () => {
    try {
      await update.mutateAsync(form);
      toast.success('Company updated');
    } catch (err) {
      toast.error(apiMessage(err, 'Could not update company'));
    }
  };

  if (isLoading) {
    return (
      <Card className="reveal">
        <Skeleton className="sk-line" style={{ width: '30%' }} />
        <Skeleton style={{ height: 44, marginBottom: 16 }} />
        <Skeleton style={{ height: 44 }} />
      </Card>
    );
  }

  return (
    <Card className="reveal" style={{ maxWidth: 560 }}>
      <CardHead title="Company details" sub={data ? `Slug: ${data.slug}` : undefined} />
      <Field label="Company name">
        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} disabled={!editable} />
      </Field>
      <div className="form-grid">
        <Field label="Industry">
          <Input value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} disabled={!editable} placeholder="Retail, Pharma…" />
        </Field>
        <Field label="Currency">
          <Select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} disabled={!editable}>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
            <option value="INR">INR</option>
          </Select>
        </Field>
      </div>
      <Can permission="company:update">
        <Button onClick={save} loading={update.isPending}>
          Save changes
        </Button>
      </Can>
    </Card>
  );
}

function TeamTab() {
  const { data, isLoading } = useUsers();
  const { can } = usePermissions();
  const assignRole = useAssignRole();
  const removeUser = useDeleteUser();
  const [inviteOpen, setInviteOpen] = useState(false);

  const users = data?.items ?? [];
  const canAssign = can('roles:assign');
  const canDelete = can('users:delete');

  const onAssign = async (u: User, role: Role) => {
    try {
      await assignRole.mutateAsync({ id: eid(u), role });
      toast.success('Role updated');
    } catch (err) {
      toast.error(apiMessage(err, 'Could not assign role'));
    }
  };

  const onRemove = async (u: User) => {
    if (!confirm(`Remove ${u.name} from the company?`)) return;
    try {
      await removeUser.mutateAsync(eid(u));
      toast.success('User removed');
    } catch (err) {
      toast.error(apiMessage(err, 'Could not remove user'));
    }
  };

  return (
    <>
      <section className="card table-card reveal">
        <div className="table-head">
          <div className="card__title">Team members</div>
          <Can permission="users:invite">
            <Button size="sm" onClick={() => setInviteOpen(true)}>
              <UserPlus size={14} /> Invite user
            </Button>
          </Can>
        </div>
        <div className="tbl-scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th>Member</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                {canDelete ? <th className="r">Action</th> : null}
              </tr>
            </thead>
            {isLoading ? (
              <tbody>
                {Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5}><Skeleton className="sk-line" style={{ marginBottom: 0 }} /></td>
                  </tr>
                ))}
              </tbody>
            ) : (
              <tbody>
                {users.length === 0 ? (
                  <tr><td colSpan={5}><EmptyState title="No team members" /></td></tr>
                ) : (
                  users.map((u) => (
                    <tr key={eid(u)}>
                      <td>
                        <div className="prod">
                          <span className="ic" style={{ borderRadius: '50%', background: u.avatarColor ?? 'var(--primary)', color: 'var(--on-primary)' }}>
                            {initials(u.name)}
                          </span>
                          <div className="meta">
                            <div className="nm">{u.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="mute">{u.email}</td>
                      <td>
                        {canAssign ? (
                          <Select
                            value={u.role}
                            onChange={(e) => onAssign(u, e.target.value as Role)}
                            style={{ height: 34, width: 'auto', minWidth: 160 }}
                          >
                            {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
                              <option key={r} value={r}>
                                {ROLE_LABELS[r]}
                              </option>
                            ))}
                          </Select>
                        ) : (
                          ROLE_LABELS[u.role]
                        )}
                      </td>
                      <td>
                        <Pill tone={u.status === 'active' ? 'in-stock' : u.status === 'invited' ? 'low' : 'neutral'} dot>
                          {u.status}
                        </Pill>
                      </td>
                      {canDelete ? (
                        <td className="r">
                          <button className="icon-btn" onClick={() => onRemove(u)} aria-label="remove" style={{ color: 'var(--down)' }}>
                            <Trash2 size={15} />
                          </button>
                        </td>
                      ) : null}
                    </tr>
                  ))
                )}
              </tbody>
            )}
          </table>
        </div>
      </section>

      <Can permission="users:invite">
        <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} />
      </Can>
    </>
  );
}

function InviteModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const invite = useInviteUser();
  const [form, setForm] = useState<{ name: string; email: string; role: Role }>({
    name: '',
    email: '',
    role: 'warehouse_staff',
  });

  const submit = async () => {
    if (!form.name || !form.email) return toast.error('Name and email required');
    try {
      await invite.mutateAsync(form);
      toast.success('Invitation sent');
      setForm({ name: '', email: '', role: 'warehouse_staff' });
      onClose();
    } catch (err) {
      toast.error(apiMessage(err, 'Could not invite user'));
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Invite a team member"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} loading={invite.isPending}>
            Send invite
          </Button>
        </>
      }
    >
      <Field label="Full name">
        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </Field>
      <Field label="Email">
        <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      </Field>
      <Field label="Role">
        <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
          {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </Select>
      </Field>
    </Modal>
  );
}

function PreferencesTab() {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((s) => s.ui.theme);
  return (
    <Card className="reveal" style={{ maxWidth: 560 }}>
      <CardHead title="Appearance" sub="Choose how GeoStock looks for you." />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontWeight: 600 }}>Theme</div>
          <div className="card__sub">Currently {theme === 'dark' ? 'Dark' : 'Light'}</div>
        </div>
        <Button variant="secondary" onClick={() => dispatch(toggleTheme())}>
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          Switch to {theme === 'dark' ? 'light' : 'dark'}
        </Button>
      </div>
    </Card>
  );
}
