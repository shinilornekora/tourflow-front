import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUnit } from 'effector-react';
import type { Hotel, HotelInput } from '@/shared/api/types';
import { errorFields } from '@/shared/lib/format';
import { Alert, Badge, Button, Card, Select, TextArea, TextField } from '@/shared/ui';
import { saveHotel } from './model';

const emptyHotel: HotelInput = { name: '', city: '', address: '', description: '', stars: 3, photo_url: '' };

export function HotelForm({
  hotel,
  canEdit,
  actions,
}: {
  hotel: Hotel | null;
  canEdit: boolean;
  /** Кнопки в шапке формы (журнал, включение/отключение) — их передаёт виджет. */
  actions?: ReactNode;
}) {
  const navigate = useNavigate();
  const [save, pending, error] = useUnit([saveHotel.fx, saveHotel.$pending, saveHotel.$error]);
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
              {actions}
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
