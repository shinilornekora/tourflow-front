// Архивирование типа номера: архивный тип не продаётся, существующие брони сохраняются.
import { sample } from 'effector';
import { api } from '@/shared/api/endpoints';
import type { RoomStatus } from '@/shared/api/types';
import { createRequest } from '@/shared/lib/request';
import { roomTypeUpdated } from '@/entities/hotel';

export const setRoomStatus = createRequest(
  ({ id, status, version }: { id: string; status: RoomStatus; version: number }) =>
    api.setRoomStatus(id, status, version),
);

sample({ clock: setRoomStatus.fx.doneData, target: roomTypeUpdated });
