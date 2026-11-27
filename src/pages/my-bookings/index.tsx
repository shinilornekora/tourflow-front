import { MyReservations } from '@/widgets/my-reservations';
import { CustomerSummary } from '@/widgets/bookings-summary';

export default function MyBookingsPage() {
  return (
    <div className="page stack">
      <MyReservations summary={<CustomerSummary />} />
    </div>
  );
}
