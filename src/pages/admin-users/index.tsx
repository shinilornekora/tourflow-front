import { UsersTable } from '@/widgets/users-table';

export default function UsersPage() {
  return (
    <div className="page stack">
      <h1>Пользователи</h1>
      <UsersTable />
    </div>
  );
}
