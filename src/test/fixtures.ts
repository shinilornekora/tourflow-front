import type { Hotel, Notification, Reservation, RoomType, User } from '@/shared/api/types';

const now = '2026-11-01T10:00:00Z';

export const users: Record<string, User & { password: string }> = {
  customer: { id: 'u-cust', email: 'anna@example.com', full_name: 'Анна Клиентова', phone: '+79990000001', role: 'customer', created_at: now, version: 1, password: 'password1' },
  manager: { id: 'u-man', email: 'max@example.com', full_name: 'Максим Менеджеров', phone: '+79990000002', role: 'hotel_manager', created_at: now, version: 1, password: 'password1' },
  admin: { id: 'u-adm', email: 'root@example.com', full_name: 'Ольга Админова', phone: '+79990000003', role: 'admin', created_at: now, version: 1, password: 'password1' },
};

export const hotel = (over: Partial<Hotel> = {}): Hotel => ({
  id: 'h-sea',
  name: 'Морской бриз',
  city: 'Сочи',
  address: 'Приморская, 1',
  description: 'Отель у моря',
  stars: 4,
  photo_url: '',
  status: 'active',
  manager_ids: ['u-man'],
  min_price: { amount: 500000, currency: 'RUB' },
  room_type_count: 1,
  created_at: now,
  updated_at: now,
  version: 1,
  ...over,
});

export const roomType = (over: Partial<RoomType> = {}): RoomType => ({
  id: 'rt-std',
  hotel_id: 'h-sea',
  name: 'Стандарт',
  description: 'Двухместный номер',
  capacity: 2,
  total_rooms: 5,
  price: { amount: 500000, currency: 'RUB' },
  amenities: ['Wi-Fi', 'Кондиционер'],
  photo_url: '',
  status: 'active',
  version: 1,
  ...over,
});

export const reservation = (over: Partial<Reservation> = {}): Reservation => ({
  id: 'r-1',
  hotel_id: 'h-sea',
  hotel_name: 'Морской бриз',
  room_type_id: 'rt-std',
  room_type_name: 'Стандарт',
  customer_id: 'u-cust',
  check_in: '2099-06-01',
  check_out: '2099-06-04',
  nights: 3,
  guests: 2,
  status: 'confirmed',
  total: { amount: 1500000, currency: 'RUB' },
  created_at: now,
  version: 1,
  ...over,
});

export const notification = (over: Partial<Notification> = {}): Notification => ({
  id: 'n-1',
  kind: 'reservation_confirmed',
  title: 'Бронь подтверждена',
  body: 'Морской бриз, Стандарт',
  created_at: now,
  ...over,
});
