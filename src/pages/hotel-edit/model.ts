import { createEvent, createStore, sample } from 'effector';
import { createGate } from 'effector-react';
import { api } from '@/shared/api/endpoints';
import type { HotelDetails, HotelInput, HotelStatus, RoomStatus, RoomTypeInput } from '@/shared/api/types';
import { createRequest } from '@/shared/lib/request';

export const HotelEditGate = createGate<{ id: string }>();

export const detailsQuery = createRequest((id: string) => api.hotel(id));
export const managersQuery = createRequest((_: void) => api.users({ role: 'hotel_manager' }));

export const saveHotel = createRequest(({ id, body }: { id: string | null; body: HotelInput }) =>
  id ? api.updateHotel(id, body) : api.createHotel(body),
);
export const setStatus = createRequest(
  ({ id, status, version }: { id: string; status: HotelStatus; version: number }) =>
    api.setHotelStatus(id, status, version),
);
export const saveRoom = createRequest(
  ({ hotelId, id, body }: { hotelId: string; id: string | null; body: RoomTypeInput }) =>
    id ? api.updateRoomType(id, body) : api.createRoomType(hotelId, body),
);
export const setRoomStatus = createRequest(
  ({ id, status, version }: { id: string; status: RoomStatus; version: number }) =>
    api.setRoomStatus(id, status, version),
);
export const assignManager = createRequest(({ hotelId, userId }: { hotelId: string; userId: string }) =>
  api.assignManager(hotelId, userId),
);
export const removeManager = createRequest(({ hotelId, userId }: { hotelId: string; userId: string }) =>
  api.removeManager(hotelId, userId),
);

export const roomEditorOpened = createEvent<string | null>(); // null — новый тип номера
export const roomEditorClosed = createEvent();

export const $roomEditor = createStore<{ id: string | null } | null>(null)
  .on(roomEditorOpened, (_, id) => ({ id }))
  .reset([roomEditorClosed, saveRoom.fx.done, HotelEditGate.close]);

export const $details = createStore<HotelDetails | null>(null)
  .on(detailsQuery.fx.doneData, (_, d) => d)
  .on(
    [saveHotel.fx.doneData, setStatus.fx.doneData, assignManager.fx.doneData, removeManager.fx.doneData],
    (d, hotel) => (d && d.hotel.id === hotel.id ? { ...d, hotel } : d),
  )
  .on([saveRoom.fx.doneData, setRoomStatus.fx.doneData], (d, rt) => {
    if (!d) return d;
    const exists = d.room_types.some((r) => r.id === rt.id);
    return {
      ...d,
      room_types: exists ? d.room_types.map((r) => (r.id === rt.id ? rt : r)) : [...d.room_types, rt],
    };
  })
  .reset(HotelEditGate.close);

/** Последняя ошибка любого действия на странице. */
export const $actionError = createStore<string | null>(null)
  .on(
    [
      saveHotel.$error,
      setStatus.$error,
      setRoomStatus.$error,
      assignManager.$error,
      removeManager.$error,
    ].map((s) => s.updates),
    (_, e) => e,
  )
  .reset(HotelEditGate.close);

sample({
  clock: HotelEditGate.open,
  filter: ({ id }) => id !== 'new',
  fn: ({ id }) => id,
  target: detailsQuery.start,
});
sample({ clock: HotelEditGate.open, target: [saveHotel.reset, saveRoom.reset] });
