import { createEvent, createStore } from 'effector';
import { loginFx, registerFx } from '@/entities/session/model';
import { errorFields, errorMessage } from '@/shared/lib/format';

export const formReset = createEvent();

export const $authError = createStore<string | null>(null)
  .on([loginFx, registerFx], () => null)
  .on([loginFx.failData, registerFx.failData], (_, e) => errorMessage(e))
  .reset(formReset);

export const $fieldErrors = createStore<Record<string, string>>({})
  .on([loginFx, registerFx], () => ({}))
  .on([loginFx.failData, registerFx.failData], (_, e) => errorFields(e))
  .reset(formReset);

export const $pending = loginFx.pending;
export const $registerPending = registerFx.pending;
