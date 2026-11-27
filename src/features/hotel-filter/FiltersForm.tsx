import type { FormEvent } from 'react';
import { useUnit } from 'effector-react';
import { Button, Card, Select, TextField } from '@/shared/ui';
import { $filters, filterChanged, filtersReset, searchSubmitted } from './model';

export function FiltersForm({ cities }: { cities: string[] }) {
  const [filters, change, submit, reset] = useUnit([$filters, filterChanged, searchSubmitted, filtersReset]);
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    submit();
  };
  return (
    <Card>
      <form onSubmit={onSubmit} className="form-grid" aria-label="Поиск отелей">
        <TextField
          label="Название"
          value={filters.q}
          onChange={(e) => change({ q: e.target.value })}
          placeholder="Например, Морской"
        />
        <Select
          label="Город"
          value={filters.city}
          onChange={(e) => change({ city: e.target.value })}
          options={[{ value: '', label: 'Любой' }, ...cities.map((c) => ({ value: c, label: c }))]}
        />
        <Select
          label="Звёзд от"
          value={String(filters.stars_min)}
          onChange={(e) => change({ stars_min: Number(e.target.value) })}
          options={[
            { value: '0', label: 'Любое' },
            ...[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: `${n}+` })),
          ]}
        />
        <Select
          label="Сортировка"
          value={filters.sort}
          onChange={(e) => change({ sort: e.target.value })}
          options={[
            { value: '', label: 'По названию' },
            { value: 'price', label: 'Сначала дешевле' },
            { value: '-price', label: 'Сначала дороже' },
            { value: '-stars', label: 'По звёздам' },
          ]}
        />
        <div className="row" style={{ alignSelf: 'end' }}>
          <Button type="submit" variant="primary">
            Найти
          </Button>
          <Button onClick={() => reset()}>Сбросить</Button>
        </div>
      </form>
    </Card>
  );
}
