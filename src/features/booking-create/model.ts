// Бронирование выбранного номера.
import { createEvent, createStore, sample } from 'effector';
import { api } from '@/shared/api/endpoints';
import type { Availability, Reservation } from '@/shared/api/types';
import { createRequest } from '@/shared/lib/request';
import { newKey } from '@/shared/lib/id';
import { reservationCommitted } from '@/entities/reservation';

export interface Selection {
  offer: Availability;
  hotelName: string;
  check_in: string;
  check_out: string;
  guests: number;
}

export const offerSelected = createEvent<Selection>();
export const bookingClosed = createEvent();
export const bookingConfirmed = createEvent();

export const bookRequest = createRequest(api.book);

export const $selected = createStore<Selection | null>(null)
  .on(offerSelected, (_, s) => s)
  .reset(bookingClosed);

/**
 * Ключ идемпотентности создаётся один раз на выбор предложения: двойной клик
 * или повтор после обрыва сети дадут ту же бронь, а не вторую.
 */
export const $bookingKey = createStore<string>('').on(offerSelected, () => newKey());

export const $booked = createStore<Reservation | null>(null)
  .on(bookRequest.fx.doneData, (_, r) => r)
  .reset([bookingClosed, offerSelected]);

sample({
  clock: bookingConfirmed,
  source: { sel: $selected, key: $bookingKey },
  filter: ({ sel }) => sel !== null,
  fn: ({ sel, key }) => ({
    key,
    room_type_id: sel!.offer.room_type_id,
    check_in: sel!.check_in,
    check_out: sel!.check_out,
    guests: sel!.guests,
  }),
  target: bookRequest.start,
});

sample({ clock: [bookingClosed, offerSelected], target: bookRequest.reset });

// Модель чтения узнает о брони позже — запоминаем ответ команды.
sample({ clock: bookRequest.fx.doneData, target: reservationCommitted });

export const bookingSucceeded = bookRequest.fx.done;
