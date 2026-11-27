import { describe, expect, it } from 'vitest';
import { allSettled, fork } from 'effector';
import { tokenStorage } from '@/shared/api/client';
import { $user } from '@/entities/session';
import { users } from '@/test/fixtures';
import { cancelClicked, cancelConfirmed, $toCancel } from '@/features/booking-cancel';
import * as m from './model';

describe('виджет: мои заказы', () => {
  it('отмена переносит бронь в историю', async () => {
    tokenStorage.set('token-u-cust');
    const scope = fork({ values: [[$user, users.customer]] });
    await allSettled(m.MyReservationsGate.open, { scope });
    expect(scope.getState(m.$split).active.map((r) => r.id)).toEqual(['r-1']);
    await allSettled(cancelClicked, { scope, params: scope.getState(m.$split).active[0]! });
    await allSettled(cancelConfirmed, { scope, params: 'Планы поменялись' });
    expect(scope.getState(m.$split).active).toHaveLength(0);
    expect(scope.getState(m.$split).history.find((r) => r.id === 'r-1')?.cancel_reason).toBe(
      'Планы поменялись',
    );
    expect(scope.getState($toCancel)).toBeNull();
  });
});
