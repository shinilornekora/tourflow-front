import { combine, createEvent, createStore, sample } from 'effector';
import { createGate } from 'effector-react';
import { api, fetchAll } from '@/shared/api/endpoints';
import type { Reservation } from '@/shared/api/types';
import { createRequest } from '@/shared/lib/request';
import { isPast, isoDay } from '@/shared/lib/format';
import { $committed, mergeCommitted, reservationCommitted } from '@/entities/reservation/model';
import { $user } from '@/entities/session/model';

export type Tab = 'active' | 'history';

export const MyBookingsGate = createGate<void>();
export const tabChanged = createEvent<Tab>();
export const cancelClicked = createEvent<Reservation>();
export const cancelDismissed = createEvent();
export const cancelConfirmed = createEvent<string>();

export const $tab = createStore<Tab>('active').on(tabChanged, (_, t) => t);

export const listQuery = createRequest((_: void) =>
  fetchAll((page, page_size) => api.myReservations({ page, page_size })),
);
export const summaryQuery = createRequest((_: void) => api.mySummary());
export const cancelRequest = createRequest(({ id, reason }: { id: string; reason: string }) =>
  api.cancelReservation(id, reason),
);

const $fromServer = createStore<Reservation[]>([]).on(listQuery.fx.doneData, (_, d) => d.items);

/** Список из booking-query + ответы наших команд, которые модель чтения ещё не увидела. */
export const $reservations = combine($fromServer, $committed, $user, (list, committed, user) =>
  mergeCommitted(list, committed, (r) => r.customer_id === user?.id),
);

export const $toCancel = createStore<Reservation | null>(null)
  .on(cancelClicked, (_, r) => r)
  .reset([cancelDismissed, cancelRequest.fx.done]);

/** Клиент может отменить бронь только до дня заезда (правило booking). */
export function canCustomerCancel(r: Reservation, today: string = isoDay()): boolean {
  return r.status === 'confirmed' && r.check_in > today;
}

const split = (list: Reservation[], today: string) => {
  const active: Reservation[] = [];
  const history: Reservation[] = [];
  for (const r of list) {
    if (r.status === 'confirmed' && !isPast(r.check_out, today)) active.push(r);
    else history.push(r);
  }
  active.sort((a, b) => a.check_in.localeCompare(b.check_in));
  history.sort((a, b) => b.check_in.localeCompare(a.check_in));
  return { active, history };
};

export const $split = $reservations.map((l) => split(l, isoDay()));
export const $visible = combine($split, $tab, (s, t) => s[t]);

sample({ clock: MyBookingsGate.open, target: [listQuery.start, summaryQuery.start] });
sample({
  clock: cancelConfirmed,
  source: $toCancel,
  filter: Boolean,
  fn: (r, reason) => ({ id: r.id, reason }),
  target: cancelRequest.start,
});
sample({ clock: [cancelDismissed, cancelClicked], target: cancelRequest.reset });
sample({ clock: cancelRequest.fx.doneData, target: reservationCommitted });
// Сводку перечитываем в фоне: её считает модель чтения, она догонит.
sample({ clock: cancelRequest.fx.done, fn: () => undefined, target: summaryQuery.start });

export const __test = { split };
