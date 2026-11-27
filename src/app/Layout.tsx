import { Suspense } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useUnit } from 'effector-react';
import { $role, $user, logoutFx } from '@/entities/session/model';
import { $unread } from '@/entities/notification/model';
import { roleLabel } from '@/shared/lib/format';
import { Button, Spinner } from '@/shared/ui';

export function Layout() {
  const [user, role, unread, logout] = useUnit([$user, $role, $unread, logoutFx]);
  const navigate = useNavigate();

  return (
    <>
      <header className="header container">
        <div className="bar">
          <NavLink to="/" className="logo" aria-label="TourFlow — на главную">
            <span aria-hidden>🧳</span> Tour<b>Flow</b>
          </NavLink>
          <nav className="nav" aria-label="Основная навигация">
            <NavLink to="/" end>Отели</NavLink>
            {role === 'customer' && <NavLink to="/cabinet/bookings">Мои заказы</NavLink>}
            {(role === 'hotel_manager' || role === 'admin') && (
              <>
                <NavLink to="/manage/hotels">{role === 'admin' ? 'Отели (упр.)' : 'Мои отели'}</NavLink>
                <NavLink to="/manage/bookings">Брони</NavLink>
              </>
            )}
            {role === 'admin' && <NavLink to="/admin/users">Пользователи</NavLink>}
          </nav>
          <div className="spacer" />
          {user ? (
            <div className="row" style={{ gap: 8 }}>
              <NavLink to="/cabinet/notifications" className="neu-btn small" aria-label={`Уведомления: ${unread}`}>
                🔔 {unread > 0 && <span className="counter">{unread}</span>}
              </NavLink>
              <NavLink to="/cabinet/profile" className="neu-btn small" title={roleLabel[user.role]}>
                {user.full_name || user.email}
              </NavLink>
              <Button
                small
                onClick={() => {
                  logout().finally(() => navigate('/'));
                }}
              >
                Выйти
              </Button>
            </div>
          ) : (
            <div className="row" style={{ gap: 8 }}>
              <NavLink to="/login" className="neu-btn small">Войти</NavLink>
              <NavLink to="/register" className="neu-btn small primary">Регистрация</NavLink>
            </div>
          )}
        </div>
      </header>
      <main className="container">
        <Suspense fallback={<Spinner />}>
          <Outlet />
        </Suspense>
      </main>
    </>
  );
}
