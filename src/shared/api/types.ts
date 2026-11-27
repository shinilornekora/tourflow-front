// Контракты REST API бэкенда (gateway /api).

export type Role = 'customer' | 'hotel_manager' | 'admin';

export interface Money {
  amount: number; // копейки
  currency: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  role: Role;
  created_at: string;
  version: number;
}

export interface Session {
  access_token: string;
  expires_at: string;
  user: User;
}

export interface Paged<T> {
  items: T[];
  page: number;
  page_size: number;
  total: number;
}

export type HotelStatus = 'active' | 'inactive';

export interface Hotel {
  id: string;
  name: string;
  city: string;
  address: string;
  description: string;
  stars: number;
  photo_url: string;
  status: HotelStatus;
  manager_ids?: string[];
  min_price?: Money;
  room_type_count?: number;
  created_at: string;
  updated_at: string;
  version: number;
}

export type RoomStatus = 'active' | 'archived';

export interface RoomType {
  id: string;
  hotel_id: string;
  name: string;
  description: string;
  capacity: number;
  total_rooms: number;
  price: Money;
  amenities: string[];
  photo_url: string;
  status: RoomStatus;
  version: number;
}

export interface HotelDetails {
  hotel: Hotel;
  room_types: RoomType[];
}

export interface Availability {
  room_type_id: string;
  name: string;
  capacity: number;
  total_rooms: number;
  free: number;
  price_per_night: Money;
  total_price: Money;
}

export type ReservationStatus = 'confirmed' | 'cancelled';

export interface Reservation {
  id: string;
  hotel_id: string;
  hotel_name: string;
  room_type_id: string;
  room_type_name: string;
  customer_id: string;
  check_in: string;
  check_out: string;
  nights: number;
  guests: number;
  status: ReservationStatus;
  total: Money;
  created_at: string;
  cancelled_at?: string;
  cancel_reason?: string;
  version: number;
}

export interface Notification {
  id: string;
  kind: 'reservation_confirmed' | 'reservation_cancelled' | string;
  title: string;
  body: string;
  reservation_id?: string;
  created_at: string;
  read_at?: string;
}

export interface AuditRecord {
  id: number;
  hotel_id: string;
  actor_id: string | null;
  actor_role: string;
  action: string;
  entity_id: string;
  details: Record<string, unknown>;
  at: string;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    fields?: Record<string, string>;
    request_id?: string;
  };
}

export interface HotelInput {
  name: string;
  city: string;
  address: string;
  description: string;
  stars: number;
  photo_url: string;
  version?: number;
}

export interface RoomTypeInput {
  name: string;
  description: string;
  capacity: number;
  total_rooms: number;
  price: Money;
  amenities: string[];
  photo_url: string;
  version?: number;
}
