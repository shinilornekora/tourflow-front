import { describe, expect, it } from 'vitest';
import { allSettled, fork } from 'effector';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/setup';
import {
  $filters,
  filterChanged,
  filtersReset,
  initialFilters,
  searchSubmitted,
} from '@/features/hotel-filter';
import * as m from './model';

describe('виджет: каталог отелей', () => {
  it('при открытии грузит отели и города', async () => {
    const scope = fork();
    await allSettled(m.CatalogGate.open, { scope });
    expect(scope.getState(m.$hotels).map((h) => h.name)).toEqual(['Морской бриз', 'Горный приют']);
    expect(scope.getState(m.$cities)).toEqual(['Красная Поляна', 'Сочи']);
  });

  it('передаёт фильтры в запрос и сбрасывает страницу на первую', async () => {
    const urls: URL[] = [];
    server.use(
      http.get('*/api/hotels', ({ request }) => {
        urls.push(new URL(request.url));
        return HttpResponse.json({ items: [], page: 1, page_size: 12, total: 30 });
      }),
    );
    const scope = fork();
    await allSettled(m.pageChanged, { scope, params: 3 });
    expect(urls.at(-1)!.searchParams.get('page')).toBe('3');
    await allSettled(filterChanged, { scope, params: { city: 'Сочи', stars_min: 4 } });
    await allSettled(searchSubmitted, { scope });
    const p = urls.at(-1)!.searchParams;
    expect(p.get('city')).toBe('Сочи');
    expect(p.get('stars_min')).toBe('4');
    expect(p.get('page')).toBe('1');
    expect(p.has('q')).toBe(false);
  });

  it('сброс фильтров возвращает начальные значения', async () => {
    const scope = fork();
    await allSettled(filterChanged, { scope, params: { q: 'море' } });
    await allSettled(filtersReset, { scope });
    expect(scope.getState($filters)).toEqual(initialFilters);
  });
});
