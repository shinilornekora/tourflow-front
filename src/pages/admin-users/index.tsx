import { useEffect, useState, type FormEvent } from 'react';
import { createEvent, createStore, sample } from 'effector';
import { useUnit } from 'effector-react';
import { api } from '@/shared/api/endpoints';
import type { Role, User } from '@/shared/api/types';
import { createRequest } from '@/shared/lib/request';
import { roleLabel } from '@/shared/lib/format';
import { Alert, Button, Card, Select, Spinner, TextField } from '@/shared/ui';

export const usersQuery = createRequest((p: { q: string; role: Role | '' }) => api.users({ ...p, page: 1 }));
export const changeRole = createRequest(({ id, role }: { id: string; role: Role }) =>
  api.changeRole(id, role),
);
export const searchSubmitted = createEvent<{ q: string; role: Role | '' }>();

export const $users = createStore<User[]>([])
  .on(usersQuery.fx.doneData, (_, d) => d.items)
  .on(changeRole.fx.doneData, (l, u) => l.map((x) => (x.id === u.id ? u : x)));

sample({ clock: searchSubmitted, target: usersQuery.start });

const roles: Role[] = ['customer', 'hotel_manager', 'admin'];

export default function UsersPage() {
  const [users, pending, error, roleError, search, setRole] = useUnit([
    $users,
    usersQuery.$pending,
    usersQuery.$error,
    changeRole.$error,
    searchSubmitted,
    changeRole.start,
  ]);
  const [q, setQ] = useState('');
  const [role, setRoleFilter] = useState<Role | ''>('');
  useEffect(() => {
    search({ q: '', role: '' });
  }, [search]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    search({ q, role });
  };

  return (
    <div className="page stack">
      <h1>Пользователи</h1>
      <Card>
        <form className="form-grid" onSubmit={submit} aria-label="Поиск пользователей">
          <TextField label="Имя или email" value={q} onChange={(e) => setQ(e.target.value)} />
          <Select
            label="Роль"
            value={role}
            onChange={(e) => setRoleFilter(e.target.value as Role | '')}
            options={[{ value: '', label: 'Все' }, ...roles.map((r) => ({ value: r, label: roleLabel[r] }))]}
          />
          <div style={{ alignSelf: 'end' }}>
            <Button type="submit" variant="primary">
              Найти
            </Button>
          </div>
        </form>
      </Card>
      {(error || roleError) && <Alert>{error ?? roleError}</Alert>}
      {pending && users.length === 0 ? (
        <Spinner />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Пользователь</th>
                <th>ID</th>
                <th>Роль</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <b>{u.full_name}</b>
                    <div className="muted">{u.email}</div>
                  </td>
                  <td className="muted" style={{ fontSize: 12 }}>
                    {u.id}
                  </td>
                  <td>
                    <select
                      className="neu-input"
                      aria-label={`Роль ${u.email}`}
                      value={u.role}
                      onChange={(e) => setRole({ id: u.id, role: e.target.value as Role })}
                    >
                      {roles.map((r) => (
                        <option key={r} value={r}>
                          {roleLabel[r]}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
