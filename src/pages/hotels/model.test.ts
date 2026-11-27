import { describe, expect, it } from 'vitest';
import { allSettled, fork } from 'effector';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/setup';
import * as m from './model';

describe('каталог отелей', () => {
  it('при открытии грузит отели и города', async () => {
    const scope = fork();
    await allSettled(m.HotelsGate.open, { scope });
    expect(scope.getState(m.$hotels).map((h) => h.name)).toEqual(['Морской бриз', 'Горный приют']);
    expect(scope.getState(m.citiesQuery.$data)?.items).toEqual(['Красная Поляна', 'Сочи']);
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
    await allSettled(m.filterChanged, { scope, params: { city: 'Сочи', stars_min: 4 } });
    await allSettled(m.searchSubmitted, { scope });
    const p = urls.at(-1)!.searchParams;
    expect(p.get('city')).toBe('Сочи');
    expect(p.get('stars_min')).toBe('4');
    expect(p.get('page')).toBe('1');
    expect(p.has('q')).toBe(false);
  });

  it('сброс фильтров возвращает начальные значения', async () => {
    const scope = fork();
    await allSettled(m.filterChanged, { scope, params: { q: 'море' } });
    await allSettled(m.filtersReset, { scope });
    expect(scope.getState(m.$filters)).toEqual(m.initialFilters);
  });
});
