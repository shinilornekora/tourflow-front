import { useUnit } from 'effector-react';
import { $unread } from '@/entities/notification';
import { Button } from '@/shared/ui';
import { markAllRead, markRead } from './model';

export function MarkReadButton({ id }: { id: string }) {
  const read = useUnit(markRead.start);
  return (
    <Button small onClick={() => read(id)}>
      Отметить прочитанным
    </Button>
  );
}

export function MarkAllReadButton() {
  const [unread, readAll] = useUnit([$unread, markAllRead.start]);
  return (
    <Button small disabled={unread === 0} onClick={() => readAll()}>
      Прочитать все
    </Button>
  );
}
