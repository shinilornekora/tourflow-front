import { useEffect, useState } from 'react';
import { createEvent, createStore, sample } from 'effector';
import { useUnit } from 'effector-react';
import { api, type ReservationQuery } from '@/shared/api/endpoints';
import type { Reservation, ReservationStatus } from '@/shared/api/types';
import { createRequest } from '@/shared/lib/request';
import { ReservationCard } from '@/entities/reservation/ReservationCard';
import { Alert, Button, Card, Empty, Select, Spinner } from '@/shared/ui';
import { managedQuery } from '@/pages/manage-hotels';

export const listQuery = createRequest((q: ReservationQuery) => api.hotelReservations({ ...q, page_size: 100 }));
export const cancelRequest = createRequest((id: string) => api.cancelReservation(id, 'Отменено менеджером отеля'));
export const filtersApplied = createEvent<ReservationQuery>();

export const $list = createStore<Reservation[]>([])
  .on(listQuery.fx.doneData, (_, d) => d.items)
  .on(cancelRequest.fx.doneData, (l, r) => l.map((x) => (x.id === r.id ? r : x)));

sample({ clock: filtersApplied, target: listQuery.start });

export default function ManageBookingsPage() {
  const [hotels, loadHotels, list, pending, error, cancelError, apply, cancel] = useUnit([
    managedQuery.$data,
    managedQuery.start,
    $list,
    listQuery.$pending,
    listQuery.$error,
    cancelRequest.$error,
    filtersApplied,
    cancelRequest.start,
  ]);
  const [hotelId, setHotelId] = useState('');
  const [status, setStatus] = useState<ReservationStatus | ''>('');
  useEffect(() => { loadHotels(); }, [loadHotels]);
  useEffect(() => { apply({ hotel_id: hotelId, status }); }, [apply, hotelId, status]);

  return (
    <div className="page stack">
      <h1>Брони отелей</h1>
      <Card>
        <div className="form-grid">
          <Select
            label="Отель"
            value={hotelId}
            onChange={(e) => setHotelId(e.target.value)}
            options={[{ value: '', label: 'Все мои отели' }, ...(hotels?.items ?? []).map((h) => ({ value: h.id, label: h.name }))]}
          />
          <Select
            label="Статус"
            value={status}
            onChange={(e) => setStatus(e.target.value as ReservationStatus | '')}
            options={[
              { value: '', label: 'Любой' },
              { value: 'confirmed', label: 'Подтверждённые' },
              { value: 'cancelled', label: 'Отменённые' },
            ]}
          />
        </div>
      </Card>
      {(error || cancelError) && <Alert>{error ?? cancelError}</Alert>}
      {pending && list.length === 0 ? (
        <Spinner />
      ) : list.length === 0 ? (
        <Empty>Броней нет</Empty>
      ) : (
        <div className="stack">
          {list.map((r) => (
            <ReservationCard
              key={r.id}
              r={r}
              actions={
                r.status === 'confirmed' ? (
                  <Button small variant="danger" onClick={() => cancel(r.id)}>Отменить</Button>
                ) : undefined
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
