import { useEffect, useState, type FormEvent } from 'react';
import { createEffect } from 'effector';
import { useUnit } from 'effector-react';
import { $user, userUpdated } from '@/entities/session/model';
import { api } from '@/shared/api/endpoints';
import { Alert, Badge, Button, Card, TextField } from '@/shared/ui';
import { errorFields, errorMessage, roleLabel } from '@/shared/lib/format';
import { sample } from 'effector';

export const updateMeFx = createEffect(api.updateMe);
export const changePasswordFx = createEffect(api.changePassword);
sample({ clock: updateMeFx.doneData, target: userUpdated });

export default function ProfilePage() {
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
    <div className="page stack" style={{ maxWidth: 560 }}>
      <Card>
        <form className="stack" onSubmit={submit} aria-label="Профиль">
          <div className="row-between">
            <h1 style={{ margin: 0 }}>Профиль</h1>
            <Badge>{roleLabel[user.role]}</Badge>
          </div>
          <p className="muted">{user.email}</p>
          {msg && <Alert tone={msg.tone}>{msg.text}</Alert>}
          <TextField label="Имя и фамилия" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          <TextField label="Телефон" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Button type="submit" variant="primary" disabled={pending}>Сохранить</Button>
        </form>
      </Card>
      <PasswordForm />
    </div>
  );
}

function PasswordForm() {
  const [change, pending] = useUnit([changePasswordFx, changePasswordFx.pending]);
  const [form, setForm] = useState({ current_password: '', new_password: '' });
  const [msg, setMsg] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});

  const submit = (e: FormEvent) => {
    e.preventDefault();
    change(form)
      .then(() => {
        setForm({ current_password: '', new_password: '' });
        setFields({});
        setMsg({ tone: 'success', text: 'Пароль изменён' });
      })
      .catch((err) => {
        setFields(errorFields(err));
        setMsg({ tone: 'error', text: errorMessage(err) });
      });
  };

  return (
    <Card>
      <form className="stack" onSubmit={submit} aria-label="Смена пароля">
        <h2 style={{ margin: 0 }}>Смена пароля</h2>
        {msg && <Alert tone={msg.tone}>{msg.text}</Alert>}
        <TextField label="Текущий пароль" type="password" autoComplete="current-password" required value={form.current_password} onChange={(e) => setForm({ ...form, current_password: e.target.value })} error={fields.current_password} />
        <TextField label="Новый пароль" type="password" autoComplete="new-password" required minLength={8} value={form.new_password} onChange={(e) => setForm({ ...form, new_password: e.target.value })} error={fields.new_password} />
        <Button type="submit" disabled={pending}>Сменить пароль</Button>
      </form>
    </Card>
  );
}
