import { useEffect, useState } from 'react';
import { useUnit } from 'effector-react';
import type { ReservationStatus } from '@/shared/api/types';
import { ReservationCard } from '@/entities/reservation/ReservationCard';
import { formatMoney } from '@/shared/lib/format';
import { Alert, Button, Card, Empty, Modal, Select, Spinner, Stat, TextField } from '@/shared/ui';
import { managedQuery } from '@/pages/manage-hotels';
import * as m from './model';

export default function ManageBookingsPage() {
  const [hotels, loadHotels, list, pending, error, summary, apply, askCancel] = useUnit([
    managedQuery.$data,
    managedQuery.start,
    m.$list,
    m.listQuery.$pending,
    m.listQuery.$error,
    m.summaryQuery.$data,
    m.filtersApplied,
    m.cancelClicked,
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
    <div className="page stack">
      <h1>Брони отелей</h1>
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
      {summary && (
        <div className="stats" role="group" aria-label="Сводка по броням">
          <Stat label="Подтверждено" value={summary.confirmed} />
          <Stat label="Предстоит заездов" value={summary.upcoming} />
          <Stat label="Отменено" value={summary.cancelled} />
          <Stat label="Выручка" value={formatMoney(summary.revenue)} />
        </div>
      )}
      {error && <Alert>{error}</Alert>}
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
                m.canStaffCancel(r) ? (
                  <Button small variant="danger" onClick={() => askCancel(r)}>
                    Отменить
                  </Button>
                ) : undefined
              }
            />
          ))}
        </div>
      )}
      <CancelModal />
    </div>
  );
}

function CancelModal() {
  const [target, pending, error, dismiss, confirm] = useUnit([
    m.$toCancel,
    m.cancelRequest.$pending,
    m.cancelRequest.$error,
    m.cancelDismissed,
    m.cancelConfirmed,
  ]);
  const [reason, setReason] = useState('');
  useEffect(() => setReason(''), [target]);
  if (!target) return null;
  return (
    <Modal title="Отменить бронь гостя?" onClose={dismiss}>
      <form
        className="stack"
        onSubmit={(e) => {
          e.preventDefault();
          confirm(reason);
        }}
      >
        <p>
          {target.hotel_name}, {target.room_type_name}
        </p>
        <TextField
          label="Причина (обязательно, её увидит гость)"
          required
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        {error && <Alert>{error}</Alert>}
        <div className="row">
          <Button onClick={dismiss}>Не отменять</Button>
          <Button type="submit" variant="danger" disabled={pending || reason.trim() === ''}>
            Отменить бронь
          </Button>
        </div>
      </form>
    </Modal>
  );
}
