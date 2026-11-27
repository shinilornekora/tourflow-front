import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { Reservation } from '@/shared/api/types';
import { Badge } from '@/shared/ui';
import { formatDate, formatMoney, plural, statusLabel } from '@/shared/lib/format';

export function ReservationCard({ r, actions }: { r: Reservation; actions?: ReactNode }) {
  return (
    <article className="neu-card" aria-label={`Бронь ${r.hotel_name}`}>
      <div className="row-between">
        <div>
          <h3 style={{ marginBottom: 4 }}>
            <Link to={`/hotels/${r.hotel_id}`}>{r.hotel_name}</Link>
          </h3>
          <p className="muted">{r.room_type_name}</p>
        </div>
        <Badge tone={r.status === 'confirmed' ? 'ok' : 'bad'}>{statusLabel[r.status]}</Badge>
      </div>
      <p>
        {formatDate(r.check_in)} — {formatDate(r.check_out)} · {r.nights}{' '}
        {plural(r.nights, 'ночь', 'ночи', 'ночей')} · гостей: {r.guests}
      </p>
      <div className="row-between">
        <b>{formatMoney(r.total)}</b>
        {actions}
      </div>
      {r.cancel_reason && <p className="muted">Причина отмены: {r.cancel_reason}</p>}
    </article>
  );
}
