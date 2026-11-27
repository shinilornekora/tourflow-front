import { useUnit } from 'effector-react';
import type { RoomType } from '@/shared/api/types';
import { Button } from '@/shared/ui';
import { setRoomStatus } from './model';

export function ArchiveRoomTypeButton({ room }: { room: RoomType }) {
  const toggle = useUnit(setRoomStatus.start);
  return (
    <Button
      small
      onClick={() =>
        toggle({
          id: room.id,
          status: room.status === 'active' ? 'archived' : 'active',
          version: room.version,
        })
      }
    >
      {room.status === 'active' ? 'В архив' : 'Вернуть'}
    </Button>
  );
}
