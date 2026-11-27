// Маленькая фабрика «запрос → данные/ошибка/загрузка» поверх эффекта Effector,
// чтобы страницы не дублировали одинаковые сторы.
import { createEffect, createEvent, createStore, sample, type Effect, type EventCallable, type Store } from 'effector';
import { errorMessage } from './format';

export interface Request<P, D> {
  fx: Effect<P, D>;
  start: EventCallable<P>;
  reset: EventCallable<void>;
  $data: Store<D | null>;
  $error: Store<string | null>;
  $pending: Store<boolean>;
}

export function createRequest<P = void, D = unknown>(handler: (p: P) => Promise<D>): Request<P, D> {
  const fx = createEffect<P, D>(handler);
  const start = createEvent<P>();
  const reset = createEvent();
  const $data = createStore<D | null>(null, { skipVoid: false })
    .on(fx.doneData, (_, d) => d)
    .reset(reset);
  const $error = createStore<string | null>(null)
    .on(fx, () => null)
    .on(fx.failData, (_, e) => errorMessage(e))
    .reset(reset);
  sample({ clock: start, target: fx });
  return { fx, start, reset, $data, $error, $pending: fx.pending };
}
