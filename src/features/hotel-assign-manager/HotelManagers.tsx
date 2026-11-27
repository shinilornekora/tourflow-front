import { useEffect, useState } from 'react';
import { useUnit } from 'effector-react';
import type { Hotel } from '@/shared/api/types';
import { managersQuery } from '@/entities/user';
import { Button, Card, Empty, Select } from '@/shared/ui';
import { assignManager, removeManager } from './model';

export function HotelManagers({ hotel }: { hotel: Hotel }) {
  const [users, loadUsers, assign, remove] = useUnit([
    managersQuery.$data,
    managersQuery.start,
    assignManager.start,
    removeManager.start,
  ]);
  const [pick, setPick] = useState('');
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);
  const ids = hotel.manager_ids ?? [];
  const all = users?.items ?? [];
  const name = (id: string) => all.find((u) => u.id === id)?.full_name ?? id;
  const candidates = all.filter((u) => !ids.includes(u.id));

  return (
    <Card>
      <h2>Менеджеры отеля</h2>
      <div className="stack">
        {ids.length === 0 && <Empty>Менеджеры не назначены</Empty>}
        {ids.map((id) => (
          <div key={id} className="neu-inset row-between">
            <span>{name(id)}</span>
            <Button small variant="danger" onClick={() => remove({ hotelId: hotel.id, userId: id })}>
              Снять
            </Button>
          </div>
        ))}
        <div className="row" style={{ alignItems: 'end' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <Select
              label="Назначить менеджера"
              value={pick}
              onChange={(e) => setPick(e.target.value)}
              options={[
                { value: '', label: 'Выберите пользователя' },
                ...candidates.map((u) => ({ value: u.id, label: `${u.full_name} (${u.email})` })),
              ]}
            />
          </div>
          <Button
            variant="primary"
            disabled={!pick}
            onClick={() => {
              assign({ hotelId: hotel.id, userId: pick });
              setPick('');
            }}
          >
            Назначить
          </Button>
        </div>
      </div>
    </Card>
  );
}
