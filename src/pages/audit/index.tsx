import { Link, useParams } from 'react-router-dom';
import { AuditLog } from '@/widgets/audit-log';

export default function AuditPage() {
  const { id = '' } = useParams();
  return (
    <div className="page stack">
      <Link to={`/manage/hotels/${id}`}>← К отелю</Link>
      <h1>Журнал действий</h1>
      <AuditLog hotelId={id} />
    </div>
  );
}
