import { useEffect, useState, type FormEvent } from 'react';
import { useUnit } from 'effector-react';
import type { Role } from '@/shared/api/types';
import { $users, usersQuery, usersRequested } from '@/entities/user';
import { RoleSelect, changeRole } from '@/features/user-change-role';
import { roleLabel } from '@/shared/lib/format';
import { Alert, Button, Card, Select, Spinner, TextField } from '@/shared/ui';

const roles: Role[] = ['customer', 'hotel_manager', 'admin'];

/** Поиск пользователей и смена ролей (админ). */
export function UsersTable() {
  const [users, pending, error, roleError, search] = useUnit([
    $users,
    usersQuery.$pending,
    usersQuery.$error,
    changeRole.$error,
    usersRequested,
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
    <>
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
                  <td data-label="Пользователь">
                    <div className="cell-text">
                      <b>{u.full_name}</b>
                      <div className="muted">{u.email}</div>
                    </div>
                  </td>
                  <td data-label="ID" className="muted" style={{ fontSize: 12 }}>
                    {u.id}
                  </td>
                  <td data-label="Роль">
                    <RoleSelect user={u} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
