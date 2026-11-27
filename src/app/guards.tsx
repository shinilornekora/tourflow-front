import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useUnit } from 'effector-react';
import { $role, $status, hasRole } from '@/entities/session';
import type { Role } from '@/shared/api/types';
import { Spinner } from '@/shared/ui';

/** Пока сессия восстанавливается — показываем загрузку, а не мигаем редиректом. */
export function RequireAuth() {
  const status = useUnit($status);
  const location = useLocation();
  if (status === 'unknown') return <Spinner />;
  if (status === 'anonymous') return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

export function RequireRole({ roles }: { roles: readonly Role[] }) {
  const role = useUnit($role);
  if (!hasRole(role, roles)) return <Navigate to="/forbidden" replace />;
  return <Outlet />;
}

export function GuestOnly({ children }: { children: ReactNode }) {
  const status = useUnit($status);
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/';
  if (status === 'authenticated') return <Navigate to={from} replace />;
  return <>{children}</>;
}
