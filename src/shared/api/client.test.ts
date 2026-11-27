import { describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/setup';
import { ApiError, onSessionChange, request, tokenStorage } from './client';

describe('HTTP-клиент', () => {
  it('подставляет Bearer-токен и сериализует query без пустых значений', async () => {
    let seen: { auth: string | null; url: string } | null = null;
    server.use(
      http.get('*/api/echo', ({ request: r }) => {
        seen = { auth: r.headers.get('Authorization'), url: r.url };
        return HttpResponse.json({ ok: true });
      }),
    );
    tokenStorage.set('abc');
    await expect(request('/echo', { query: { a: 1, b: '', c: undefined, d: false, e: 'x' } })).resolves.toEqual({ ok: true });
    expect(seen!.auth).toBe('Bearer abc');
    expect(new URL(seen!.url).search).toBe('?a=1&e=x');
  });

  it('превращает ответ с ошибкой в ApiError с полями', async () => {
    server.use(
      http.post('*/api/fail', () =>
        HttpResponse.json({ error: { code: 'validation', message: 'Плохо', fields: { name: 'пусто' } } }, { status: 422 }),
      ),
    );
    const e = await request('/fail', { method: 'POST', body: {} }).catch((x: unknown) => x);
    expect(e).toBeInstanceOf(ApiError);
    expect(e).toMatchObject({ status: 422, code: 'validation', message: 'Плохо', fields: { name: 'пусто' } });
  });

  it('при 401 делает ОДИН refresh на все параллельные запросы и повторяет их', async () => {
    let refreshes = 0;
    const sessions: unknown[] = [];
    onSessionChange((s) => sessions.push(s?.access_token));
    server.use(
      http.post('*/api/auth/refresh', async () => {
        refreshes++;
        await new Promise((r) => setTimeout(r, 20));
        return HttpResponse.json({ access_token: 'fresh', expires_at: '', user: {} });
      }),
      http.get('*/api/protected', ({ request: r }) =>
        r.headers.get('Authorization') === 'Bearer fresh'
          ? HttpResponse.json({ ok: 1 })
          : HttpResponse.json({ error: { code: 'unauthorized', message: 'no' } }, { status: 401 }),
      ),
    );
    tokenStorage.set('stale');
    const results = await Promise.all([request('/protected'), request('/protected'), request('/protected')]);
    expect(results).toEqual([{ ok: 1 }, { ok: 1 }, { ok: 1 }]);
    expect(refreshes).toBe(1);
    expect(tokenStorage.get()).toBe('fresh');
    expect(sessions).toEqual(['fresh']);
  });

  it('если refresh не удался — отдаёт 401 и сообщает о потере сессии', async () => {
    const sessions: unknown[] = [];
    onSessionChange((s) => sessions.push(s));
    server.use(
      http.post('*/api/auth/refresh', () => new HttpResponse(null, { status: 401 })),
      http.get('*/api/protected', () => HttpResponse.json({ error: { code: 'unauthorized', message: 'Требуется вход' } }, { status: 401 })),
    );
    tokenStorage.set('stale');
    await expect(request('/protected')).rejects.toMatchObject({ status: 401 });
    expect(sessions).toEqual([null]);
    expect(tokenStorage.get()).toBeNull();
  });

  it('без токена не пытается обновлять сессию', async () => {
    let refreshes = 0;
    server.use(
      http.post('*/api/auth/refresh', () => {
        refreshes++;
        return new HttpResponse(null, { status: 401 });
      }),
      http.get('*/api/protected', () => new HttpResponse(null, { status: 401 })),
    );
    await expect(request('/protected')).rejects.toMatchObject({ status: 401, code: 'unknown' });
    expect(refreshes).toBe(0);
  });

  it('сетевую ошибку отдаёт как ApiError(network)', async () => {
    server.use(http.get('*/api/down', () => HttpResponse.error()));
    await expect(request('/down')).rejects.toMatchObject({ code: 'network', message: 'Нет связи с сервером' });
  });

  it('204 возвращает undefined', async () => {
    server.use(http.post('*/api/empty', () => new HttpResponse(null, { status: 204 })));
    await expect(request('/empty', { method: 'POST' })).resolves.toBeUndefined();
  });
});
