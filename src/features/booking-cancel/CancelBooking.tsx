import { useEffect, useState } from 'react';
import { useUnit } from 'effector-react';
import type { Reservation } from '@/shared/api/types';
import { canCustomerCancel } from '@/entities/reservation';
import { Alert, Button, Modal, TextField } from '@/shared/ui';
import { $toCancel, cancelClicked, cancelConfirmed, cancelDismissed, cancelRequest } from './model';

/** Кнопка отмены у брони клиента; до дня заезда — кнопка, потом — пояснение. */
export function CancelBookingButton({ r, showHint }: { r: Reservation; showHint?: boolean }) {
  const ask = useUnit(cancelClicked);
  if (canCustomerCancel(r))
    return (
      <Button small variant="danger" onClick={() => ask(r)}>
        Отменить
      </Button>
    );
  return showHint ? <span className="muted">Отмена возможна только до дня заезда</span> : null;
}

export function CancelBookingModal() {
  const [target, pending, error, dismiss, confirm] = useUnit([
    $toCancel,
    cancelRequest.$pending,
    cancelRequest.$error,
    cancelDismissed,
    cancelConfirmed,
  ]);
  const [reason, setReason] = useState('');
  useEffect(() => setReason(''), [target]);
  if (!target) return null;
  return (
    <Modal title="Отменить бронь?" onClose={dismiss}>
      <div className="stack">
        <p>
          {target.hotel_name}, {target.room_type_name}
        </p>
        <TextField
          label="Причина (необязательно)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        {error && <Alert>{error}</Alert>}
        <div className="row">
          <Button onClick={dismiss}>Не отменять</Button>
          <Button variant="danger" disabled={pending} onClick={() => confirm(reason)}>
            Отменить бронь
          </Button>
        </div>
      </div>
    </Modal>
  );
}
