import { useUnit } from 'effector-react';
import type { Hotel } from '@/shared/api/types';
import { Button } from '@/shared/ui';
import { setStatus } from './model';

export function ToggleStatusButton({ hotel }: { hotel: Hotel }) {
  const toggle = useUnit(setStatus.start);
  const active = hotel.status === 'active';
  return (
    <Button
      small
      variant={active ? 'danger' : 'primary'}
      onClick={() => {
        if (
          active &&
          !window.confirm('Отключить отель? Все будущие брони будут отменены, гости получат уведомления.')
        )
          return;
        toggle({ id: hotel.id, status: active ? 'inactive' : 'active', version: hotel.version });
      }}
    >
      {active ? 'Отключить' : 'Включить'}
    </Button>
  );
}
