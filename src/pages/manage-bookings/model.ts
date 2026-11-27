import { combine, createEvent, createStore, sample } from 'effector';
import { api, fetchAll, type ReservationQuery } from '@/shared/api/endpoints';
import type { Reservation } from '@/shared/api/types';
import { createRequest } from '@/shared/lib/request';
import { isoDay } from '@/shared/lib/format';
import { $committed, mergeCommitted, reservationCommitted } from '@/entities/reservation/model';

export const filtersApplied = createEvent<ReservationQuery>();
export const cancelClicked = createEvent<Reservation>();
export const cancelDismissed = createEvent();
export const cancelConfirmed = createEvent<string>();

export const listQuery = createRequest((q: ReservationQuery) =>
  fetchAll((page, page_size) => api.hotelReservations({ ...q, page, page_size })),
);
export const summaryQuery = createRequest((q: ReservationQuery) =>
  api.hotelSummary({ hotel_id: q.hotel_id }),
);
export const cancelRequest = createRequest(({ id, reason }: { id: string; reason: string }) =>
  api.cancelReservation(id, reason),
);

const $filters = createStore<ReservationQuery>({}).on(filtersApplied, (_, f) => f);
const $fromServer = createStore<Reservation[]>([]).on(listQuery.fx.doneData, (_, d) => d.items);

/** Отменённое менеджером сразу видно отменённым, даже если модель чтения ещё не догнала. */
export const $list = combine($fromServer, $committed, $filters, (list, committed, f) =>
  mergeCommitted(list, committed, () => false).filter((r) => !f.status || r.status === f.status),
);

export const $toCancel = createStore<Reservation | null>(null)
  .on(cancelClicked, (_, r) => r)
  .reset([cancelDismissed, cancelRequest.fx.done]);

/** Менеджер и админ могут отменить бронь до дня выезда. */
export function canStaffCancel(r: Reservation, today: string = isoDay()): boolean {
  return r.status === 'confirmed' && r.check_out > today;
}

sample({ clock: filtersApplied, target: [listQuery.start, summaryQuery.start] });
sample({
  clock: cancelConfirmed,
  source: $toCancel,
  filter: (r, reason) => r !== null && reason.trim() !== '',
  fn: (r, reason) => ({ id: r!.id, reason: reason.trim() }),
  target: cancelRequest.start,
});
sample({ clock: [cancelDismissed, cancelClicked], target: cancelRequest.reset });
sample({ clock: cancelRequest.fx.doneData, target: reservationCommitted });
sample({ clock: cancelRequest.fx.done, source: $filters, target: summaryQuery.start });
