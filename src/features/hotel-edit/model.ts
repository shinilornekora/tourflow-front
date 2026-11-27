// Создание и редактирование отеля.
import { sample } from 'effector';
import { api } from '@/shared/api/endpoints';
import type { HotelInput } from '@/shared/api/types';
import { createRequest } from '@/shared/lib/request';
import { hotelUpdated } from '@/entities/hotel';

export const saveHotel = createRequest(({ id, body }: { id: string | null; body: HotelInput }) =>
  id ? api.updateHotel(id, body) : api.createHotel(body),
);

sample({ clock: saveHotel.fx.doneData, target: hotelUpdated });
