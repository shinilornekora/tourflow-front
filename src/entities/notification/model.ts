// Уведомления: лента и счётчик непрочитанных. Отметки «прочитано» делает фича
// notifications-mark-read и сообщает сюда событиями notificationRead / allRead.
import { createEvent, createStore, sample } from 'effector';
import { api } from '@/shared/api/endpoints';
import type { Notification } from '@/shared/api/types';
import { createRequest } from '@/shared/lib/request';
import { sessionLost, sessionReceived } from '@/entities/session';

export const notificationsRequested = createEvent();
export const unreadRequested = createEvent();
/** Тик опроса бейджа (раз в 30 с, см. виджет sidebar и docs/API.md бэкенда). */
export const pollTick = createEvent();
export const notificationRead = createEvent<string>();
export const allRead = createEvent();

export const listQuery = createRequest((_: void) => api.notifications({ page: 1 }));
export const unreadQuery = createRequest((_: void) => api.unreadCount());

const now = () => new Date().toISOString();

export const $items = createStore<Notification[]>([])
  .on(listQuery.fx.doneData, (_, d) => d.items)
  .on(notificationRead, (l, id) => l.map((n) => (n.id === id ? { ...n, read_at: now() } : n)))
  .on(allRead, (l) => l.map((n) => ({ ...n, read_at: n.read_at ?? now() })))
  .reset(sessionLost);

export const $unread = createStore(0)
  .on(unreadQuery.fx.doneData, (_, d) => d.unread)
  .on(notificationRead, (n) => Math.max(0, n - 1))
  .on(allRead, () => 0)
  .reset(sessionLost);

sample({ clock: notificationsRequested, target: listQuery.start });
sample({
  clock: [unreadRequested, sessionReceived, pollTick],
  fn: () => undefined,
  target: unreadQuery.start,
});
