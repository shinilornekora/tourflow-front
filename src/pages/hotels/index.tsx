import { useGate, useUnit } from 'effector-react';
import type { FormEvent } from 'react';
import { HotelCard } from '@/entities/hotel/HotelCard';
import { Alert, Button, Card, Empty, Select, Spinner, TextField } from '@/shared/ui';
import { plural } from '@/shared/lib/format';
import * as m from './model';

export default function HotelsPage() {
  useGate(m.HotelsGate);
  const [filters, hotels, total, page, pending, error, cities] = useUnit([
    m.$filters,
    m.$hotels,
    m.$total,
    m.$page,
    m.hotelsQuery.$pending,
    m.hotelsQuery.$error,
    m.citiesQuery.$data,
  ]);
  const [change, submit, reset, goPage] = useUnit([m.filterChanged, m.searchSubmitted, m.filtersReset, m.pageChanged]);
  const pages = Math.max(1, Math.ceil(total / m.PAGE_SIZE));

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    submit();
  };

  return (
    <div className="page stack">
      <div>
        <h1>Найдите отель для поездки</h1>
        <p className="muted">Выберите город, даты уточните на странице отеля.</p>
      </div>
      <Card>
        <form onSubmit={onSubmit} className="form-grid" aria-label="Поиск отелей">
          <TextField label="Название" value={filters.q} onChange={(e) => change({ q: e.target.value })} placeholder="Например, Морской" />
          <Select
            label="Город"
            value={filters.city}
            onChange={(e) => change({ city: e.target.value })}
            options={[{ value: '', label: 'Любой' }, ...(cities?.items ?? []).map((c) => ({ value: c, label: c }))]}
          />
          <Select
            label="Звёзд от"
            value={String(filters.stars_min)}
            onChange={(e) => change({ stars_min: Number(e.target.value) })}
            options={[{ value: '0', label: 'Любое' }, ...[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: `${n}+` }))]}
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
            <Button type="submit" variant="primary">Найти</Button>
            <Button onClick={() => reset()}>Сбросить</Button>
          </div>
        </form>
      </Card>

      {error && <Alert>{error}</Alert>}
      {pending && hotels.length === 0 ? (
        <Spinner />
      ) : hotels.length === 0 ? (
        <Empty>По вашему запросу отелей не нашлось</Empty>
      ) : (
        <>
          <p className="muted">
            Найдено {total} {plural(total, 'отель', 'отеля', 'отелей')}
          </p>
          <div className="grid">
            {hotels.map((h) => (
              <HotelCard key={h.id} hotel={h} to={`/hotels/${h.id}`} />
            ))}
          </div>
          {pages > 1 && (
            <div className="row" style={{ justifyContent: 'center' }}>
              <Button disabled={page <= 1} onClick={() => goPage(page - 1)}>Назад</Button>
              <span className="muted">
                {page} из {pages}
              </span>
              <Button disabled={page >= pages} onClick={() => goPage(page + 1)}>Вперёд</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
