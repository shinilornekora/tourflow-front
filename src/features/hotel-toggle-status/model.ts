// Включение и отключение отеля (только админ). Отключение отменяет будущие брони.
import { sample } from 'effector';
import { api } from '@/shared/api/endpoints';
import type { HotelStatus } from '@/shared/api/types';
import { createRequest } from '@/shared/lib/request';
import { hotelUpdated } from '@/entities/hotel';

export const setStatus = createRequest(
  ({ id, status, version }: { id: string; status: HotelStatus; version: number }) =>
    api.setHotelStatus(id, status, version),
);

sample({ clock: setStatus.fx.doneData, target: hotelUpdated });
