import { useState, type FormEvent } from 'react';
import { useUnit } from 'effector-react';
import type { RoomType, RoomTypeInput } from '@/shared/api/types';
import { Alert, Button, Modal, TextArea, TextField } from '@/shared/ui';
import { $roomEditor, roomEditorClosed, roomEditorOpened, saveRoom } from './model';

/** «+ Тип номера» (room не передан) или «Изменить» у существующего типа. */
export function RoomTypeEditButton({ room }: { room?: RoomType }) {
  const open = useUnit(roomEditorOpened);
  return room ? (
    <Button small onClick={() => open(room.id)}>
      Изменить
    </Button>
  ) : (
    <Button small variant="primary" onClick={() => open(null)}>
      + Тип номера
    </Button>
  );
}

/** Модалка редактора; ищет тип по id среди переданных. */
export function RoomTypeEditor({ hotelId, rooms }: { hotelId: string; rooms: RoomType[] }) {
  const editor = useUnit($roomEditor);
  if (!editor) return null;
  const room = rooms.find((r) => r.id === editor.id) ?? null;
  return <RoomEditor key={editor.id ?? 'new'} hotelId={hotelId} room={room} />;
}

function RoomEditor({ hotelId, room }: { hotelId: string; room: RoomType | null }) {
  const [save, pending, error, close] = useUnit([
    saveRoom.fx,
    saveRoom.$pending,
    saveRoom.$error,
    roomEditorClosed,
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
