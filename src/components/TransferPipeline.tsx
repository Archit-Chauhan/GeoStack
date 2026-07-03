import { cn } from '@/lib/cn';
import type { TransferStatus } from '@/types';

const STEPS: { key: TransferStatus; label: string }[] = [
  { key: 'requested', label: 'Requested' },
  { key: 'approved', label: 'Approved' },
  { key: 'dispatched', label: 'Dispatched' },
  { key: 'in_transit', label: 'In transit' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'received', label: 'Received' },
];

const ORDER: TransferStatus[] = STEPS.map((s) => s.key);

/** Stepper visualizing a transfer's lifecycle. */
export function TransferPipeline({ status }: { status: TransferStatus }) {
  const cancelled = status === 'cancelled';
  const currentIdx = ORDER.indexOf(status);

  return (
    <div className="stepper">
      {STEPS.map((step, i) => {
        const done = !cancelled && i < currentIdx;
        const current = !cancelled && i === currentIdx;
        return (
          <div key={step.key} className={cn('step', done && 'done', current && 'current')}>
            <span className="dot" />
            <span className="nm">{step.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export { STEPS as TRANSFER_STEPS };
