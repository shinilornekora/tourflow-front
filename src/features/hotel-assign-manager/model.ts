// Назначение и снятие менеджеров отеля (только админ).
import { sample } from 'effector';
import { api } from '@/shared/api/endpoints';
import { createRequest } from '@/shared/lib/request';
import { hotelUpdated } from '@/entities/hotel';

export const assignManager = createRequest(({ hotelId, userId }: { hotelId: string; userId: string }) =>
  api.assignManager(hotelId, userId),
);
export const removeManager = createRequest(({ hotelId, userId }: { hotelId: string; userId: string }) =>
  api.removeManager(hotelId, userId),
);

sample({ clock: [assignManager.fx.doneData, removeManager.fx.doneData], target: hotelUpdated });
