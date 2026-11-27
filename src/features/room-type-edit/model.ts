// Добавление и изменение типа номера.
import { createEvent, createStore, sample } from 'effector';
import { api } from '@/shared/api/endpoints';
import type { RoomTypeInput } from '@/shared/api/types';
import { createRequest } from '@/shared/lib/request';
import { roomTypeUpdated } from '@/entities/hotel';

export const roomEditorOpened = createEvent<string | null>(); // null — новый тип номера
export const roomEditorClosed = createEvent();

export const saveRoom = createRequest(
  ({ hotelId, id, body }: { hotelId: string; id: string | null; body: RoomTypeInput }) =>
    id ? api.updateRoomType(id, body) : api.createRoomType(hotelId, body),
);

export const $roomEditor = createStore<{ id: string | null } | null>(null)
  .on(roomEditorOpened, (_, id) => ({ id }))
  .reset([roomEditorClosed, saveRoom.fx.done]);

sample({ clock: roomEditorOpened, target: saveRoom.reset });
sample({ clock: saveRoom.fx.doneData, target: roomTypeUpdated });
