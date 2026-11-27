import { describe, expect, it } from 'vitest';
import { allSettled, fork } from 'effector';
import { tokenStorage } from '@/shared/api/client';
import { db } from '@/test/gateway';
import { $role, $status, $user, SESSION_HINT, appStarted, loginFx, logoutFx, registerFx } from './model';

describe('модель сессии', () => {
  it('гость без отметки о сессии сразу становится anonymous без запроса refresh', async () => {
    const scope = fork();
    await allSettled(appStarted, { scope });
    expect(scope.getState($status)).toBe('anonymous');
  });

  it('восстанавливает сессию по refresh-cookie', async () => {
    db.refreshUser = 'u-man';
    localStorage.setItem(SESSION_HINT, '1');
    const scope = fork();
    await allSettled(appStarted, { scope });
    expect(scope.getState($status)).toBe('authenticated');
    expect(scope.getState($role)).toBe('hotel_manager');
    expect(tokenStorage.get()).toBe('token-u-man');
  });

  it('просроченная cookie → anonymous и отметка снимается', async () => {
    localStorage.setItem(SESSION_HINT, '1');
    const scope = fork();
    await allSettled(appStarted, { scope });
    expect(scope.getState($status)).toBe('anonymous');
    expect(localStorage.getItem(SESSION_HINT)).toBeNull();
  });

  it('логин сохраняет пользователя и ставит отметку о сессии', async () => {
    const scope = fork();
    await allSettled(loginFx, { scope, params: { email: 'anna@example.com', password: 'password1' } });
    expect(scope.getState($user)?.full_name).toBe('Анна Клиентова');
    expect(localStorage.getItem(SESSION_HINT)).toBe('1');
  });

  it('неверный пароль оставляет пользователя гостем', async () => {
    const scope = fork({ values: [[$status, 'anonymous']] });
    const res = await allSettled(loginFx, { scope, params: { email: 'anna@example.com', password: 'nope' } });
    expect(res.status).toBe('fail');
    expect(scope.getState($status)).toBe('anonymous');
  });

  it('регистрация создаёт клиента', async () => {
    const scope = fork();
    await allSettled(registerFx, {
      scope,
      params: { email: 'new@example.com', password: 'password1', full_name: 'Новый', phone: '' },
    });
    expect(scope.getState($role)).toBe('customer');
  });

  it('выход очищает сессию даже при ошибке сервера', async () => {
    const scope = fork();
    await allSettled(loginFx, { scope, params: { email: 'root@example.com', password: 'password1' } });
    await allSettled(logoutFx, { scope });
    expect(scope.getState($status)).toBe('anonymous');
    expect(scope.getState($user)).toBeNull();
    expect(tokenStorage.get()).toBeNull();
  });
});
