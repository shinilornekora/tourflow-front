import { describe, expect, it } from 'vitest';
import { allSettled, fork } from 'effector';
import { ApiError } from '@/shared/api/client';
import { createRequest } from './request';

describe('createRequest', () => {
  it('хранит данные, ошибку и очищает ошибку при новом запуске', async () => {
    let ok = false;
    const r = createRequest(async (n: number) => {
      if (!ok) throw new ApiError(500, 'x', 'Упало');
      return n * 2;
    });
    const scope = fork();
    await allSettled(r.start, { scope, params: 1 });
    expect(scope.getState(r.$error)).toBe('Упало');
    expect(scope.getState(r.$data)).toBeNull();
    ok = true;
    await allSettled(r.start, { scope, params: 21 });
    expect(scope.getState(r.$error)).toBeNull();
    expect(scope.getState(r.$data)).toBe(42);
    await allSettled(r.reset, { scope });
    expect(scope.getState(r.$data)).toBeNull();
  });
});
