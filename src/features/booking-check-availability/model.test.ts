import { describe, expect, it } from 'vitest';
import { allSettled, fork } from 'effector';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/setup';
import * as m from './model';

describe('фича: проверка свободных номеров', () => {
  it('валидирует даты до запроса', async () => {
    const scope = fork();
    await allSettled(m.stayChanged, { scope, params: { check_in: '2099-01-10', check_out: '2099-01-10' } });
    expect(scope.getState(m.$stayError)).toBe('Выезд должен быть позже заезда');
    await allSettled(m.stayChanged, { scope, params: { check_in: '2000-01-01', check_out: '2000-01-05' } });
    expect(scope.getState(m.$stayError)).toBe('Дата заезда уже прошла');
    await allSettled(m.stayChanged, {
      scope,
      params: { check_in: '2099-01-10', check_out: '2099-01-12', guests: 0 },
    });
    expect(scope.getState(m.$stayError)).toBe('Укажите количество гостей');
  });

  it('ищет номера в открытом отеле', async () => {
    const scope = fork();
    await allSettled(m.hotelOpened, { scope, params: 'h-sea' });
    await allSettled(m.stayChanged, {
      scope,
      params: { check_in: '2099-03-01', check_out: '2099-03-03', guests: 2 },
    });
    await allSettled(m.searchSubmitted, { scope });
    const offers = scope.getState(m.availabilityQuery.$data)!.items;
    expect(offers).toHaveLength(1);
    expect(offers[0]!.total_price.amount).toBe(1_000_000);
  });

  it('не шлёт поиск при ошибке в датах или без отеля', async () => {
    let calls = 0;
    server.use(http.get('*/api/availability', () => (calls++, HttpResponse.json({ items: [] }))));
    const scope = fork();
    await allSettled(m.searchSubmitted, { scope });
    await allSettled(m.hotelOpened, { scope, params: 'h-sea' });
    await allSettled(m.stayChanged, { scope, params: { check_out: '2000-01-01' } });
    await allSettled(m.searchSubmitted, { scope });
    expect(calls).toBe(0);
  });
});
