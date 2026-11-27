// Брони, которые мы сами только что создали или изменили командой.
//
// Списки броней отдаёт booking-query, а он узнаёт о брони из Kafka с задержкой.
// Поэтому ответ команды (POST /reservations, POST /cancel) — источник правды:
// кладём его сюда и при показе списка сливаем со свежим ответом модели чтения,
// выбирая запись с бóльшей version (1 — подтверждена, 2 — отменена).
import { createEvent, createStore } from 'effector';
import type { Reservation } from '@/shared/api/types';
import { sessionLost } from '@/entities/session';

export const reservationCommitted = createEvent<Reservation>();

export const $committed = createStore<Record<string, Reservation>>({})
  .on(reservationCommitted, (map, r) => ({ ...map, [r.id]: newer(map[r.id], r) }))
  .reset(sessionLost);

export function newer(a: Reservation | undefined, b: Reservation): Reservation {
  return a && a.version > b.version ? a : b;
}

/**
 * Сливает список из модели чтения с результатами команд.
 * include решает, относится ли «ещё не спроецированная» бронь к этому списку.
 */
export function mergeCommitted(
  list: Reservation[],
  committed: Record<string, Reservation>,
  include: (r: Reservation) => boolean,
): Reservation[] {
  const seen = new Set<string>();
  const out = list.map((r) => {
    seen.add(r.id);
    const c = committed[r.id];
    return c ? newer(c, r) : r;
  });
  for (const c of Object.values(committed)) if (!seen.has(c.id) && include(c)) out.unshift(c);
  return out;
}
