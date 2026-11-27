import { useState, type FormEvent } from 'react';
import { createEffect } from 'effector';
import { useUnit } from 'effector-react';
import { api } from '@/shared/api/endpoints';
import { errorFields, errorMessage } from '@/shared/lib/format';
import { Alert, Button, Card, TextField } from '@/shared/ui';

export const changePasswordFx = createEffect(api.changePassword);

export function PasswordForm() {
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
        <TextField
          label="Текущий пароль"
          type="password"
          autoComplete="current-password"
          required
          value={form.current_password}
          onChange={(e) => setForm({ ...form, current_password: e.target.value })}
          error={fields.current_password}
        />
        <TextField
          label="Новый пароль"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={form.new_password}
          onChange={(e) => setForm({ ...form, new_password: e.target.value })}
          error={fields.new_password}
        />
        <Button type="submit" disabled={pending}>
          Сменить пароль
        </Button>
      </form>
    </Card>
  );
}
