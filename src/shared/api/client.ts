// HTTP-клиент к gateway (/api). Хранит access-токен в памяти (не в localStorage:
// XSS не унесёт его «на потом»), refresh-токен лежит в HttpOnly-cookie.
//
// Если сервер ответил 401, клиент один раз вызывает /auth/refresh и повторяет
// запрос. Параллельные запросы ждут ОДИН общий refresh: повторное предъявление
// уже отозванного refresh-токена сервер принял бы за кражу и снёс бы сессию.
import type { ApiErrorBody, Session } from './types';

export const API_BASE = '/api';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly fields: Record<string, string> = {},
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type Listener = (s: Session | null) => void;

let accessToken: string | null = null;
let refreshing: Promise<Session | null> | null = null;
const listeners = new Set<Listener>();

export const tokenStorage = {
  get: () => accessToken,
  set: (t: string | null) => {
    accessToken = t;
  },
};

/** Подписка на тихое обновление/потерю сессии (нужно модели session). */
export function onSessionChange(l: Listener): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

function url(path: string, query?: Record<string, unknown>): string {
  const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
  const u = new URL(API_BASE + path, base);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null || v === '' || v === false) continue;
      u.searchParams.set(k, String(v));
    }
  }
  return u.toString();
}

async function refreshSession(): Promise<Session | null> {
  try {
    const res = await fetch(url('/auth/refresh'), { method: 'POST', credentials: 'same-origin' });
    if (!res.ok) return null;
    return (await res.json()) as Session;
  } catch {
    return null;
  }
}

/** Один refresh на всё приложение в каждый момент времени. */
export function refreshOnce(): Promise<Session | null> {
  if (!refreshing) {
    refreshing = refreshSession()
      .then((s) => {
        accessToken = s?.access_token ?? null;
        listeners.forEach((l) => l(s));
        return s;
      })
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, unknown>;
  headers?: Record<string, string>;
}

async function toError(res: Response): Promise<ApiError> {
  let body: Partial<ApiErrorBody> | undefined;
  try {
    body = (await res.json()) as Partial<ApiErrorBody>;
  } catch {
    body = undefined;
  }
  if (body?.error) return new ApiError(res.status, body.error.code, body.error.message, body.error.fields);
  return new ApiError(res.status, 'unknown', `Ошибка запроса (${res.status})`);
}

async function send(path: string, opts: RequestOptions): Promise<Response> {
  const headers: Record<string, string> = { Accept: 'application/json', ...opts.headers };
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  try {
    return await fetch(url(path, opts.query), {
      method: opts.method ?? 'GET',
      headers,
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
      credentials: 'same-origin',
    });
  } catch {
    throw new ApiError(0, 'network', 'Нет связи с сервером');
  }
}

export async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const hadToken = accessToken !== null;
  let res = await send(path, opts);
  if (res.status === 401 && hadToken && !path.startsWith('/auth/')) {
    const s = await refreshOnce();
    if (s) res = await send(path, opts);
  }
  if (!res.ok) throw await toError(res);
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

/** Для тестов: сбросить состояние клиента между кейсами. */
export function __resetClient() {
  accessToken = null;
  refreshing = null;
  listeners.clear();
}
