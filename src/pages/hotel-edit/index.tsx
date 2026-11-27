import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useGate, useUnit } from 'effector-react';
import { $role } from '@/entities/session/model';
import type { Hotel, HotelInput, RoomType, RoomTypeInput } from '@/shared/api/types';
import { formatMoney } from '@/shared/lib/format';
import { errorFields } from '@/shared/lib/format';
import { Alert, Badge, Button, Card, Empty, Modal, Select, Spinner, TextArea, TextField } from '@/shared/ui';
import * as m from './model';

const emptyHotel: HotelInput = { name: '', city: '', address: '', description: '', stars: 3, photo_url: '' };

export default function HotelEditPage() {
  const { id = 'new' } = useParams();
  // key: после создания /new → /:id страница монтируется заново и Gate открывается с новым id.
  return <HotelEdit key={id} id={id} />;
}

function HotelEdit({ id }: { id: string }) {
  const isNew = id === 'new';
  useGate(m.HotelEditGate, { id });
  const [details, loading, loadError, role, actionError] = useUnit([
    m.$details,
    m.detailsQuery.$pending,
    m.detailsQuery.$error,
    $role,
    m.$actionError,
  ]);

  if (!isNew && loadError)
    return (
      <div className="page">
        <Alert>{loadError}</Alert>
      </div>
    );
  if (!isNew && (loading || !details || details.hotel.id !== id)) return <Spinner />;

  return (
    <div className="page stack">
      <Link to="/manage/hotels">← К отелям</Link>
      {actionError && <Alert>{actionError}</Alert>}
      <HotelForm
        hotel={isNew ? null : details!.hotel}
        canEdit={role === 'admin' || !isNew}
        isAdmin={role === 'admin'}
      />
      {!isNew && details && (
        <>
          <RoomTypes hotelId={details.hotel.id} rooms={details.room_types} />
          {role === 'admin' && <Managers hotel={details.hotel} />}
        </>
      )}
    </div>
  );
}

function HotelForm({ hotel, canEdit, isAdmin }: { hotel: Hotel | null; canEdit: boolean; isAdmin: boolean }) {
  const navigate = useNavigate();
  const [save, pending, error, toggle] = useUnit([
    m.saveHotel.fx,
    m.saveHotel.$pending,
    m.saveHotel.$error,
    m.setStatus.start,
  ]);
  const [form, setForm] = useState<HotelInput>(emptyHotel);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    setForm(
      hotel
        ? {
            name: hotel.name,
            city: hotel.city,
            address: hotel.address,
            description: hotel.description,
            stars: hotel.stars,
            photo_url: hotel.photo_url,
          }
        : emptyHotel,
    );
  }, [hotel]);
  const set = (k: keyof HotelInput) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: k === 'stars' ? Number(e.target.value) : e.target.value }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setSaved(false);
    save({ id: hotel?.id ?? null, body: { ...form, version: hotel?.version } })
      .then((h) => {
        setFields({});
        setSaved(true);
        if (!hotel) navigate(`/manage/hotels/${h.id}`, { replace: true });
      })
      .catch((err) => setFields(errorFields(err)));
  };

  return (
    <Card>
      <form className="stack" onSubmit={submit} aria-label="Данные отеля">
        <div className="row-between">
          <h1 style={{ margin: 0 }}>{hotel ? hotel.name : 'Новый отель'}</h1>
          {hotel && (
            <div className="row">
              <Badge tone={hotel.status === 'active' ? 'ok' : 'bad'}>
                {hotel.status === 'active' ? 'Активен' : 'Отключён'}
              </Badge>
              <Link className="neu-btn small" to={`/manage/hotels/${hotel.id}/audit`}>
                Журнал
              </Link>
              {/* Включать и отключать отель может только админ; отключение отменяет будущие брони. */}
              {isAdmin && (
                <Button
                  small
                  variant={hotel.status === 'active' ? 'danger' : 'primary'}
                  onClick={() => {
                    if (
                      hotel.status === 'active' &&
                      !window.confirm(
                        'Отключить отель? Все будущие брони будут отменены, гости получат уведомления.',
                      )
                    )
                      return;
                    toggle({
                      id: hotel.id,
                      status: hotel.status === 'active' ? 'inactive' : 'active',
                      version: hotel.version,
                    });
                  }}
                >
                  {hotel.status === 'active' ? 'Отключить' : 'Включить'}
                </Button>
              )}
            </div>
          )}
        </div>
        {error && <Alert>{error}</Alert>}
        {saved && <Alert tone="success">Сохранено</Alert>}
        <div className="form-grid">
          <TextField
            label="Название"
            required
            value={form.name}
            onChange={set('name')}
            error={fields.name}
            disabled={!canEdit}
          />
          <TextField
            label="Город"
            required
            value={form.city}
            onChange={set('city')}
            error={fields.city}
            disabled={!canEdit}
          />
          <TextField
            label="Адрес"
            required
            value={form.address}
            onChange={set('address')}
            error={fields.address}
            disabled={!canEdit}
          />
          <Select
            label="Звёзды"
            value={String(form.stars)}
            onChange={set('stars')}
            options={[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: '★'.repeat(n) }))}
            disabled={!canEdit}
          />
        </div>
        <TextField
          label="Ссылка на фото"
          value={form.photo_url}
          onChange={set('photo_url')}
          error={fields.photo_url}
          disabled={!canEdit}
        />
        <TextArea
          label="Описание"
          value={form.description}
          onChange={set('description')}
          disabled={!canEdit}
        />
        {canEdit && (
          <div>
            <Button type="submit" variant="primary" disabled={pending}>
              {hotel ? 'Сохранить' : 'Создать отель'}
            </Button>
          </div>
        )}
      </form>
    </Card>
  );
}

