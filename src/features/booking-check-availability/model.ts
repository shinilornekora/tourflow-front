// Даты поездки и запрос свободных номеров в отеле.
import { createEvent, createStore, sample } from 'effector';
import { api, type AvailabilityQuery } from '@/shared/api/endpoints';
import { createRequest } from '@/shared/lib/request';
import { isoDay, nightsBetween } from '@/shared/lib/format';

export interface Stay {
  check_in: string;
  check_out: string;
  guests: number;
}

export const hotelOpened = createEvent<string>();
export const stayChanged = createEvent<Partial<Stay>>();
export const searchSubmitted = createEvent();

export const availabilityQuery = createRequest((q: AvailabilityQuery) => api.availability(q));

export const $hotelId = createStore<string | null>(null).on(hotelOpened, (_, id) => id);

export const $stay = createStore<Stay>({ check_in: isoDay(7), check_out: isoDay(9), guests: 2 }).on(
  stayChanged,
  (s, p) => ({ ...s, ...p }),
);

/** Ошибка формы дат проверяется на клиенте до запроса. */
export const $stayError = $stay.map(({ check_in, check_out, guests }) => {
  if (!check_in || !check_out) return 'Укажите даты заезда и выезда';
  if (check_in < isoDay(0)) return 'Дата заезда уже прошла';
  if (nightsBetween(check_in, check_out) < 1) return 'Выезд должен быть позже заезда';
  if (guests < 1) return 'Укажите количество гостей';
  return null;
});

sample({ clock: hotelOpened, target: availabilityQuery.reset });

sample({
  clock: searchSubmitted,
  source: { id: $hotelId, stay: $stay, err: $stayError },
  filter: ({ id, err }) => id !== null && err === null,
  fn: ({ id, stay }): AvailabilityQuery => ({ hotel_id: id!, ...stay }),
  target: availabilityQuery.start,
});
