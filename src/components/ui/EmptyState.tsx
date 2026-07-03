import type { ReactNode } from 'react';
import { Inbox, AlertTriangle } from 'lucide-react';
import { Button } from './Button';

export function EmptyState({
  icon,
  title,
  message,
  action,
}: {
  icon?: ReactNode;
  title: string;
  message?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <div className="ic">{icon ?? <Inbox size={24} />}</div>
      <h4>{title}</h4>
      {message ? <p>{message}</p> : null}
      {action}
    </div>
  );
}

export function ErrorState({
  message = 'We could not load this data.',
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="empty">
      <div className="ic" style={{ color: 'var(--down)' }}>
        <AlertTriangle size={24} />
      </div>
      <h4>Something went wrong</h4>
      <p>{message}</p>
      {onRetry ? (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}
