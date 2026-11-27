import { HotelReservations } from '@/widgets/hotel-reservations';
import { HotelSummary } from '@/widgets/bookings-summary';

export default function ManageBookingsPage() {
  return (
    <div className="page stack">
      <h1>Брони отелей</h1>
      <HotelReservations summary={(hotelId) => <HotelSummary hotelId={hotelId} />} />
    </div>
  );
}
