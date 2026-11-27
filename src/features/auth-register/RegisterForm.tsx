import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useUnit } from 'effector-react';
import { registerFx } from '@/entities/session';
import { Alert, Button, TextField } from '@/shared/ui';
import { $registerError, $registerFields, registerFormReset } from './model';

export function RegisterForm() {
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '' });
  const [error, fields, pending, register, reset] = useUnit([
    $registerError,
    $registerFields,
    registerFx.pending,
    registerFx,
    registerFormReset,
  ]);
  useEffect(() => () => reset(), [reset]);
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    register(form).catch(() => undefined);
  };

  return (
    <form className="stack" onSubmit={submit} aria-label="Регистрация">
      <h1>Регистрация</h1>
      {error && <Alert>{error}</Alert>}
      <TextField
        label="Имя и фамилия"
        required
        value={form.full_name}
        onChange={set('full_name')}
        error={fields.full_name}
      />
      <TextField
        label="Email"
        type="email"
        required
        value={form.email}
        onChange={set('email')}
        error={fields.email}
      />
      <TextField label="Телефон" type="tel" value={form.phone} onChange={set('phone')} error={fields.phone} />
      <TextField
        label="Пароль"
        type="password"
        required
        minLength={8}
        value={form.password}
        onChange={set('password')}
        error={fields.password}
      />
      <Button type="submit" variant="primary" disabled={pending}>
        Создать аккаунт
      </Button>
      <p className="muted">
        Уже есть аккаунт? <Link to="/login">Войдите</Link>
      </p>
    </form>
  );
}
