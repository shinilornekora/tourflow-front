// Бизнес-правила брони (совпадают с проверками сервиса booking).
import type { Reservation } from '@/shared/api/types';
import { isPast, isoDay } from '@/shared/lib/format';

/** Клиент может отменить бронь только до дня заезда. */
export function canCustomerCancel(r: Reservation, today: string = isoDay()): boolean {
  return r.status === 'confirmed' && r.check_in > today;
}

/** Менеджер и админ могут отменить бронь до дня выезда. */
export function canStaffCancel(r: Reservation, today: string = isoDay()): boolean {
  return r.status === 'confirmed' && r.check_out > today;
}

/** Делит брони на предстоящие (по дате заезда) и историю (новые сверху). */
export function splitByTime(list: Reservation[], today: string = isoDay()) {
  const active: Reservation[] = [];
  const history: Reservation[] = [];
  for (const r of list) {
    if (r.status === 'confirmed' && !isPast(r.check_out, today)) active.push(r);
    else history.push(r);
  }
  active.sort((a, b) => a.check_in.localeCompare(b.check_in));
  history.sort((a, b) => b.check_in.localeCompare(a.check_in));
  return { active, history };
}
