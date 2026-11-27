// Все REST-эндпоинты gateway. Пути совпадают с маршрутизацией
// tourflow/backend/cmd/gateway: identity, catalog, booking(+query), notification.
import { request, tokenStorage } from './client';
import type {
  AuditRecord,
  Availability,
  CustomerSummary,
  HotelSummary,
  Hotel,
  HotelDetails,
  HotelInput,
  HotelStatus,
  Notification,
  Paged,
  Reservation,
  ReservationStatus,
  Role,
  RoomStatus,
  RoomType,
  RoomTypeInput,
  Session,
  User,
} from './types';


export interface HotelQuery {
  q?: string;
  city?: string;
  stars_min?: number;
  guests?: number;
  price_max?: number;
  sort?: string;
  page?: number;
  page_size?: number;
  include_inactive?: boolean;
}

export interface ReservationQuery {
  hotel_id?: string;
  status?: ReservationStatus | '';
  from?: string;
  to?: string;
  page?: number;
  page_size?: number;
}

export interface AvailabilityQuery {
  hotel_id: string;
  check_in: string;
  check_out: string;
  guests: number;
}

export interface BookInput {
  key: string;
  room_type_id: string;
  check_in: string;
  check_out: string;
  guests: number;
}

/** Максимальный page_size у gateway для списков броней и отелей. */
export const MAX_PAGE_SIZE = 50;

/**
 * Забирает все страницы списка (по 50) — бэкенд молча режет page_size до 50.
 * maxPages страхует от бесконечного цикла, если total растёт на лету.
 */
export async function fetchAll<T>(load: (page: number, page_size: number) => Promise<Paged<T>>, maxPages = 20): Promise<Paged<T>> {
  const items: T[] = [];
  let total = 0;
  for (let page = 1; page <= maxPages; page++) {
    const res = await load(page, MAX_PAGE_SIZE);
    items.push(...res.items);
    total = res.total;
    if (res.items.length === 0 || items.length >= total) break;
  }
  return { items, page: 1, page_size: items.length, total };
}

const withSession = (s: Session) => {
  tokenStorage.set(s.access_token);
  return s;
};

export const api = {
  // ---------- identity ----------
  login: (body: { email: string; password: string }) =>
    request<Session>('/auth/login', { method: 'POST', body }).then(withSession),
  register: (body: { email: string; password: string; full_name: string; phone: string }) =>
    request<Session>('/auth/register', { method: 'POST', body }).then(withSession),
  logout: () =>
    request<void>('/auth/logout', { method: 'POST' }).finally(() => tokenStorage.set(null)),
  me: () => request<User>('/users/me'),
  updateMe: (body: { full_name: string; phone: string; version: number }) =>
    request<User>('/users/me', { method: 'PATCH', body }),
  changePassword: (body: { current_password: string; new_password: string }) =>
    request<void>('/users/me/password', { method: 'POST', body }),
  users: (query: { role?: Role | ''; q?: string; page?: number; page_size?: number }) =>
    request<Paged<User>>('/users', { query: { page_size: 100, ...query } }),
  changeRole: (id: string, role: Role) =>
    request<User>(`/users/${id}/role`, { method: 'PATCH', body: { role } }),

  // ---------- catalog ----------
  hotels: (query: HotelQuery) => request<Paged<Hotel>>('/hotels', { query: { ...query } }),
  managedHotels: (query: HotelQuery) => request<Paged<Hotel>>('/hotels/managed', { query: { ...query } }),
  cities: () => request<{ items: string[] }>('/cities'),
  hotel: (id: string) => request<HotelDetails>(`/hotels/${id}`),
  createHotel: (body: HotelInput) => request<Hotel>('/hotels', { method: 'POST', body }),
  updateHotel: (id: string, body: HotelInput) => request<Hotel>(`/hotels/${id}`, { method: 'PUT', body }),
  setHotelStatus: (id: string, status: HotelStatus, version: number) =>
    request<Hotel>(`/hotels/${id}/status`, { method: 'PATCH', body: { status, version } }),
  assignManager: (hotelId: string, userId: string) =>
    request<Hotel>(`/hotels/${hotelId}/managers`, { method: 'POST', body: { user_id: userId } }),
  removeManager: (hotelId: string, userId: string) =>
    request<Hotel>(`/hotels/${hotelId}/managers/${userId}`, { method: 'DELETE' }),
  createRoomType: (hotelId: string, body: RoomTypeInput) =>
    request<RoomType>(`/hotels/${hotelId}/room-types`, { method: 'POST', body }),
  updateRoomType: (id: string, body: RoomTypeInput) =>
    request<RoomType>(`/room-types/${id}`, { method: 'PUT', body }),
  setRoomStatus: (id: string, status: RoomStatus, version: number) =>
    request<RoomType>(`/room-types/${id}/status`, { method: 'PATCH', body: { status, version } }),

  // ---------- booking ----------
  availability: (query: AvailabilityQuery) =>
    request<{ items: Availability[] }>('/availability', { query: { ...query } }),
  book: ({ key, ...body }: BookInput) =>
    request<Reservation>('/reservations', { method: 'POST', body, headers: { 'Idempotency-Key': key } }),
  // Чтение броней отдаёт booking-query (модель чтения, отстаёт на сотни мс).
  myReservations: (query: ReservationQuery) =>
    request<Paged<Reservation>>('/reservations/my', { query: { ...query } }),
  mySummary: () => request<CustomerSummary>('/reservations/my/summary'),
  hotelReservations: (query: ReservationQuery) =>
    request<Paged<Reservation>>('/reservations', { query: { ...query } }),
  hotelSummary: (query: { hotel_id?: string; from?: string; to?: string }) =>
    request<HotelSummary>('/reservations/summary', { query }),
  reservation: (id: string) => request<Reservation>(`/reservations/${id}`),
  cancelReservation: (id: string, reason = '') =>
    request<Reservation>(`/reservations/${id}/cancel`, { method: 'POST', body: { reason } }),
  audit: (query: { hotel_id: string; page?: number }) =>
    request<Paged<AuditRecord>>('/audit', { query }),

  // ---------- notification ----------
  notifications: (query: { page?: number; unread?: boolean }) =>
    request<Paged<Notification>>('/notifications', { query }),
  unreadCount: () => request<{ unread: number }>('/notifications/unread-count'),
  markRead: (id: string) => request<void>(`/notifications/${id}/read`, { method: 'POST' }),
  markAllRead: () => request<{ marked: number }>('/notifications/read-all', { method: 'POST' }),
};
