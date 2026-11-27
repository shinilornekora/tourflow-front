import { useGate, useUnit } from 'effector-react';
import { Link, useParams } from 'react-router-dom';
import type { FormEvent } from 'react';
import { HotelCover } from '@/entities/hotel/HotelCard';
import { $isAuthenticated, $role } from '@/entities/session/model';
import { Alert, Badge, Button, Card, Empty, Modal, Spinner, Stars, TextField } from '@/shared/ui';
import { formatDate, formatMoney, isoDay, nightsBetween, plural } from '@/shared/lib/format';
import * as m from './model';

export default function HotelPage() {
  const { id = '' } = useParams();
  return <Hotel key={id} id={id} />;
}

function Hotel({ id }: { id: string }) {
  useGate(m.HotelGate, { id });
  const [details, loading, loadError] = useUnit([m.hotelQuery.$data, m.hotelQuery.$pending, m.hotelQuery.$error]);
  const [stay, stayError, offers, searching, searchError] = useUnit([
    m.$stay,
    m.$stayError,
    m.availabilityQuery.$data,
    m.availabilityQuery.$pending,
    m.availabilityQuery.$error,
  ]);
  const [change, search, select] = useUnit([m.stayChanged, m.searchSubmitted, m.offerSelected]);
  const [authed, role] = useUnit([$isAuthenticated, $role]);

  if (loading && !details) return <Spinner />;
  if (loadError) return <div className="page"><Alert>{loadError}</Alert></div>;
  if (!details || details.hotel.id !== id) return <Spinner />;
  const { hotel, room_types } = details;
  const nights = nightsBetween(stay.check_in, stay.check_out);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    search();
  };

  return (
    <div className="page stack">
      <Link to="/">← Ко всем отелям</Link>
      <Card>
        <HotelCover url={hotel.photo_url} />
        <div className="row-between">
          <h1 style={{ margin: 0 }}>{hotel.name}</h1>
          {hotel.status === 'inactive' && <Badge tone="bad">Не принимает брони</Badge>}
        </div>
        <Stars n={hotel.stars} />
        <p className="muted">{hotel.city}, {hotel.address}</p>
        <p>{hotel.description}</p>
      </Card>

      <Card>
        <h2>Проверить свободные номера</h2>
        <form className="form-grid" onSubmit={onSubmit} aria-label="Даты поездки">
          <TextField label="Заезд" type="date" min={isoDay(0)} value={stay.check_in} onChange={(e) => change({ check_in: e.target.value })} />
          <TextField label="Выезд" type="date" min={stay.check_in} value={stay.check_out} onChange={(e) => change({ check_out: e.target.value })} />
          <TextField label="Гостей" type="number" min={1} max={10} value={stay.guests} onChange={(e) => change({ guests: Number(e.target.value) })} />
          <div style={{ alignSelf: 'end' }}>
            <Button type="submit" variant="primary" disabled={Boolean(stayError) || searching || hotel.status === 'inactive'}>
              Показать номера
            </Button>
          </div>
        </form>
        {stayError && <p className="muted" style={{ marginTop: 12 }}>{stayError}</p>}
      </Card>

      {searchError && <Alert>{searchError}</Alert>}
      {searching && <Spinner label="Ищем номера" />}
      {offers && !searching && (
        offers.items.length === 0 ? (
          <Empty>На эти даты нет номеров для {stay.guests} {plural(stay.guests, 'гостя', 'гостей', 'гостей')}</Empty>
        ) : (
          <section className="stack" aria-label="Свободные номера">
            {offers.items.map((o) => {
              const rt = room_types.find((r) => r.id === o.room_type_id);
              return (
                <Card key={o.room_type_id}>
                  <div className="row-between">
                    <div>
                      <h3>{o.name}</h3>
                      <p className="muted">
                        до {o.capacity} гостей · свободно {o.free} из {o.total_rooms}
                        {rt?.amenities.length ? ` · ${rt.amenities.join(', ')}` : ''}
                      </p>
                    </div>
                    <div className="row">
                      <div style={{ textAlign: 'right' }}>
                        <b>{formatMoney(o.total_price)}</b>
                        <div className="muted">{formatMoney(o.price_per_night)} × {nights} {plural(nights, 'ночь', 'ночи', 'ночей')}</div>
                      </div>
                      {authed && role === 'customer' ? (
                        <Button variant="primary" disabled={o.free < 1} onClick={() => select(o)}>
                          Забронировать
                        </Button>
                      ) : !authed ? (
                        <Link className="neu-btn" to="/login" state={{ from: `/hotels/${hotel.id}` }}>
                          Войти, чтобы забронировать
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </Card>
              );
            })}
          </section>
        )
      )}
      <BookingModal hotelName={hotel.name} />
    </div>
  );
}

function BookingModal({ hotelName }: { hotelName: string }) {
  const [offer, stay, booked, pending, error] = useUnit([m.$selected, m.$stay, m.$booked, m.bookRequest.$pending, m.bookRequest.$error]);
  const [close, confirm] = useUnit([m.bookingClosed, m.bookingConfirmed]);
  if (!offer) return null;
  if (booked) {
    return (
      <Modal title="Номер забронирован" onClose={close}>
        <Alert tone="success">
          {hotelName}, {booked.room_type_name}: {formatDate(booked.check_in)} — {formatDate(booked.check_out)}
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
          <p><b>{hotelName}</b>, {offer.name}</p>
          <p>{formatDate(stay.check_in)} — {formatDate(stay.check_out)}, гостей: {stay.guests}</p>
          <p>Итого: <b>{formatMoney(offer.total_price)}</b></p>
        </div>
        {error && <Alert>{error}</Alert>}
        <div className="row">
          <Button onClick={close} disabled={pending}>Отмена</Button>
          <Button variant="primary" onClick={confirm} disabled={pending}>
            {pending ? 'Бронируем…' : 'Подтвердить'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
