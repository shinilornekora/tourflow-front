import { createEffect, sample } from 'effector';
import { userUpdated } from '@/entities/session';
import { api } from '@/shared/api/endpoints';

export const updateMeFx = createEffect(api.updateMe);
sample({ clock: updateMeFx.doneData, target: userUpdated });
