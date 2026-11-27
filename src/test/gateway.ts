// Фейковый gateway TourFlow на MSW: in-memory состояние и обработчики,
// повторяющие контракты бэкенда (см. tourflow/backend/internal/*/api).
import { http, HttpResponse } from 'msw';
import type { Hotel, Notification, Reservation, RoomType, Session, User } from '@/shared/api/types';
import { hotel, notification, reservation, roomType, users } from './fixtures';

type DbUser = User & { password: string };

export interface Db {
  users: DbUser[];
  hotels: Hotel[];
  roomTypes: RoomType[];
  reservations: Reservation[];
  notifications: Notification[];
  /** refresh-cookie: id пользователя, чья сессия «в браузере». */
  refreshUser: string | null;
  idempotency: Map<string, Reservation>;
  seq: number;
}

export function createDb(): Db {
  return {
    users: Object.values(users).map((u) => ({ ...u })),
    hotels: [hotel(), hotel({ id: 'h-mount', name: 'Горный приют', city: 'Красная Поляна', address: 'Эстонская, 12', stars: 3, manager_ids: [], min_price: { amount: 350000, currency: 'RUB' } })],
    roomTypes: [roomType(), roomType({ id: 'rt-mount', hotel_id: 'h-mount', name: 'Шале', capacity: 4, price: { amount: 350000, currency: 'RUB' } })],
    reservations: [
      reservation(),
      reservation({ id: 'r-old', check_in: '2024-01-10', check_out: '2024-01-12', nights: 2, total: { amount: 1000000, currency: 'RUB' } }),
      reservation({ id: 'r-cancel', check_in: '2099-08-01', check_out: '2099-08-02', nights: 1, status: 'cancelled', cancel_reason: 'Передумал' }),
    ],
    notifications: [notification()],
    refreshUser: null,
    idempotency: new Map(),
    seq: 100,
  };
}

export let db = createDb();
export function resetDb() {
  db = createDb();
}

const API = '*/api';
const token = (u: User) => `token-${u.id}`;
const session = (u: DbUser): Session => {
  const { password: _p, ...user } = u;
  return { access_token: token(u), expires_at: '2099-01-01T00:00:00Z', user };
};
const err = (status: number, code: string, message: string, fields?: Record<string, string>) =>
  HttpResponse.json({ error: { code, message, fields } }, { status });

function auth(req: Request): DbUser | null {
  const h = req.headers.get('Authorization');
  return db.users.find((u) => h === `Bearer ${token(u)}`) ?? null;
}

function withUser(req: Request, roles: string[] | null, fn: (u: DbUser) => Response | Promise<Response>) {
  const u = auth(req);
  if (!u) return err(401, 'unauthorized', 'Требуется вход');
  if (roles && !roles.includes(u.role)) return err(403, 'forbidden', 'Недостаточно прав');
  return fn(u);
}

const strip = ({ password: _p, ...u }: DbUser): User => u;
const paged = <T,>(items: T[]) => ({ items, page: 1, page_size: items.length, total: items.length });
const id = (p: string) => `${p}-${++db.seq}`;

const hotelView = (h: Hotel): Hotel => {
  const rts = db.roomTypes.filter((r) => r.hotel_id === h.id && r.status === 'active');
  const min = rts.reduce<number | null>((m, r) => (m === null || r.price.amount < m ? r.price.amount : m), null);
  return { ...h, room_type_count: rts.length, min_price: min === null ? undefined : { amount: min, currency: 'RUB' } };
};

