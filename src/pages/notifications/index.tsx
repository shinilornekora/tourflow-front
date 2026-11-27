import { useEffect } from 'react';
import { useUnit } from 'effector-react';
import * as n from '@/entities/notification/model';
import { Alert, Button, Empty, Spinner } from '@/shared/ui';
import { formatDateTime } from '@/shared/lib/format';

export default function NotificationsPage() {
  const [items, pending, error, unread] = useUnit([
    n.$items,
    n.listQuery.$pending,
    n.listQuery.$error,
    n.$unread,
  ]);
  const [load, read, readAll] = useUnit([n.notificationsRequested, n.markRead.start, n.markAllRead.start]);
  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="page stack" style={{ maxWidth: 760 }}>
      <div className="row-between">
        <h1 style={{ margin: 0 }}>Уведомления</h1>
        <Button small disabled={unread === 0} onClick={() => readAll()}>
          Прочитать все
        </Button>
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
            {!x.read_at && (
              <Button small onClick={() => read(x.id)}>
                Отметить прочитанным
              </Button>
            )}
          </article>
        ))
      )}
    </div>
  );
}