function RoomTypes({ hotelId, rooms }: { hotelId: string; rooms: RoomType[] }) {
  const [editor, open, toggle] = useUnit([m.$roomEditor, m.roomEditorOpened, m.setRoomStatus.start]);
  return (
    <Card>
      <div className="row-between">
        <h2 style={{ margin: 0 }}>Типы номеров</h2>
        <Button small variant="primary" onClick={() => open(null)}>
          + Тип номера
        </Button>
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
              <Button small onClick={() => open(r.id)}>
                Изменить
              </Button>
              <Button
                small
                onClick={() =>
                  toggle({
                    id: r.id,
                    status: r.status === 'active' ? 'archived' : 'active',
                    version: r.version,
                  })
                }
              >
                {r.status === 'active' ? 'В архив' : 'Вернуть'}
              </Button>
            </div>
          </div>
        ))}
      </div>
      {editor && <RoomEditor hotelId={hotelId} room={rooms.find((r) => r.id === editor.id) ?? null} />}
    </Card>
  );
}

function RoomEditor({ hotelId, room }: { hotelId: string; room: RoomType | null }) {
  const [save, pending, error, close] = useUnit([
    m.saveRoom.fx,
    m.saveRoom.$pending,
    m.saveRoom.$error,
    m.roomEditorClosed,
  ]);
  const [form, setForm] = useState({
    name: room?.name ?? '',
    description: room?.description ?? '',
    capacity: room?.capacity ?? 2,
    total_rooms: room?.total_rooms ?? 1,
    price: room ? room.price.amount / 100 : 3000,
    amenities: room?.amenities.join(', ') ?? '',
    photo_url: room?.photo_url ?? '',
  });
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const body: RoomTypeInput = {
      name: form.name,
      description: form.description,
      capacity: form.capacity,
      total_rooms: form.total_rooms,
      price: { amount: Math.round(form.price * 100), currency: 'RUB' },
      amenities: form.amenities
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      photo_url: form.photo_url,
      version: room?.version,
    };
    save({ hotelId, id: room?.id ?? null, body }).catch(() => undefined);
  };
  return (
    <Modal title={room ? 'Изменить тип номера' : 'Новый тип номера'} onClose={close}>
      <form className="stack" onSubmit={submit} aria-label="Тип номера">
        {error && <Alert>{error}</Alert>}
        <TextField
          label="Название"
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <div className="form-grid">
          <TextField
            label="Вместимость"
            type="number"
            min={1}
            value={form.capacity}
            onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
          />
          <TextField
            label="Количество номеров"
            type="number"
            min={1}
            value={form.total_rooms}
            onChange={(e) => setForm({ ...form, total_rooms: Number(e.target.value) })}
          />
          <TextField
            label="Цена за ночь, ₽"
            type="number"
            min={1}
            value={form.price}
            onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
          />
        </div>
        <TextField
          label="Удобства через запятую"
          value={form.amenities}
          onChange={(e) => setForm({ ...form, amenities: e.target.value })}
        />
        <TextArea
          label="Описание"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <div className="row">
          <Button onClick={close}>Отмена</Button>
          <Button type="submit" variant="primary" disabled={pending}>
            Сохранить
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function Managers({ hotel }: { hotel: Hotel }) {
  const [users, loadUsers, assign, remove] = useUnit([
    m.managersQuery.$data,
    m.managersQuery.start,
    m.assignManager.start,
    m.removeManager.start,
  ]);
  const [pick, setPick] = useState('');
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);
  const ids = hotel.manager_ids ?? [];
  const all = users?.items ?? [];
  const name = (id: string) => all.find((u) => u.id === id)?.full_name ?? id;
  const candidates = all.filter((u) => !ids.includes(u.id));

  return (
    <Card>
      <h2>Менеджеры отеля</h2>
      <div className="stack">
        {ids.length === 0 && <Empty>Менеджеры не назначены</Empty>}
        {ids.map((id) => (
          <div key={id} className="neu-inset row-between">
            <span>{name(id)}</span>
            <Button small variant="danger" onClick={() => remove({ hotelId: hotel.id, userId: id })}>
              Снять
            </Button>
          </div>
        ))}
        <div className="row" style={{ alignItems: 'end' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <Select
              label="Назначить менеджера"
              value={pick}
              onChange={(e) => setPick(e.target.value)}
              options={[
                { value: '', label: 'Выберите пользователя' },
                ...candidates.map((u) => ({ value: u.id, label: `${u.full_name} (${u.email})` })),
              ]}
            />
          </div>
          <Button
            variant="primary"
            disabled={!pick}
            onClick={() => {
              assign({ hotelId: hotel.id, userId: pick });
              setPick('');
            }}
          >
            Назначить
          </Button>
        </div>
      </div>
    </Card>
  );
}
