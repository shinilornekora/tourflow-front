import { createEvent, createStore } from 'effector';
import { loginFx } from '@/entities/session';
import { errorMessage } from '@/shared/lib/format';

export const loginFormReset = createEvent();

export const $loginError = createStore<string | null>(null)
  .on(loginFx, () => null)
  .on(loginFx.failData, (_, e) => errorMessage(e))
  .reset(loginFormReset);
