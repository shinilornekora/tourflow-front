import { HotelCatalog } from '@/widgets/hotel-catalog';

export default function HotelsPage() {
  return (
    <div className="page stack">
      <div>
        <h1>Найдите отель для поездки</h1>
        <p className="muted">Выберите город, даты уточните на странице отеля.</p>
      </div>
      <HotelCatalog />
    </div>
  );
}
