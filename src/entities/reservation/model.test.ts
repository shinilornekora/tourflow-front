import { describe, expect, it } from 'vitest';
import { reservation } from '@/test/fixtures';
import { mergeCommitted, newer } from './model';

describe('слияние ответов команд с моделью чтения', () => {
  it('берёт запись с большей версией', () => {
    const confirmed = reservation({ version: 1 });
    const cancelled = reservation({ version: 2, status: 'cancelled' });
    expect(newer(cancelled, confirmed)).toBe(cancelled);
    expect(newer(confirmed, cancelled)).toBe(cancelled);
    expect(newer(undefined, confirmed)).toBe(confirmed);
  });

  it('отменённая командой бронь не «воскресает» из устаревшего списка', () => {
    const stale = [reservation({ id: 'a', version: 1 })];
    const merged = mergeCommitted(stale, { a: reservation({ id: 'a', version: 2, status: 'cancelled' }) }, () => true);
    expect(merged.map((r) => r.status)).toEqual(['cancelled']);
  });

  it('новая бронь, которой ещё нет в модели чтения, добавляется в начало', () => {
    const merged = mergeCommitted([reservation({ id: 'old' })], { fresh: reservation({ id: 'fresh' }) }, () => true);
    expect(merged.map((r) => r.id)).toEqual(['fresh', 'old']);
  });

  it('чужие для списка брони не добавляются', () => {
    const merged = mergeCommitted([], { x: reservation({ id: 'x', hotel_id: 'other' }) }, (r) => r.hotel_id === 'h-sea');
    expect(merged).toEqual([]);
  });
});
