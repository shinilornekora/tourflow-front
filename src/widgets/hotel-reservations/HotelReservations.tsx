import { useEffect, useState, type ReactNode } from 'react';
import { useUnit } from 'effector-react';
import type { ReservationStatus } from '@/shared/api/types';
import { managedQuery } from '@/entities/hotel';
import { ReservationCard } from '@/entities/reservation';
import { StaffCancelButton, StaffCancelModal } from '@/features/booking-cancel-by-staff';
import { Alert, Card, Empty, Select, Spinner } from '@/shared/ui';
import * as m from './model';

/** summary — слот для сводки по выбранному отелю ('' — по всем). */
export function HotelReservations({ summary }: { summary?: (hotelId: string) => ReactNode }) {
  const [hotels, loadHotels, list, pending, error, apply] = useUnit([
    managedQuery.$data,
    managedQuery.start,
    m.$list,
    m.listQuery.$pending,
    m.listQuery.$error,
    m.filtersApplied,
  ]);
  const [hotelId, setHotelId] = useState('');
  const [status, setStatus] = useState<ReservationStatus | ''>('');
  useEffect(() => {
    loadHotels();
  }, [loadHotels]);
  useEffect(() => {
    apply({ hotel_id: hotelId, status });
  }, [apply, hotelId, status]);

  return (
    <>
      <Card>
        <div className="form-grid">
          <Select
            label="Отель"
            value={hotelId}
            onChange={(e) => setHotelId(e.target.value)}
            options={[
              { value: '', label: 'Все мои отели' },
              ...(hotels?.items ?? []).map((h) => ({ value: h.id, label: h.name })),
            ]}
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
      {summary?.(hotelId)}
      {error && <Alert>{error}</Alert>}
      {pending && list.length === 0 ? (
        <Spinner />
      ) : list.length === 0 ? (
        <Empty>Броней нет</Empty>
      ) : (
        <div className="stack">
          {list.map((r) => (
            <ReservationCard key={r.id} r={r} actions={<StaffCancelButton r={r} />} />
          ))}
        </div>
      )}
      <StaffCancelModal />
    </>
  );
}
