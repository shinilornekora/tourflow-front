import { useGate, useUnit } from 'effector-react';
import { HotelCard } from '@/entities/hotel';
import { FiltersForm } from '@/features/hotel-filter';
import { plural } from '@/shared/lib/format';
import { Alert, Button, Empty, Spinner } from '@/shared/ui';
import * as m from './model';

export function HotelCatalog() {
  useGate(m.CatalogGate);
  const [hotels, total, page, pending, error, cities, goPage] = useUnit([
    m.$hotels,
    m.$total,
    m.$page,
    m.hotelsQuery.$pending,
    m.hotelsQuery.$error,
    m.$cities,
    m.pageChanged,
  ]);
  const pages = Math.max(1, Math.ceil(total / m.PAGE_SIZE));

  return (
    <>
      <FiltersForm cities={cities} />
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
              <Button disabled={page <= 1} onClick={() => goPage(page - 1)}>
                Назад
              </Button>
              <span className="muted">
                {page} из {pages}
              </span>
              <Button disabled={page >= pages} onClick={() => goPage(page + 1)}>
                Вперёд
              </Button>
            </div>
          )}
        </>
      )}
    </>
  );
}
