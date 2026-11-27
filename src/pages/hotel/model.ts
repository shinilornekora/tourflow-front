import { createEvent, createStore, sample } from 'effector';
import { createGate } from 'effector-react';
import { api, type AvailabilityQuery } from '@/shared/api/endpoints';
import type { Availability, Reservation } from '@/shared/api/types';
import { createRequest } from '@/shared/lib/request';
import { isoDay, nightsBetween } from '@/shared/lib/format';
import { newKey } from '@/shared/lib/id';

export const HotelGate = createGate<{ id: string }>();

export interface Stay {
  check_in: string;
  check_out: string;
  guests: number;
}

export const stayChanged = createEvent<Partial<Stay>>();
export const searchSubmitted = createEvent();
export const offerSelected = createEvent<Availability>();
export const bookingClosed = createEvent();
export const bookingConfirmed = createEvent();

export const hotelQuery = createRequest((id: string) => api.hotel(id));
export const availabilityQuery = createRequest((q: AvailabilityQuery) => api.availability(q));
export const bookRequest = createRequest(api.book);

export const $hotelId = createStore<string | null>(null).on(HotelGate.open, (_, { id }) => id);

export const $stay = createStore<Stay>({ check_in: isoDay(7), check_out: isoDay(9), guests: 2 })
  .on(stayChanged, (s, p) => ({ ...s, ...p }));

/** Ошибка формы дат проверяется на клиенте до запроса. */
export const $stayError = $stay.map(({ check_in, check_out, guests }) => {
  if (!check_in || !check_out) return 'Укажите даты заезда и выезда';
  if (check_in < isoDay(0)) return 'Дата заезда уже прошла';
  if (nightsBetween(check_in, check_out) < 1) return 'Выезд должен быть позже заезда';
  if (guests < 1) return 'Укажите количество гостей';
  return null;
});

export const $selected = createStore<Availability | null>(null)
  .on(offerSelected, (_, o) => o)
  .reset([bookingClosed, HotelGate.close]);

/**
 * Ключ идемпотентности создаётся один раз на выбор предложения: двойной клик
 * или повтор после обрыва сети дадут ту же бронь, а не вторую.
 */
export const $bookingKey = createStore<string>('').on(offerSelected, () => newKey());

export const $booked = createStore<Reservation | null>(null)
  .on(bookRequest.fx.doneData, (_, r) => r)
  .reset([bookingClosed, offerSelected, HotelGate.close]);

sample({ clock: HotelGate.open, fn: ({ id }) => id, target: hotelQuery.start });
sample({ clock: HotelGate.open, target: [availabilityQuery.reset, bookRequest.reset] });

sample({
  clock: searchSubmitted,
  source: { id: $hotelId, stay: $stay, err: $stayError },
  filter: ({ id, err }) => id !== null && err === null,
  fn: ({ id, stay }): AvailabilityQuery => ({ hotel_id: id!, ...stay }),
  target: availabilityQuery.start,
});

sample({
  clock: bookingConfirmed,
  source: { offer: $selected, stay: $stay, key: $bookingKey },
  filter: ({ offer }) => offer !== null,
  fn: ({ offer, stay, key }) => ({ key, room_type_id: offer!.room_type_id, ...stay }),
  target: bookRequest.start,
});

sample({ clock: bookingClosed, target: bookRequest.reset });

// После брони остатки изменились — перезапрашиваем доступность.
sample({ clock: bookRequest.fx.done, target: searchSubmitted });
