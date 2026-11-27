import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useUnit } from 'effector-react';
import { $details, detailsQuery, detailsRequested, detailsReset } from '@/entities/hotel';
import { $role } from '@/entities/session';
import { HotelForm } from '@/features/hotel-edit';
import { ToggleStatusButton } from '@/features/hotel-toggle-status';
import { HotelManagers } from '@/features/hotel-assign-manager';
import { RoomTypeEditButton, RoomTypeEditor } from '@/features/room-type-edit';
import { ArchiveRoomTypeButton } from '@/features/room-type-archive';
import { formatMoney } from '@/shared/lib/format';
import type { RoomType } from '@/shared/api/types';
import { Alert, Badge, Card, Empty, Spinner } from '@/shared/ui';
import { $actionError, editorReset } from './model';

/** Создание (id = 'new') и редактирование отеля со всеми его настройками. */
export function HotelEditor({ id }: { id: string }) {
  const isNew = id === 'new';
  const [details, loading, loadError, role, actionError, request, reset, resetErrors] = useUnit([
    $details,
    detailsQuery.$pending,
    detailsQuery.$error,
    $role,
    $actionError,
    detailsRequested,
    detailsReset,
    editorReset,
  ]);
  useEffect(() => {
    resetErrors();
    if (!isNew) request(id);
    return () => reset();
  }, [id, isNew, request, reset, resetErrors]);

  if (!isNew && loadError) return <Alert>{loadError}</Alert>;
  if (!isNew && (loading || !details || details.hotel.id !== id)) return <Spinner />;
  const hotel = isNew ? null : details!.hotel;
  const isAdmin = role === 'admin';

  return (
    <>
      {actionError && <Alert>{actionError}</Alert>}
      <HotelForm
        hotel={hotel}
        canEdit={isAdmin || !isNew}
        actions={
          hotel && (
            <>
              <Link className="neu-btn small" to={`/manage/hotels/${hotel.id}/audit`}>
                Журнал
              </Link>
              {/* Включать и отключать отель может только админ. */}
              {isAdmin && <ToggleStatusButton hotel={hotel} />}
            </>
          )
        }
      />
      {!isNew && details && (
        <>
          <RoomTypes hotelId={details.hotel.id} rooms={details.room_types} />
          {isAdmin && <HotelManagers hotel={details.hotel} />}
        </>
      )}
    </>
  );
}

function RoomTypes({ hotelId, rooms }: { hotelId: string; rooms: RoomType[] }) {
  return (
    <Card>
      <div className="row-between">
        <h2 style={{ margin: 0 }}>Типы номеров</h2>
        <RoomTypeEditButton />
      </div>
      <div className="stack" style={{ marginTop: 16 }}>
        {rooms.length === 0 && <Empty>Добавьте первый тип номера, чтобы отель появился в поиске</Empty>}
        {rooms.map((r) => (
          <div key={r.id} className="neu-inset row-between" aria-label={r.name}>
            <div>
              <b>{r.name}</b> {r.status === 'archived' && <Badge tone="bad">В архиве</Badge>}
              <div className="muted">
                до {r.capacity} гостей · номеров: {r.total_rooms} · {formatMoney(r.price)} / ночь
              </div>
            </div>
            <div className="row">
              <RoomTypeEditButton room={r} />
              <ArchiveRoomTypeButton room={r} />
            </div>
          </div>
        ))}
      </div>
      <RoomTypeEditor hotelId={hotelId} rooms={rooms} />
    </Card>
  );
}
