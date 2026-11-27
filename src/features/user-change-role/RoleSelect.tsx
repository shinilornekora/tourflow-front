import { useUnit } from 'effector-react';
import type { Role, User } from '@/shared/api/types';
import { roleLabel } from '@/shared/lib/format';
import { changeRole } from './model';

const roles: Role[] = ['customer', 'hotel_manager', 'admin'];

export function RoleSelect({ user }: { user: User }) {
  const setRole = useUnit(changeRole.start);
  return (
    <select
      className="neu-input"
      aria-label={`Роль ${user.email}`}
      value={user.role}
      onChange={(e) => setRole({ id: user.id, role: e.target.value as Role })}
    >
      {roles.map((r) => (
        <option key={r} value={r}>
          {roleLabel[r]}
        </option>
      ))}
    </select>
  );
}
