import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useUnit } from 'effector-react';
import { api, fetchAll } from '@/shared/api/endpoints';
import { createRequest } from '@/shared/lib/request';
import { HotelCard } from '@/entities/hotel/HotelCard';
import { $role } from '@/entities/session/model';
import { Alert, Empty, Spinner } from '@/shared/ui';

export const managedQuery = createRequest((_: void) =>
  fetchAll((page, page_size) => api.managedHotels({ include_inactive: true, page, page_size })),
);

export default function ManageHotelsPage() {
  const [data, pending, error, load, role] = useUnit([managedQuery.$data, managedQuery.$pending, managedQuery.$error, managedQuery.start, $role]);
  useEffect(() => { load(); }, [load]);
  const hotels = data?.items ?? [];

  return (
    <div className="page stack">
      <div className="row-between">
        <h1 style={{ margin: 0 }}>{role === 'admin' ? 'Все отели' : 'Мои отели'}</h1>
        {role === 'admin' && (
          <Link className="neu-btn primary" to="/manage/hotels/new">
            + Добавить отель
          </Link>
        )}
      </div>
      {error && <Alert>{error}</Alert>}
      {pending && !data ? (
        <Spinner />
      ) : hotels.length === 0 ? (
        <Empty>{role === 'admin' ? 'Отелей пока нет' : 'Вам ещё не назначили ни одного отеля'}</Empty>
      ) : (
        <div className="grid">
          {hotels.map((h) => (
            <HotelCard key={h.id} hotel={h} to={`/manage/hotels/${h.id}`} />
          ))}
        </div>
      )}
    </div>
  );
}
