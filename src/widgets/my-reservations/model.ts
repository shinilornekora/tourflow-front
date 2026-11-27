// Брони клиента: модель чтения + ответы команд, вкладки «Предстоящие» и «История».
import { combine, createEvent, createStore, sample } from 'effector';
import { createGate } from 'effector-react';
import { api, fetchAll } from '@/shared/api/endpoints';
import type { Reservation } from '@/shared/api/types';
import { createRequest } from '@/shared/lib/request';
import { $committed, mergeCommitted, splitByTime } from '@/entities/reservation';
import { $user } from '@/entities/session';

export type Tab = 'active' | 'history';

export const MyReservationsGate = createGate<void>();
export const tabChanged = createEvent<Tab>();

export const $tab = createStore<Tab>('active').on(tabChanged, (_, t) => t);

export const listQuery = createRequest((_: void) =>
  fetchAll((page, page_size) => api.myReservations({ page, page_size })),
);

const $fromServer = createStore<Reservation[]>([]).on(listQuery.fx.doneData, (_, d) => d.items);

/** Список из booking-query + ответы наших команд, которые модель чтения ещё не увидела. */
export const $reservations = combine($fromServer, $committed, $user, (list, committed, user) =>
  mergeCommitted(list, committed, (r) => r.customer_id === user?.id),
);

export const $split = $reservations.map((l) => splitByTime(l));
export const $visible = combine($split, $tab, (s, t) => s[t]);

sample({ clock: MyReservationsGate.open, target: listQuery.start });