export const handlers = [
  // ---------- identity ----------
  http.post(`${API}/auth/login`, async ({ request }) => {
    const { email, password } = (await request.json()) as { email: string; password: string };
    const u = db.users.find((x) => x.email === email && x.password === password);
    if (!u) return err(401, 'invalid_credentials', 'Неверный email или пароль');
    db.refreshUser = u.id;
    return HttpResponse.json(session(u));
  }),
  http.post(`${API}/auth/register`, async ({ request }) => {
    const b = (await request.json()) as { email: string; password: string; full_name: string; phone: string };
    if (db.users.some((u) => u.email === b.email)) return err(409, 'conflict', 'Email уже занят', { email: 'Этот email уже зарегистрирован' });
    const u: DbUser = { id: id('u'), email: b.email, full_name: b.full_name, phone: b.phone, role: 'customer', created_at: new Date().toISOString(), version: 1, password: b.password };
    db.users.push(u);
    db.refreshUser = u.id;
    return HttpResponse.json(session(u), { status: 201 });
  }),
  http.post(`${API}/auth/refresh`, () => {
    const u = db.users.find((x) => x.id === db.refreshUser);
    return u ? HttpResponse.json(session(u)) : err(401, 'unauthorized', 'Сессия истекла');
  }),
  http.post(`${API}/auth/logout`, () => {
    db.refreshUser = null;
    return new HttpResponse(null, { status: 204 });
  }),
  http.get(`${API}/users/me`, ({ request }) => withUser(request, null, (u) => HttpResponse.json(strip(u)))),
  http.patch(`${API}/users/me`, ({ request }) =>
    withUser(request, null, async (u) => {
      const b = (await request.json()) as { full_name: string; phone: string };
      Object.assign(u, b, { version: u.version + 1 });
      return HttpResponse.json(strip(u));
    }),
  ),
  http.get(`${API}/users`, ({ request }) =>
    withUser(request, ['admin'], () => {
      const p = new URL(request.url).searchParams;
      const role = p.get('role');
      const q = (p.get('q') ?? '').toLowerCase();
      const items = db.users.filter((u) => (!role || u.role === role) && (!q || `${u.full_name} ${u.email}`.toLowerCase().includes(q)));
      return HttpResponse.json(paged(items.map(strip)));
    }),
  ),
  http.patch(`${API}/users/:id/role`, ({ request, params }) =>
    withUser(request, ['admin'], async () => {
      const u = db.users.find((x) => x.id === params.id);
      if (!u) return err(404, 'not_found', 'Пользователь не найден');
      u.role = ((await request.json()) as { role: User['role'] }).role;
      return HttpResponse.json(strip(u));
    }),
  ),

  // ---------- catalog ----------
  http.get(`${API}/cities`, () => HttpResponse.json({ items: [...new Set(db.hotels.map((h) => h.city))].sort() })),
  http.get(`${API}/hotels/managed`, ({ request }) =>
    withUser(request, ['hotel_manager', 'admin'], (u) =>
      HttpResponse.json(paged(db.hotels.filter((h) => u.role === 'admin' || h.manager_ids?.includes(u.id)).map(hotelView))),
    ),
  ),
  http.get(`${API}/hotels`, ({ request }) => {
    const p = new URL(request.url).searchParams;
    const q = (p.get('q') ?? '').toLowerCase();
    const city = p.get('city');
    const stars = Number(p.get('stars_min') ?? 0);
    const items = db.hotels
      .filter((h) => h.status === 'active')
      .filter((h) => (!q || h.name.toLowerCase().includes(q)) && (!city || h.city === city) && h.stars >= stars)
      .map(hotelView);
    return HttpResponse.json(paged(items));
  }),
  http.get(`${API}/hotels/:id`, ({ params }) => {
    const h = db.hotels.find((x) => x.id === params.id);
    if (!h) return err(404, 'not_found', 'Отель не найден');
    return HttpResponse.json({ hotel: hotelView(h), room_types: db.roomTypes.filter((r) => r.hotel_id === h.id) });
  }),
  http.post(`${API}/hotels`, ({ request }) =>
    withUser(request, ['admin'], async () => {
      const b = (await request.json()) as Hotel;
      if (!b.name) return err(422, 'validation', 'Проверьте поля', { name: 'Обязательное поле' });
      const h: Hotel = { ...b, id: id('h'), status: 'active', manager_ids: [], created_at: '', updated_at: '', version: 1 };
      db.hotels.push(h);
      return HttpResponse.json(h, { status: 201 });
    }),
  ),
  http.put(`${API}/hotels/:id`, ({ request, params }) =>
    withUser(request, ['admin', 'hotel_manager'], async () => {
      const h = db.hotels.find((x) => x.id === params.id);
      if (!h) return err(404, 'not_found', 'Отель не найден');
      const b = (await request.json()) as Hotel;
      if (b.version !== h.version) return err(409, 'version_conflict', 'Данные изменились, обновите страницу');
      Object.assign(h, b, { version: h.version + 1 });
      return HttpResponse.json(hotelView(h));
    }),
  ),
  http.patch(`${API}/hotels/:id/status`, ({ request, params }) =>
    withUser(request, ['admin', 'hotel_manager'], async () => {
      const h = db.hotels.find((x) => x.id === params.id)!;
      h.status = ((await request.json()) as { status: Hotel['status'] }).status;
      h.version++;
      return HttpResponse.json(hotelView(h));
    }),
  ),
  http.post(`${API}/hotels/:id/managers`, ({ request, params }) =>
    withUser(request, ['admin'], async () => {
      const h = db.hotels.find((x) => x.id === params.id)!;
      const { user_id } = (await request.json()) as { user_id: string };
      h.manager_ids = [...(h.manager_ids ?? []), user_id];
      return HttpResponse.json(hotelView(h));
    }),
  ),
  http.delete(`${API}/hotels/:id/managers/:uid`, ({ request, params }) =>
    withUser(request, ['admin'], () => {
      const h = db.hotels.find((x) => x.id === params.id)!;
      h.manager_ids = (h.manager_ids ?? []).filter((x) => x !== params.uid);
      return HttpResponse.json(hotelView(h));
    }),
  ),
  http.post(`${API}/hotels/:id/room-types`, ({ request, params }) =>
    withUser(request, ['admin', 'hotel_manager'], async () => {
      const b = (await request.json()) as RoomType;
      const rt: RoomType = { ...b, id: id('rt'), hotel_id: String(params.id), status: 'active', version: 1 };
      db.roomTypes.push(rt);
      return HttpResponse.json(rt, { status: 201 });
    }),
  ),
  http.put(`${API}/room-types/:id`, ({ request, params }) =>
    withUser(request, ['admin', 'hotel_manager'], async () => {
      const rt = db.roomTypes.find((x) => x.id === params.id)!;
      Object.assign(rt, await request.json(), { version: rt.version + 1 });
      return HttpResponse.json(rt);
    }),
  ),
  http.patch(`${API}/room-types/:id/status`, ({ request, params }) =>
    withUser(request, ['admin', 'hotel_manager'], async () => {
      const rt = db.roomTypes.find((x) => x.id === params.id)!;
      rt.status = ((await request.json()) as { status: RoomType['status'] }).status;
      rt.version++;
      return HttpResponse.json(rt);
    }),
  ),

  // ---------- booking ----------
  http.get(`${API}/availability`, ({ request }) => {
    const p = new URL(request.url).searchParams;
    const guests = Number(p.get('guests'));
    const nights = Math.round((Date.parse(p.get('check_out')!) - Date.parse(p.get('check_in')!)) / 86_400_000);
    const items = db.roomTypes
      .filter((r) => r.hotel_id === p.get('hotel_id') && r.status === 'active' && r.capacity >= guests)
      .map((r) => {
        const busy = db.reservations.filter((x) => x.room_type_id === r.id && x.status === 'confirmed' && x.check_in < p.get('check_out')! && x.check_out > p.get('check_in')!).length;
        return { room_type_id: r.id, name: r.name, capacity: r.capacity, total_rooms: r.total_rooms, free: Math.max(0, r.total_rooms - busy), price_per_night: r.price, total_price: { amount: r.price.amount * nights, currency: 'RUB' } };
      });
    return HttpResponse.json({ items });
  }),
  http.post(`${API}/reservations`, ({ request }) =>
    withUser(request, ['customer'], async (u) => {
      const key = request.headers.get('Idempotency-Key');
      if (!key) return err(400, 'bad_request', 'Нет ключа идемпотентности');
      const prev = db.idempotency.get(key);
      if (prev) return HttpResponse.json(prev);
      const b = (await request.json()) as { room_type_id: string; check_in: string; check_out: string; guests: number };
      const rt = db.roomTypes.find((r) => r.id === b.room_type_id)!;
      const h = db.hotels.find((x) => x.id === rt.hotel_id)!;
      const nights = Math.round((Date.parse(b.check_out) - Date.parse(b.check_in)) / 86_400_000);
      const r: Reservation = { id: id('r'), hotel_id: h.id, hotel_name: h.name, room_type_name: rt.name, customer_id: u.id, ...b, nights, status: 'confirmed', total: { amount: rt.price.amount * nights, currency: 'RUB' }, created_at: new Date().toISOString(), version: 1 };
      db.reservations.push(r);
      db.idempotency.set(key, r);
      db.notifications.unshift(notification({ id: id('n'), title: 'Бронь подтверждена', body: `${h.name}, ${rt.name}`, reservation_id: r.id }));
      return HttpResponse.json(r, { status: 201 });
    }),
  ),
  http.get(`${API}/reservations/my`, ({ request }) =>
    withUser(request, null, (u) => HttpResponse.json(paged(db.reservations.filter((r) => r.customer_id === u.id)))),
  ),
  http.get(`${API}/reservations`, ({ request }) =>
    withUser(request, ['hotel_manager', 'admin'], (u) => {
      const p = new URL(request.url).searchParams;
      const allowed = db.hotels.filter((h) => u.role === 'admin' || h.manager_ids?.includes(u.id)).map((h) => h.id);
      const items = db.reservations.filter(
        (r) => allowed.includes(r.hotel_id) && (!p.get('hotel_id') || r.hotel_id === p.get('hotel_id')) && (!p.get('status') || r.status === p.get('status')),
      );
      return HttpResponse.json(paged(items));
    }),
  ),
  http.post(`${API}/reservations/:id/cancel`, ({ request, params }) =>
    withUser(request, null, async () => {
      const r = db.reservations.find((x) => x.id === params.id);
      if (!r) return err(404, 'not_found', 'Бронь не найдена');
      if (r.status === 'cancelled') return err(409, 'already_cancelled', 'Бронь уже отменена');
      const { reason } = (await request.json()) as { reason: string };
      Object.assign(r, { status: 'cancelled', cancel_reason: reason || undefined, cancelled_at: new Date().toISOString(), version: r.version + 1 });
      return HttpResponse.json(r);
    }),
  ),

  // ---------- notification ----------
  http.get(`${API}/notifications/unread-count`, ({ request }) =>
    withUser(request, null, () => HttpResponse.json({ unread: db.notifications.filter((n) => !n.read_at).length })),
  ),
  http.get(`${API}/notifications`, ({ request }) => withUser(request, null, () => HttpResponse.json(paged(db.notifications)))),
  http.post(`${API}/notifications/read-all`, ({ request }) =>
    withUser(request, null, () => {
      const marked = db.notifications.filter((n) => !n.read_at).length;
      db.notifications.forEach((n) => (n.read_at ??= new Date().toISOString()));
      return HttpResponse.json({ marked });
    }),
  ),
  http.post(`${API}/notifications/:id/read`, ({ request, params }) =>
    withUser(request, null, () => {
      const n = db.notifications.find((x) => x.id === params.id);
      if (n) n.read_at = new Date().toISOString();
      return new HttpResponse(null, { status: 204 });
    }),
  ),
];
