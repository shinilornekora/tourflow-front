// Отмена брони менеджером или админом: до дня выезда, причина обязательна (её увидит гость).
import { createEvent, createStore, sample } from 'effector';
import { api } from '@/shared/api/endpoints';
import type { Reservation } from '@/shared/api/types';
import { createRequest } from '@/shared/lib/request';
import { reservationCommitted } from '@/entities/reservation';

export const cancelClicked = createEvent<Reservation>();
export const cancelDismissed = createEvent();
export const cancelConfirmed = createEvent<string>();

export const cancelRequest = createRequest(({ id, reason }: { id: string; reason: string }) =>
  api.cancelReservation(id, reason),
);

export const $toCancel = createStore<Reservation | null>(null)
  .on(cancelClicked, (_, r) => r)
  .reset([cancelDismissed, cancelRequest.fx.done]);

sample({
  clock: cancelConfirmed,
  source: $toCancel,
  filter: (r, reason) => r !== null && reason.trim() !== '',
  fn: (r, reason) => ({ id: r!.id, reason: reason.trim() }),
  target: cancelRequest.start,
});
sample({ clock: [cancelDismissed, cancelClicked], target: cancelRequest.reset });
// Ответ команды — источник правды, пока модель чтения не догнала.
sample({ clock: cancelRequest.fx.doneData, target: reservationCommitted });

export const cancelSucceeded = cancelRequest.fx.done;
