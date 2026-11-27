import { describe, expect, it } from 'vitest';
import { reservation } from '@/test/fixtures';
import { canCustomerCancel, canStaffCancel, splitByTime } from './rules';

describe('правила брони', () => {
  it('делит брони на предстоящие и историю', () => {
    const { active, history } = splitByTime(
      [
        reservation({ id: 'late', check_in: '2026-12-20', check_out: '2026-12-22' }),
        reservation({ id: 'soon', check_in: '2026-12-01', check_out: '2026-12-03' }),
        reservation({ id: 'past', check_in: '2026-10-01', check_out: '2026-10-03' }),
        reservation({
          id: 'cancelled',
          check_in: '2026-12-05',
          check_out: '2026-12-06',
          status: 'cancelled',
        }),
      ],
      '2026-11-27',
    );
    expect(active.map((r) => r.id)).toEqual(['soon', 'late']);
    expect(history.map((r) => r.id)).toEqual(['cancelled', 'past']);
  });

  it('клиент отменяет до дня заезда, персонал — до дня выезда', () => {
    const now = reservation({ check_in: '2026-11-27', check_out: '2026-11-29' });
    expect(canCustomerCancel(now, '2026-11-27')).toBe(false);
    expect(canStaffCancel(now, '2026-11-27')).toBe(true);
    expect(canStaffCancel(now, '2026-11-29')).toBe(false);
    expect(canCustomerCancel(reservation({ check_in: '2026-11-28' }), '2026-11-27')).toBe(true);
    expect(canCustomerCancel(reservation({ status: 'cancelled' }), '2000-01-01')).toBe(false);
  });
});
