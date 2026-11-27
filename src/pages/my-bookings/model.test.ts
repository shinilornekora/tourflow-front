import { describe, expect, it } from 'vitest';
import { allSettled, fork } from 'effector';
import { tokenStorage } from '@/shared/api/client';
import { reservation } from '@/test/fixtures';
import * as m from './model';

describe('кабинет клиента: заказы', () => {
  it('делит брони на предстоящие и историю', () => {
    const { active, history } = m.__test.split(
      [
        reservation({ id: 'late', check_in: '2026-12-20', check_out: '2026-12-22' }),
        reservation({ id: 'soon', check_in: '2026-12-01', check_out: '2026-12-03' }),
        reservation({ id: 'past', check_in: '2026-10-01', check_out: '2026-10-03' }),
        reservation({ id: 'cancelled', check_in: '2026-12-05', check_out: '2026-12-06', status: 'cancelled' }),
      ],
      '2026-11-27',
    );
    expect(active.map((r) => r.id)).toEqual(['soon', 'late']);
    expect(history.map((r) => r.id)).toEqual(['cancelled', 'past']);
  });

  it('отмена переносит бронь в историю', async () => {
    tokenStorage.set('token-u-cust');
    const scope = fork();
    await allSettled(m.MyBookingsGate.open, { scope });
    expect(scope.getState(m.$split).active.map((r) => r.id)).toEqual(['r-1']);
    await allSettled(m.cancelClicked, { scope, params: scope.getState(m.$split).active[0]! });
    await allSettled(m.cancelConfirmed, { scope, params: 'Планы поменялись' });
    expect(scope.getState(m.$split).active).toHaveLength(0);
    expect(scope.getState(m.$split).history.find((r) => r.id === 'r-1')?.cancel_reason).toBe('Планы поменялись');
    expect(scope.getState(m.$toCancel)).toBeNull();
  });
});
