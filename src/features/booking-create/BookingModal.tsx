import { Link } from 'react-router-dom';
import { useUnit } from 'effector-react';
import { formatDate, formatMoney } from '@/shared/lib/format';
import { Alert, Button, Modal } from '@/shared/ui';
import { $booked, $selected, bookRequest, bookingClosed, bookingConfirmed } from './model';

export function BookingModal() {
  const [sel, booked, pending, error, close, confirm] = useUnit([
    $selected,
    $booked,
    bookRequest.$pending,
    bookRequest.$error,
    bookingClosed,
    bookingConfirmed,
  ]);
  if (!sel) return null;
  if (booked) {
    return (
      <Modal title="Номер забронирован" onClose={close}>
        <Alert tone="success">
          {sel.hotelName}, {booked.room_type_name}: {formatDate(booked.check_in)} —{' '}
          {formatDate(booked.check_out)}
        </Alert>
        <div className="row" style={{ marginTop: 16 }}>
          <Button onClick={close}>Остаться здесь</Button>
          <Link className="neu-btn primary" to="/cabinet/bookings" onClick={() => close()}>
            К моим броням
          </Link>
        </div>
      </Modal>
    );
  }
  return (
    <Modal title="Подтверждение брони" onClose={pending ? () => undefined : close}>
      <div className="stack">
        <div className="neu-inset">
          <p>
            <b>{sel.hotelName}</b>, {sel.offer.name}
          </p>
          <p>
            {formatDate(sel.check_in)} — {formatDate(sel.check_out)}, гостей: {sel.guests}
          </p>
          <p>
            Итого: <b>{formatMoney(sel.offer.total_price)}</b>
          </p>
        </div>
        {error && <Alert>{error}</Alert>}
        <div className="row">
          <Button onClick={close} disabled={pending}>
            Отмена
          </Button>
          <Button variant="primary" onClick={confirm} disabled={pending}>
            {pending ? 'Бронируем…' : 'Подтвердить'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
