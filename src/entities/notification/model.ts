// Счётчик непрочитанных уведомлений в шапке и сама лента.
import { createEvent, createStore, sample } from 'effector';
import { api } from '@/shared/api/endpoints';
import type { Notification } from '@/shared/api/types';
import { createRequest } from '@/shared/lib/request';
import { sessionLost, sessionReceived } from '@/entities/session/model';

export const notificationsRequested = createEvent();
export const unreadRequested = createEvent();

export const listQuery = createRequest((_: void) => api.notifications({ page: 1 }));
export const unreadQuery = createRequest((_: void) => api.unreadCount());
export const markRead = createRequest((id: string) => api.markRead(id).then(() => id));
export const markAllRead = createRequest((_: void) => api.markAllRead());

export const $items = createStore<Notification[]>([])
  .on(listQuery.fx.doneData, (_, d) => d.items)
  .on(markRead.fx.doneData, (l, id) => l.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)))
  .on(markAllRead.fx.done, (l) => l.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })))
  .reset(sessionLost);

export const $unread = createStore(0)
  .on(unreadQuery.fx.doneData, (_, d) => d.unread)
  .on(markRead.fx.done, (n) => Math.max(0, n - 1))
  .on(markAllRead.fx.done, () => 0)
  .reset(sessionLost);

sample({ clock: notificationsRequested, target: listQuery.start });
sample({ clock: [unreadRequested, sessionReceived], fn: () => undefined, target: unreadQuery.start });

/** Тик опроса бейджа в шапке (раз в 30 с, см. Layout и docs/API.md бэкенда). */
export const pollTick = createEvent();
sample({ clock: pollTick, fn: () => undefined, target: unreadQuery.start });
