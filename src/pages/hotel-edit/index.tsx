import { Link, useParams } from 'react-router-dom';
import { HotelEditor } from '@/widgets/hotel-editor';

export default function HotelEditPage() {
  const { id = 'new' } = useParams();
  return (
    <div className="page stack">
      <Link to="/manage/hotels">← К отелям</Link>
      {/* key: после создания /new → /:id редактор монтируется заново с новым id. */}
      <HotelEditor key={id} id={id} />
    </div>
  );
}
