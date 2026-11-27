import { Link } from 'react-router-dom';
import { useUnit } from 'effector-react';
import type { HotelDetails } from '@/shared/api/types';
import { $isAuthenticated, $role } from '@/entities/session';
import { $stay, StayForm, availabilityQuery } from '@/features/booking-check-availability';
import { BookingModal, offerSelected } from '@/features/booking-create';
import { formatMoney, nightsBetween, plural } from '@/shared/lib/format';
import { Alert, Button, Card, Empty, Spinner } from '@/shared/ui';
import './model';

/** Клиент и гость не видят категории, занятые на выбранные даты; персонал видит всё с остатками. */
export function visibleOffers<T extends { free: number }>(items: T[], isStaff: boolean): T[] {
  return isStaff ? items : items.filter((o) => o.free > 0);
}

/** Поиск свободных номеров на даты и бронирование. */
export function RoomOffers({ details }: { details: HotelDetails }) {
  const { hotel, room_types } = details;
  const [stay, offers, searching, searchError, select, authed, role] = useUnit([
    $stay,
    availabilityQuery.$data,
    availabilityQuery.$pending,
    availabilityQuery.$error,
    offerSelected,
    $isAuthenticated,
    $role,
  ]);
  const isStaff = role === 'admin' || role === 'hotel_manager';
  const nights = nightsBetween(stay.check_in, stay.check_out);
  const items = offers ? visibleOffers(offers.items, isStaff) : [];

  return (
    <>
      <StayForm disabled={hotel.status === 'inactive'} />
      {searchError && <Alert>{searchError}</Alert>}
      {searching && <Spinner label="Ищем номера" />}
      {offers &&
        !searching &&
        (items.length === 0 ? (
          <Empty>
            На эти даты нет номеров для {stay.guests} {plural(stay.guests, 'гостя', 'гостей', 'гостей')}
          </Empty>
        ) : (
          <section className="stack" aria-label="Свободные номера">
            {items.map((o) => {
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
                        <div className="muted">
                          {formatMoney(o.price_per_night)} × {nights}{' '}
                          {plural(nights, 'ночь', 'ночи', 'ночей')}
                        </div>
                      </div>
                      {authed && role === 'customer' ? (
                        <Button
                          variant="primary"
                          disabled={o.free < 1}
                          onClick={() => select({ offer: o, hotelName: hotel.name, ...stay })}
                        >
                          Забронировать
                        </Button>
                      ) : !authed ? (
                        <Link className="neu-btn" to="/login" state={{ from: `/hotels/${hotel.id}` }}>
                          Войти, чтобы забронировать
                        </Link>
                      ) : (
                        <span className="muted">Бронируют только клиенты</span>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </section>
        ))}
      <BookingModal />
    </>
  );
}
