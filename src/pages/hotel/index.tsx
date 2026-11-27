import { Link, useParams } from 'react-router-dom';
import { useGate, useUnit } from 'effector-react';
import { $details, HotelInfo, detailsQuery } from '@/entities/hotel';
import { RoomOffers } from '@/widgets/room-offers';
import { Alert, Spinner } from '@/shared/ui';
import { HotelGate } from './model';

export default function HotelPage() {
  const { id = '' } = useParams();
  return <Hotel key={id} id={id} />;
}

function Hotel({ id }: { id: string }) {
  useGate(HotelGate, { id });
  const [details, error] = useUnit([$details, detailsQuery.$error]);

  if (error)
    return (
      <div className="page">
        <Alert>{error}</Alert>
      </div>
    );
  if (!details || details.hotel.id !== id) return <Spinner />;

  return (
    <div className="page stack">
      <Link to="/">← Ко всем отелям</Link>
      <HotelInfo hotel={details.hotel} />
      <RoomOffers details={details} />
    </div>
  );
}
