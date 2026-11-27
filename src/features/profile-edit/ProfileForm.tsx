import { useEffect, useState, type FormEvent } from 'react';
import { useUnit } from 'effector-react';
import { $user } from '@/entities/session';
import { errorMessage, roleLabel } from '@/shared/lib/format';
import { Alert, Badge, Button, Card, TextField } from '@/shared/ui';
import { updateMeFx } from './model';

export function ProfileForm() {
  const [user, save, pending] = useUnit([$user, updateMeFx, updateMeFx.pending]);
  const [form, setForm] = useState({ full_name: '', phone: '' });
  const [msg, setMsg] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  useEffect(() => {
    if (user) setForm({ full_name: user.full_name, phone: user.phone });
  }, [user]);
  if (!user) return null;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    save({ ...form, version: user.version })
      .then(() => setMsg({ tone: 'success', text: 'Профиль сохранён' }))
      .catch((err) => setMsg({ tone: 'error', text: errorMessage(err) }));
  };

  return (
    <Card>
      <form className="stack" onSubmit={submit} aria-label="Профиль">
        <div className="row-between">
          <h1 style={{ margin: 0 }}>Профиль</h1>
          <Badge>{roleLabel[user.role]}</Badge>
        </div>
        <p className="muted">{user.email}</p>
        {msg && <Alert tone={msg.tone}>{msg.text}</Alert>}
        <TextField
          label="Имя и фамилия"
          value={form.full_name}
          onChange={(e) => setForm({ ...form, full_name: e.target.value })}
        />
        <TextField
          label="Телефон"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
        <Button type="submit" variant="primary" disabled={pending}>
          Сохранить
        </Button>
      </form>
    </Card>
  );
}
