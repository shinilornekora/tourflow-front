// Брони отелей для менеджера и админа.
import { combine, createEvent, createStore, sample } from 'effector';
import { api, fetchAll, type ReservationQuery } from '@/shared/api/endpoints';
import type { Reservation } from '@/shared/api/types';
import { createRequest } from '@/shared/lib/request';
import { $committed, mergeCommitted } from '@/entities/reservation';

export const filtersApplied = createEvent<ReservationQuery>();

export const listQuery = createRequest((q: ReservationQuery) =>
  fetchAll((page, page_size) => api.hotelReservations({ ...q, page, page_size })),
);

const $filters = createStore<ReservationQuery>({}).on(filtersApplied, (_, f) => f);
const $fromServer = createStore<Reservation[]>([]).on(listQuery.fx.doneData, (_, d) => d.items);

/** Отменённое менеджером сразу видно отменённым, даже если модель чтения ещё не догнала. */
export const $list = combine($fromServer, $committed, $filters, (list, committed, f) =>
  mergeCommitted(list, committed, () => false).filter((r) => !f.status || r.status === f.status),
);

sample({ clock: filtersApplied, target: listQuery.start });
