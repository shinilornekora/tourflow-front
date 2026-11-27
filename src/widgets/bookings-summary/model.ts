// Сводки из booking-query. После отмены перечитываем их в фоне — модель чтения догонит.
import { createStore, sample } from 'effector';
import { api } from '@/shared/api/endpoints';
import { createRequest } from '@/shared/lib/request';
import { cancelSucceeded as customerCancelled } from '@/features/booking-cancel';
import { cancelSucceeded as staffCancelled } from '@/features/booking-cancel-by-staff';

export const customerSummaryQuery = createRequest((_: void) => api.mySummary());
export const hotelSummaryQuery = createRequest((hotelId: string) => api.hotelSummary({ hotel_id: hotelId }));

const $hotelId = createStore('').on(hotelSummaryQuery.start, (_, id) => id);

sample({ clock: customerCancelled, fn: () => undefined, target: customerSummaryQuery.start });
sample({
  clock: staffCancelled,
  source: $hotelId,
  target: hotelSummaryQuery.start,
});
