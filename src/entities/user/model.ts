// Пользователи (раздел админа) и менеджеры отелей для назначения.
import { createEvent, createStore, sample } from 'effector';
import { api } from '@/shared/api/endpoints';
import type { Role, User } from '@/shared/api/types';
import { createRequest } from '@/shared/lib/request';

export interface UsersFilter {
  q: string;
  role: Role | '';
}

export const usersRequested = createEvent<UsersFilter>();
export const userChanged = createEvent<User>();

export const usersQuery = createRequest((p: UsersFilter) => api.users({ ...p, page: 1 }));
export const managersQuery = createRequest((_: void) => api.users({ role: 'hotel_manager' }));

export const $users = createStore<User[]>([])
  .on(usersQuery.fx.doneData, (_, d) => d.items)
  .on(userChanged, (l, u) => l.map((x) => (x.id === u.id ? u : x)));

sample({ clock: usersRequested, target: usersQuery.start });
