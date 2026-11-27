import type { FormEvent } from 'react';
import { useUnit } from 'effector-react';
import { isoDay } from '@/shared/lib/format';
import { Button, Card, TextField } from '@/shared/ui';
import { $stay, $stayError, availabilityQuery, searchSubmitted, stayChanged } from './model';

export function StayForm({ disabled = false }: { disabled?: boolean }) {
  const [stay, stayError, searching, change, search] = useUnit([
    $stay,
    $stayError,
    availabilityQuery.$pending,
    stayChanged,
    searchSubmitted,
  ]);
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    search();
  };
  return (
    <Card>
      <h2>Проверить свободные номера</h2>
      <form className="form-grid" onSubmit={onSubmit} aria-label="Даты поездки">
        <TextField
          label="Заезд"
          type="date"
          min={isoDay(0)}
          value={stay.check_in}
          onChange={(e) => change({ check_in: e.target.value })}
        />
        <TextField
          label="Выезд"
          type="date"
          min={stay.check_in}
          value={stay.check_out}
          onChange={(e) => change({ check_out: e.target.value })}
        />
        <TextField
          label="Гостей"
          type="number"
          min={1}
          max={10}
          value={stay.guests}
          onChange={(e) => change({ guests: Number(e.target.value) })}
        />
        <div style={{ alignSelf: 'end' }}>
          <Button type="submit" variant="primary" disabled={Boolean(stayError) || searching || disabled}>
            Показать номера
          </Button>
        </div>
      </form>
      {stayError && (
        <p className="muted" style={{ marginTop: 12 }}>
          {stayError}
        </p>
      )}
    </Card>
  );
}
