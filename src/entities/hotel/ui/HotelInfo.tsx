import type { Hotel } from '@/shared/api/types';
import { Badge, Card, Stars } from '@/shared/ui';
import { HotelCover } from './HotelCard';

/** Шапка страницы отеля: фото, звёзды, адрес, описание. */
export function HotelInfo({ hotel }: { hotel: Hotel }) {
  return (
    <Card>
      <HotelCover url={hotel.photo_url} />
      <div className="row-between">
        <h1 style={{ margin: 0 }}>{hotel.name}</h1>
        {hotel.status === 'inactive' && <Badge tone="bad">Не принимает брони</Badge>}
      </div>
      <Stars n={hotel.stars} />
      <p className="muted">
        {hotel.city}, {hotel.address}
      </p>
      <p>{hotel.description}</p>
    </Card>
  );
}
