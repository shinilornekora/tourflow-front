import { useEffect } from 'react';
import { useUnit } from 'effector-react';
import { $items, listQuery, notificationsRequested } from '@/entities/notification';
import { MarkAllReadButton, MarkReadButton } from '@/features/notifications-mark-read';
import { formatDateTime } from '@/shared/lib/format';
import { Alert, Empty, Spinner } from '@/shared/ui';

export default function NotificationsPage() {
  const [items, pending, error, load] = useUnit([
    $items,
    listQuery.$pending,
    listQuery.$error,
    notificationsRequested,
  ]);
  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="page stack" style={{ maxWidth: 760 }}>
      <div className="row-between">
        <h1 style={{ margin: 0 }}>Уведомления</h1>
        <MarkAllReadButton />
      </div>
      {error && <Alert>{error}</Alert>}
      {pending && items.length === 0 ? (
        <Spinner />
      ) : items.length === 0 ? (
        <Empty>Уведомлений пока нет</Empty>
      ) : (
        items.map((x) => (
          <article key={x.id} className={x.read_at ? 'neu-inset' : 'neu-card'} aria-label={x.title}>
            <div className="row-between">
              <h3 style={{ margin: 0 }}>{x.title}</h3>
              <span className="muted">{formatDateTime(x.created_at)}</span>
            </div>
            <p>{x.body}</p>
            {!x.read_at && <MarkReadButton id={x.id} />}
          </article>
        ))
      )}
    </div>
  );
}
