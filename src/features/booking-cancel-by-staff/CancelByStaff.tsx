import { useEffect, useState } from 'react';
import { useUnit } from 'effector-react';
import type { Reservation } from '@/shared/api/types';
import { canStaffCancel } from '@/entities/reservation';
import { Alert, Button, Modal, TextField } from '@/shared/ui';
import { $toCancel, cancelClicked, cancelConfirmed, cancelDismissed, cancelRequest } from './model';

export function StaffCancelButton({ r }: { r: Reservation }) {
  const ask = useUnit(cancelClicked);
  if (!canStaffCancel(r)) return null;
  return (
    <Button small variant="danger" onClick={() => ask(r)}>
      Отменить
    </Button>
  );
}

export function StaffCancelModal() {
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
