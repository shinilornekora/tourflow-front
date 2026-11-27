import { sample } from 'effector';
import { api } from '@/shared/api/endpoints';
import { createRequest } from '@/shared/lib/request';
import { allRead, notificationRead } from '@/entities/notification';

export const markRead = createRequest((id: string) => api.markRead(id).then(() => id));
export const markAllRead = createRequest((_: void) => api.markAllRead());

sample({ clock: markRead.fx.doneData, target: notificationRead });
sample({ clock: markAllRead.fx.done, target: allRead });
