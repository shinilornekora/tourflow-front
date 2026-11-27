import { sample } from 'effector';
import { api } from '@/shared/api/endpoints';
import type { Role } from '@/shared/api/types';
import { createRequest } from '@/shared/lib/request';
import { userChanged } from '@/entities/user';

export const changeRole = createRequest(({ id, role }: { id: string; role: Role }) =>
  api.changeRole(id, role),
);
sample({ clock: changeRole.fx.doneData, target: userChanged });
