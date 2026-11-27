// Демо-режим (GitHub Pages и `npm run dev:mock`): бэкенд эмулируется прямо в браузере
// через MSW — те же обработчики, что и в интеграционных тестах. Состояние «базы»
// сохраняется в localStorage, поэтому брони и вход переживают перезагрузку страницы.
import { createDb, db, handlers, project, replaceDb, type Db } from '@/test/gateway';
import { hotel, reservation, roomType } from '@/test/fixtures';
import { isoDay } from '@/shared/lib/format';

const STORAGE_KEY = 'tf_demo_db_v1';

export const demoAccounts = [
  { role: 'Клиент', email: 'anna@example.com', password: 'password1' },
  { role: 'Менеджер отеля', email: 'max@example.com', password: 'password1' },
  { role: 'Администратор', email: 'root@example.com', password: 'password1' },
] as const;

const photo = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=60`;

/** Демо-данные: больше отелей и брони с датами относительно сегодняшнего дня. */
export function demoDb(): Db {
  const d = createDb();
  d.hotels = [
    hotel({ photo_url: photo('photo-1566073771259-6a8506099945'), description: 'Отель на первой линии с собственным пляжем, бассейном и видом на море.' }),
    hotel({ id: 'h-mount', name: 'Горный приют', city: 'Красная Поляна', address: 'Эстонская, 12', stars: 3, manager_ids: [], photo_url: photo('photo-1520250497591-112f2f40a3f4'), description: 'Шале у подъёмников: зимой лыжи, летом горные тропы.' }),
    hotel({ id: 'h-neva', name: 'Невский двор', city: 'Санкт-Петербург', address: 'Невский проспект, 48', stars: 5, manager_ids: ['u-man'], photo_url: photo('photo-1551882547-ff40c63fe5fa'), description: 'Исторический особняк в центре, в пяти минутах от Эрмитажа.' }),
    hotel({ id: 'h-kazan', name: 'Казанка', city: 'Казань', address: 'Кремлёвская набережная, 3', stars: 4, manager_ids: [], photo_url: photo('photo-1582719508461-905c673771fd'), description: 'Современный отель на набережной с видом на Кремль.' }),
    hotel({ id: 'h-baikal', name: 'Байкальская волна', city: 'Листвянка', address: 'Горького, 85', stars: 3, manager_ids: [], photo_url: photo('photo-1571896349842-33c89424de2d'), description: 'Деревянный отель на берегу Байкала, баня и прогулки на катере.' }),
  ];
  d.roomTypes = [
    roomType(),
    roomType({ id: 'rt-sea-lux', name: 'Люкс с видом на море', capacity: 3, total_rooms: 2, price: { amount: 1200000, currency: 'RUB' }, amenities: ['Wi-Fi', 'Балкон', 'Мини-бар'] }),
    roomType({ id: 'rt-mount', hotel_id: 'h-mount', name: 'Шале', capacity: 4, total_rooms: 3, price: { amount: 350000, currency: 'RUB' }, amenities: ['Камин', 'Кухня'] }),
    roomType({ id: 'rt-neva', hotel_id: 'h-neva', name: 'Классический', capacity: 2, total_rooms: 10, price: { amount: 900000, currency: 'RUB' }, amenities: ['Wi-Fi', 'Завтрак'] }),
    roomType({ id: 'rt-neva-suite', hotel_id: 'h-neva', name: 'Сьют', capacity: 4, total_rooms: 2, price: { amount: 2500000, currency: 'RUB' }, amenities: ['Wi-Fi', 'Завтрак', 'Ванна'] }),
    roomType({ id: 'rt-kazan', hotel_id: 'h-kazan', name: 'Стандарт', capacity: 2, total_rooms: 8, price: { amount: 450000, currency: 'RUB' }, amenities: ['Wi-Fi'] }),
    roomType({ id: 'rt-baikal', hotel_id: 'h-baikal', name: 'Номер с видом на озеро', capacity: 2, total_rooms: 4, price: { amount: 550000, currency: 'RUB' }, amenities: ['Баня', 'Завтрак'] }),
  ];
  d.reservations = [
    reservation({ id: 'r-1', check_in: isoDay(14), check_out: isoDay(17) }),
    reservation({ id: 'r-2', hotel_id: 'h-neva', hotel_name: 'Невский двор', room_type_id: 'rt-neva', room_type_name: 'Классический', check_in: isoDay(-60), check_out: isoDay(-57), total: { amount: 2700000, currency: 'RUB' } }),
    reservation({ id: 'r-3', check_in: isoDay(-200), check_out: isoDay(-199), nights: 1, status: 'cancelled', cancel_reason: 'Передумал', version: 2, total: { amount: 500000, currency: 'RUB' } }),
  ];
  d.projected = structuredClone(d.reservations);
  return d;
}

function load(): Db | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Omit<Db, 'idempotency'> & { idempotency: [string, Db['reservations'][number]][] };
    return { ...parsed, idempotency: new Map(parsed.idempotency) };
  } catch {
    return null;
  }
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...db, idempotency: [...db.idempotency] }));
  } catch {
    /* приватный режим: демо просто не переживёт перезагрузку */
  }
}

/** Сбросить демо-данные к исходным. */
export function resetDemo() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  replaceDb(demoDb());
}

export async function startDemo() {
  replaceDb(load() ?? demoDb());
  project(); // за время перезагрузки проекция «догнала» запись
  const { setupWorker } = await import('msw/browser');
  const worker = setupWorker(...handlers);
  // Проекция booking-query в демо догоняет запись через 400 мс — как в жизни.
  db.projectionLag = true;
  worker.events.on('response:mocked', ({ request }) => {
    if (request.method !== 'GET') setTimeout(() => (project(), save()), 400);
    save();
  });
  await worker.start({
    onUnhandledRequest: 'bypass',
    quiet: true,
    serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js`, options: { scope: import.meta.env.BASE_URL } },
  });
}
