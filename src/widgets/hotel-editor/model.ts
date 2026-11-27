// Последняя ошибка любого действия в редакторе отеля (статус, архив, менеджеры).
import { createEvent, createStore } from 'effector';
import { setStatus } from '@/features/hotel-toggle-status';
import { setRoomStatus } from '@/features/room-type-archive';
import { assignManager, removeManager } from '@/features/hotel-assign-manager';

export const editorReset = createEvent();

export const $actionError = createStore<string | null>(null)
  .on(
    [setStatus.$error, setRoomStatus.$error, assignManager.$error, removeManager.$error].map(
      (s) => s.updates,
    ),
    (_, e) => e,
  )
  .reset(editorReset);
