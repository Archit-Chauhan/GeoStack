import { useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, X } from 'lucide-react';
import {
  useTransfers,
  useTransferAction,
  nextAction,
  type TransferFilters,
} from '@/features/transfers/useTransfers';
import { usePermissions } from '@/app/hooks';
import { Can } from '@/routes/PermissionGate';
import { CreateTransferModal } from '@/components/transfers/CreateTransferModal';
import { TransferPipeline } from '@/components/TransferPipeline';
import { Card, Button, Pill, Skeleton, EmptyState, ErrorState } from '@/components/ui';
import { apiMessage } from '@/lib/api';
import { eid } from '@/lib/entity';
import { formatNumber, humanizeStatus } from '@/lib/format';
import { transferTone } from '@/lib/status';
import type { Transfer, TransferStatus } from '@/types';

const STATUS_TABS: { key: TransferStatus | ''; label: string }[] = [
  { key: '', label: 'All' },
  { key: 'requested', label: 'Requested' },
  { key: 'approved', label: 'Approved' },
  { key: 'in_transit', label: 'In transit' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'received', label: 'Received' },
  { key: 'cancelled', label: 'Cancelled' },
];

function locName(entity: unknown): string {
  if (entity && typeof entity === 'object' && 'name' in entity) return (entity as { name: string }).name;
  return '—';
}

export default function Transfers() {
  const { isReadOnly } = usePermissions();
  const [status, setStatus] = useState<TransferStatus | ''>('');
  const [open, setOpen] = useState(false);

  const filters: TransferFilters = { limit: 50 };
  if (status) filters.status = status;
  const { data, isLoading, isError, refetch } = useTransfers(filters);
  const items = data?.items ?? [];

  return (
    <>
      <div className="page-lead reveal">
        <div>
          <h1>Transfers</h1>
          <p>Move stock between locations and track every step.</p>
        </div>
        <Can permission="transfers:create">
          <Button onClick={() => setOpen(true)}>
            <Plus size={16} /> New transfer
          </Button>
        </Can>
      </div>

      <div className="tabs reveal" style={{ marginBottom: -8 }}>
        {STATUS_TABS.map((t) => (
          <span
            key={t.key || 'all'}
            className={`tab${status === t.key ? ' active' : ''}`}
            onClick={() => setStatus(t.key)}
          >
            {t.label}
          </span>
        ))}
      </div>

      {isLoading ? (
        <Card className="reveal">
          <Skeleton className="sk-line" style={{ width: '40%' }} />
          <Skeleton style={{ height: 40, marginTop: 12 }} />
        </Card>
      ) : isError ? (
        <Card className="reveal">
          <ErrorState onRetry={() => refetch()} />
        </Card>
      ) : items.length === 0 ? (
        <Card className="reveal">
          <EmptyState
            title="No transfers"
            message="Create a transfer to move stock between your locations."
            action={
              <Can permission="transfers:create">
                <Button size="sm" onClick={() => setOpen(true)}>
                  <Plus size={14} /> New transfer
                </Button>
              </Can>
            }
          />
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {items.map((t) => (
            <TransferCard key={eid(t)} transfer={t} />
          ))}
        </div>
      )}

      {!isReadOnly && <CreateTransferModal open={open} onClose={() => setOpen(false)} />}
    </>
  );
}

function TransferCard({ transfer: t }: { transfer: Transfer }) {
  const { can } = usePermissions();
  const action = useTransferAction();
  const primary = nextAction(t.status);
  const cancellable = !['received', 'cancelled'].includes(t.status);
  const itemCount = t.items?.reduce((sum, it) => sum + it.quantity, 0) ?? 0;

  const run = async (act: Parameters<typeof action.mutateAsync>[0]['action']) => {
    try {
      await action.mutateAsync({ id: eid(t), action: act });
      toast.success(`Transfer ${t.code} → ${humanizeStatus(act.replace('-', '_'))}`);
    } catch (err) {
      toast.error(apiMessage(err, 'Action failed'));
    }
  };

  return (
    <Card className="reveal">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="num" style={{ fontWeight: 600 }}>{t.code}</span>
            <Pill tone={transferTone(t.status)} dot>
              {humanizeStatus(t.status)}
            </Pill>
          </div>
          <div className="card__sub" style={{ marginTop: 4 }}>
            {locName(t.from)} → {locName(t.to)} · {formatNumber(itemCount)} units
            {t.distanceKm ? ` · ${Math.round(t.distanceKm)} km` : ''}
            {t.etaHours ? ` · ETA ${Math.round(t.etaHours)}h` : ''}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {primary && can(primary.permission) ? (
            <Button size="sm" onClick={() => run(primary.action)} loading={action.isPending}>
              {primary.label}
            </Button>
          ) : null}
          {cancellable && can('transfers:cancel') ? (
            <Button size="sm" variant="secondary" onClick={() => run('cancel')} disabled={action.isPending}>
              <X size={14} /> Cancel
            </Button>
          ) : null}
        </div>
      </div>
      <TransferPipeline status={t.status} />
    </Card>
  );
}
