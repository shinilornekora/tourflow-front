// Отель как сущность: карточка с типами номеров и список «моих» отелей.
// Фичи (редактирование, статус, менеджеры, типы номеров) сообщают сюда о
// результатах через события hotelUpdated / roomTypeUpdated.
import { createEvent, createStore, sample } from 'effector';
import { api, fetchAll } from '@/shared/api/endpoints';
import type { Hotel, HotelDetails, RoomType } from '@/shared/api/types';
import { createRequest } from '@/shared/lib/request';

export const detailsRequested = createEvent<string>();
export const detailsReset = createEvent();
export const hotelUpdated = createEvent<Hotel>();
export const roomTypeUpdated = createEvent<RoomType>();

export const detailsQuery = createRequest((id: string) => api.hotel(id));

export const $details = createStore<HotelDetails | null>(null)
  .on(detailsQuery.fx.doneData, (_, d) => d)
  .on(hotelUpdated, (d, hotel) => (d && d.hotel.id === hotel.id ? { ...d, hotel } : d))
  .on(roomTypeUpdated, (d, rt) => {
    if (!d || d.hotel.id !== rt.hotel_id) return d;
    const exists = d.room_types.some((r) => r.id === rt.id);
    return {
      ...d,
      room_types: exists ? d.room_types.map((r) => (r.id === rt.id ? rt : r)) : [...d.room_types, rt],
    };
  })
  .reset(detailsReset);

sample({ clock: detailsRequested, target: detailsQuery.start });

/** Отели менеджера (для админа — все), включая отключённые. */
export const managedQuery = createRequest((_: void) =>
  fetchAll((page, page_size) => api.managedHotels({ include_inactive: true, page, page_size })),
);
