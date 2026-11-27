import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useUnit } from 'effector-react';
import { loginFx } from '@/entities/session';
import { Alert, Button, TextField } from '@/shared/ui';
import { $loginError, loginFormReset } from './model';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, pending, login, reset] = useUnit([$loginError, loginFx.pending, loginFx, loginFormReset]);
  useEffect(() => () => reset(), [reset]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    login({ email, password }).catch(() => undefined);
  };

  return (
    <form className="stack" onSubmit={submit} aria-label="Вход">
      <h1>Вход</h1>
      {error && <Alert>{error}</Alert>}
      <TextField
        label="Email"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <TextField
        label="Пароль"
        type="password"
        autoComplete="current-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Button type="submit" variant="primary" disabled={pending}>
        {pending ? 'Входим…' : 'Войти'}
      </Button>
      <p className="muted">
        Нет аккаунта? <Link to="/register">Зарегистрируйтесь</Link>
      </p>
    </form>
  );
}
