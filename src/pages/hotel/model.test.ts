import { describe, expect, it } from 'vitest';
import { allSettled, fork } from 'effector';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/setup';
import { tokenStorage } from '@/shared/api/client';
import { reservation } from '@/test/fixtures';
import * as m from './model';

describe('модель страницы отеля', () => {
  it('валидирует даты до запроса', async () => {
    const scope = fork();
    await allSettled(m.stayChanged, { scope, params: { check_in: '2099-01-10', check_out: '2099-01-10' } });
    expect(scope.getState(m.$stayError)).toBe('Выезд должен быть позже заезда');
    await allSettled(m.stayChanged, { scope, params: { check_in: '2000-01-01', check_out: '2000-01-05' } });
    expect(scope.getState(m.$stayError)).toBe('Дата заезда уже прошла');
    await allSettled(m.stayChanged, { scope, params: { check_in: '2099-01-10', check_out: '2099-01-12', guests: 0 } });
    expect(scope.getState(m.$stayError)).toBe('Укажите количество гостей');
  });

  it('открытие страницы грузит отель, поиск — доступность', async () => {
    const scope = fork();
    await allSettled(m.HotelGate.open, { scope, params: { id: 'h-sea' } });
    expect(scope.getState(m.hotelQuery.$data)?.hotel.name).toBe('Морской бриз');
    await allSettled(m.stayChanged, { scope, params: { check_in: '2099-03-01', check_out: '2099-03-03', guests: 2 } });
    await allSettled(m.searchSubmitted, { scope });
    const offers = scope.getState(m.availabilityQuery.$data)!.items;
    expect(offers).toHaveLength(1);
    expect(offers[0]!.total_price.amount).toBe(1_000_000);
  });

  it('не шлёт поиск при ошибке в датах', async () => {
    let calls = 0;
    server.use(http.get('*/api/availability', () => (calls++, HttpResponse.json({ items: [] }))));
    const scope = fork();
    await allSettled(m.HotelGate.open, { scope, params: { id: 'h-sea' } });
    await allSettled(m.stayChanged, { scope, params: { check_out: '2000-01-01' } });
    await allSettled(m.searchSubmitted, { scope });
    expect(calls).toBe(0);
  });

  it('повтор подтверждения после сбоя идёт с тем же ключом идемпотентности', async () => {
    const keys: (string | null)[] = [];
    let fail = true;
    server.use(
      http.post('*/api/reservations', ({ request }) => {
        keys.push(request.headers.get('Idempotency-Key'));
        if (fail) {
          fail = false;
          return HttpResponse.json({ error: { code: 'unavailable', message: 'Сервис недоступен' } }, { status: 503 });
        }
        return HttpResponse.json(reservation({ id: 'r-new' }));
      }),
    );
    tokenStorage.set('token-u-cust');
    const scope = fork();
    await allSettled(m.HotelGate.open, { scope, params: { id: 'h-sea' } });
    await allSettled(m.offerSelected, {
      scope,
      params: { room_type_id: 'rt-std', name: 'Стандарт', capacity: 2, total_rooms: 5, free: 5, price_per_night: { amount: 1, currency: 'RUB' }, total_price: { amount: 2, currency: 'RUB' } },
    });
    await allSettled(m.bookingConfirmed, { scope });
    expect(scope.getState(m.bookRequest.$error)).toBe('Сервис недоступен');
    await allSettled(m.bookingConfirmed, { scope });
    expect(scope.getState(m.$booked)?.id).toBe('r-new');
    expect(keys).toHaveLength(2);
    expect(keys[0]).toBeTruthy();
    expect(keys[0]).toBe(keys[1]);
  });
});
