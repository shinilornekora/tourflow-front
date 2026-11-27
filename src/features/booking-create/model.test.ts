import { describe, expect, it } from 'vitest';
import { allSettled, fork } from 'effector';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/setup';
import { tokenStorage } from '@/shared/api/client';
import { reservation } from '@/test/fixtures';
import { $committed } from '@/entities/reservation';
import * as m from './model';

const selection: m.Selection = {
  offer: {
    room_type_id: 'rt-std',
    name: 'Стандарт',
    capacity: 2,
    total_rooms: 5,
    free: 5,
    price_per_night: { amount: 1, currency: 'RUB' },
    total_price: { amount: 2, currency: 'RUB' },
  },
  hotelName: 'Морской бриз',
  check_in: '2099-03-01',
  check_out: '2099-03-03',
  guests: 2,
};

describe('фича: бронирование', () => {
  it('повтор подтверждения после сбоя идёт с тем же ключом идемпотентности', async () => {
    const keys: (string | null)[] = [];
    let fail = true;
    server.use(
      http.post('*/api/reservations', ({ request }) => {
        keys.push(request.headers.get('Idempotency-Key'));
        if (fail) {
          fail = false;
          return HttpResponse.json(
            { error: { code: 'unavailable', message: 'Сервис недоступен' } },
            { status: 503 },
          );
        }
        return HttpResponse.json(reservation({ id: 'r-new' }));
      }),
    );
    tokenStorage.set('token-u-cust');
    const scope = fork();
    await allSettled(m.offerSelected, { scope, params: selection });
    await allSettled(m.bookingConfirmed, { scope });
    expect(scope.getState(m.bookRequest.$error)).toBe('Сервис недоступен');
    await allSettled(m.bookingConfirmed, { scope });
    expect(scope.getState(m.$booked)?.id).toBe('r-new');
    expect(keys).toHaveLength(2);
    expect(keys[0]).toBeTruthy();
    expect(keys[0]).toBe(keys[1]);
    // ответ команды сохранён для слияния с моделью чтения
    expect(scope.getState($committed)['r-new']).toBeDefined();
  });

  it('новый выбор номера даёт новый ключ', async () => {
    const scope = fork();
    await allSettled(m.offerSelected, { scope, params: selection });
    const first = scope.getState(m.$bookingKey);
    await allSettled(m.offerSelected, { scope, params: selection });
    expect(scope.getState(m.$bookingKey)).not.toBe(first);
  });
});
