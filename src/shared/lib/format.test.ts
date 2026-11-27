import { describe, expect, it } from 'vitest';
import { ApiError } from '@/shared/api/client';
import { errorFields, errorMessage, formatDate, formatMoney, isPast, isoDay, nightsBetween, plural } from './format';

describe('format', () => {
  it('форматирует копейки в рубли без дробной части', () => {
    expect(formatMoney({ amount: 1_250_000, currency: 'RUB' }).replace(/\s/g, ' ')).toBe('12 500 ₽');
    expect(formatMoney(null)).toBe('—');
  });

  it('форматирует ISO-дату без сдвига часового пояса', () => {
    expect(formatDate('2026-12-10')).toBe('10 декабря 2026 г.');
    expect(formatDate('2026-01-01T23:59:00Z')).toBe('1 января 2026 г.');
  });

  it('считает ночи между датами', () => {
    expect(nightsBetween('2026-12-10', '2026-12-13')).toBe(3);
    expect(nightsBetween('2026-12-10', 'bad')).toBe(0);
  });

  it('isoDay сдвигает дату через границу месяца', () => {
    expect(isoDay(2, new Date(2026, 0, 30))).toBe('2026-02-01');
  });

  it.each([
    [1, 'ночь'],
    [2, 'ночи'],
    [5, 'ночей'],
    [11, 'ночей'],
    [21, 'ночь'],
    [24, 'ночи'],
  ])('plural(%i) → %s', (n, word) => {
    expect(plural(n, 'ночь', 'ночи', 'ночей')).toBe(word);
  });

  it('бронь в прошлом, если выезд не позже сегодняшнего дня', () => {
    expect(isPast('2026-01-01', '2026-01-01')).toBe(true);
    expect(isPast('2026-01-02', '2026-01-01')).toBe(false);
  });

  it('достаёт текст и поля ошибки API', () => {
    const e = new ApiError(422, 'validation', 'Проверьте поля', { email: 'занят' });
    expect(errorMessage(e)).toBe('Проверьте поля');
    expect(errorFields(e)).toEqual({ email: 'занят' });
    expect(errorMessage('x')).toBe('Неизвестная ошибка');
    expect(errorFields(new Error('x'))).toEqual({});
  });
});
