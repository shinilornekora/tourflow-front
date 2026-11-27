import type { Money, ReservationStatus, Role } from '@/shared/api/types';
import { ApiError } from '@/shared/api/client';

const rub = new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 });

/** Деньги хранятся в копейках. */
export function formatMoney(m?: Money | null): string {
  if (!m) return '—';
  return rub.format(m.amount / 100);
}

const dateFmt = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
const dateTimeFmt = new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium', timeStyle: 'short' });

/** «2026-12-10» → «10 декабря 2026 г.» без сдвига часового пояса. */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return dateFmt.format(new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1));
}

export function formatDateTime(iso: string): string {
  return dateTimeFmt.format(new Date(iso));
}

/** Локальная дата ГГГГ-ММ-ДД со сдвигом на n дней от base. */
export function isoDay(offset = 0, base: Date = new Date()): string {
  const d = new Date(base);
  d.setDate(d.getDate() + offset);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export function nightsBetween(a: string, b: string): number {
  const ms = Date.parse(b) - Date.parse(a);
  return Number.isFinite(ms) ? Math.round(ms / 86_400_000) : 0;
}

export function plural(n: number, one: string, few: string, many: string): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}

export const roleLabel: Record<Role, string> = {
  customer: 'Клиент',
  hotel_manager: 'Менеджер отеля',
  admin: 'Администратор',
};

export const statusLabel: Record<ReservationStatus, string> = {
  confirmed: 'Подтверждена',
  cancelled: 'Отменена',
};

/** Бронь «в истории», если она отменена или дата выезда уже прошла. */
export function isPast(checkOut: string, today: string = isoDay()): boolean {
  return checkOut <= today;
}

export function errorMessage(e: unknown): string {
  if (e instanceof ApiError) return e.message;
  if (e instanceof Error) return e.message;
  return 'Неизвестная ошибка';
}

export function errorFields(e: unknown): Record<string, string> {
  return e instanceof ApiError ? e.fields : {};
}
