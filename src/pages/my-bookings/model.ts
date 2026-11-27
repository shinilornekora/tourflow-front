import { combine, createEvent, createStore, sample } from 'effector';
import { createGate } from 'effector-react';
import { api } from '@/shared/api/endpoints';
import type { Reservation } from '@/shared/api/types';
import { createRequest } from '@/shared/lib/request';
import { isPast, isoDay } from '@/shared/lib/format';

export type Tab = 'active' | 'history';

export const MyBookingsGate = createGate<void>();
export const tabChanged = createEvent<Tab>();
export const cancelClicked = createEvent<Reservation>();
export const cancelDismissed = createEvent();
export const cancelConfirmed = createEvent<string>();

export const $tab = createStore<Tab>('active').on(tabChanged, (_, t) => t);

export const listQuery = createRequest((_: void) => api.myReservations({ page_size: 100 }));
export const cancelRequest = createRequest(({ id, reason }: { id: string; reason: string }) => api.cancelReservation(id, reason));

export const $reservations = createStore<Reservation[]>([])
  .on(listQuery.fx.doneData, (_, d) => d.items)
  .on(cancelRequest.fx.doneData, (list, r) => list.map((x) => (x.id === r.id ? r : x)));

export const $toCancel = createStore<Reservation | null>(null)
  .on(cancelClicked, (_, r) => r)
  .reset([cancelDismissed, cancelRequest.fx.done]);

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

sample({ clock: MyBookingsGate.open, target: listQuery.start });
sample({
  clock: cancelConfirmed,
  source: $toCancel,
  filter: Boolean,
  fn: (r, reason) => ({ id: r.id, reason }),
  target: cancelRequest.start,
});
sample({ clock: [cancelDismissed, cancelClicked], target: cancelRequest.reset });

export const __test = { split };
