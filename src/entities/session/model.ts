// Сессия пользователя на Effector. Токен живёт в HTTP-клиенте (в памяти),
// здесь — статус и профиль. После перезагрузки сессия восстанавливается
// через POST /auth/refresh по HttpOnly-cookie.
import { combine, createEffect, createEvent, createStore, sample } from 'effector';
import { api } from '@/shared/api/endpoints';
import { refreshOnce } from '@/shared/api/client';
import type { Role, Session, User } from '@/shared/api/types';

export type AuthStatus = 'unknown' | 'authenticated' | 'anonymous';

export const SESSION_HINT = 'tf_had_session';

function setHint(on: boolean) {
  try {
    if (on) localStorage.setItem(SESSION_HINT, '1');
    else localStorage.removeItem(SESSION_HINT);
  } catch {
    /* приватный режим */
  }
}

function hasHint(): boolean {
  try {
    return localStorage.getItem(SESSION_HINT) !== null;
  } catch {
    return true;
  }
}

export const appStarted = createEvent();
export const sessionReceived = createEvent<Session>();
export const sessionLost = createEvent();
export const userUpdated = createEvent<User>();

export const restoreFx = createEffect(async (): Promise<Session | null> => {
  // Гостю не шлём заведомо лишний refresh с ответом 401.
  if (!hasHint()) return null;
  return refreshOnce();
});

export const loginFx = createEffect(api.login);
export const registerFx = createEffect(api.register);
export const logoutFx = createEffect(async () => {
  try {
    await api.logout();
  } catch {
    /* локально выходим в любом случае */
  }
});

export const $status = createStore<AuthStatus>('unknown');
export const $user = createStore<User | null>(null);
export const $role = $user.map((u): Role | null => u?.role ?? null);
export const $isAuthenticated = $status.map((s) => s === 'authenticated');
export const $session = combine({ status: $status, user: $user });

sample({ clock: appStarted, target: restoreFx });
sample({ clock: restoreFx.doneData, filter: Boolean, target: sessionReceived });
sample({ clock: restoreFx.doneData, filter: (s) => !s, target: sessionLost });
sample({ clock: restoreFx.fail, target: sessionLost });

sample({ clock: [loginFx.doneData, registerFx.doneData], target: sessionReceived });
sample({ clock: logoutFx.finally, target: sessionLost });

$status.on(sessionReceived, () => 'authenticated').on(sessionLost, () => 'anonymous');
$user
  .on(sessionReceived, (_, s) => s.user)
  .on(userUpdated, (_, u) => u)
  .reset(sessionLost);

const setHintFx = createEffect(setHint);
sample({ clock: sessionReceived, fn: () => true, target: setHintFx });
sample({ clock: sessionLost, fn: () => false, target: setHintFx });

export function hasRole(role: Role | null, allowed: readonly Role[]): boolean {
  return role !== null && allowed.includes(role);
}
