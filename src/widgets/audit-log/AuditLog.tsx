import { useEffect, useState } from 'react';
import { useUnit } from 'effector-react';
import { api } from '@/shared/api/endpoints';
import type { AuditRecord } from '@/shared/api/types';
import { createRequest } from '@/shared/lib/request';
import { formatDateTime, roleLabel } from '@/shared/lib/format';
import { Alert, Button, Empty, Spinner } from '@/shared/ui';

const auditQuery = createRequest((q: { hotel_id: string; page: number }) => api.audit(q));

const actionLabel: Record<string, string> = {
  reservation_created: 'Бронь создана',
  reservation_cancelled: 'Бронь отменена',
};

const actor = (r: AuditRecord) =>
  r.actor_role === 'system' ? 'Система' : (roleLabel[r.actor_role] ?? r.actor_role);

/** Журнал действий по отелю (постранично). */
export function AuditLog({ hotelId: id }: { hotelId: string }) {
  const [data, pending, error, load] = useUnit([
    auditQuery.$data,
    auditQuery.$pending,
    auditQuery.$error,
    auditQuery.start,
  ]);
  const [page, setPage] = useState(1);
  useEffect(() => {
    load({ hotel_id: id, page });
  }, [load, id, page]);
  const pages = data ? Math.max(1, Math.ceil(data.total / data.page_size)) : 1;

  return (
    <>
      {error && <Alert>{error}</Alert>}
      {pending && !data ? (
        <Spinner />
      ) : !data || data.items.length === 0 ? (
        <Empty>Записей пока нет</Empty>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Когда</th>
                <th>Кто</th>
                <th>Действие</th>
                <th>Объект</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((r) => (
                <tr key={r.id}>
                  <td data-label="Когда">{formatDateTime(r.at)}</td>
                  <td data-label="Кто">{actor(r)}</td>
                  <td data-label="Действие">{actionLabel[r.action] ?? r.action}</td>
                  <td data-label="Объект" className="muted" style={{ fontSize: 12 }}>
                    {r.entity_id}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {pages > 1 && (
        <div className="row" style={{ justifyContent: 'center' }}>
          <Button disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Назад
          </Button>
          <span className="muted">
            {page} из {pages}
          </span>
          <Button disabled={page >= pages} onClick={() => setPage(page + 1)}>
            Вперёд
          </Button>
        </div>
      )}
    </>
  );
}
