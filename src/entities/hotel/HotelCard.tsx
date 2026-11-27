import { Link } from 'react-router-dom';
import type { Hotel } from '@/shared/api/types';
import { Badge, Stars } from '@/shared/ui';
import { formatMoney } from '@/shared/lib/format';

export function HotelCover({ url }: { url?: string }) {
  return <div className="cover" style={url ? { backgroundImage: `url(${url})` } : undefined} aria-hidden />;
}

export function HotelCard({ hotel, to }: { hotel: Hotel; to: string }) {
  return (
    <article className="neu-card" aria-label={hotel.name}>
      <HotelCover url={hotel.photo_url} />
      <div className="row-between">
        <h3 style={{ margin: 0 }}>
          <Link to={to}>{hotel.name}</Link>
        </h3>
        {hotel.status === 'inactive' && <Badge tone="bad">Отключён</Badge>}
      </div>
      <Stars n={hotel.stars} />
      <p className="muted">
        {hotel.city}, {hotel.address}
      </p>
      {hotel.min_price && (
        <p>
          от <b>{formatMoney(hotel.min_price)}</b> <span className="muted">/ ночь</span>
        </p>
      )}
    </article>
  );
}
