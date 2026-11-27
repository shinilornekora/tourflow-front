import { createEvent, createStore } from 'effector';
import { registerFx } from '@/entities/session';
import { errorFields, errorMessage } from '@/shared/lib/format';

export const registerFormReset = createEvent();

export const $registerError = createStore<string | null>(null)
  .on(registerFx, () => null)
  .on(registerFx.failData, (_, e) => errorMessage(e))
  .reset(registerFormReset);

export const $registerFields = createStore<Record<string, string>>({})
  .on(registerFx, () => ({}))
  .on(registerFx.failData, (_, e) => errorFields(e))
  .reset(registerFormReset);
