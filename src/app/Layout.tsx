import { Suspense, useContext, useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useUnit } from 'effector-react';
import { $role, $user, logoutFx } from '@/entities/session/model';
import { $unread, pollTick } from '@/entities/notification/model';
import { roleLabel } from '@/shared/lib/format';
import { Button, Spinner } from '@/shared/ui';
import { SidebarSlot } from './sidebarSlot';

function Logo() {
  return (
    <>
      <span aria-hidden>🧳</span> Tour<b>Flow</b>
    </>
  );
}

/**
 * Каркас: боковое меню слева (на десктопе всегда открыто), на телефоне и планшете —
 * верхняя полоска с кнопкой, по которой меню выезжает поверх контента.
 */
export function Layout() {
  const [user, role, unread, logout, tick] = useUnit([$user, $role, $unread, logoutFx, pollTick]);
  const navigate = useNavigate();
  const location = useLocation();
  const extra = useContext(SidebarSlot);
  const [open, setOpen] = useState(false);
  const authed = user !== null;

  // Опрос счётчика уведомлений, пока пользователь вошёл и вкладка открыта.
  useEffect(() => {
    if (!authed) return;
    const id = setInterval(() => {
      if (document.visibilityState !== 'hidden') tick();
    }, 30_000);
    return () => clearInterval(id);
  }, [authed, tick]);

  // Меню закрывается при переходе на другую страницу и по Esc.
  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    document.body.classList.add('no-scroll');
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.classList.remove('no-scroll');
    };
  }, [open]);

  return (
    <div className="shell">
      <header className="topbar">
        <NavLink to="/" className="logo" aria-hidden tabIndex={-1}>
          <Logo />
        </NavLink>
        <button
          type="button"
          className="neu-btn small burger"
          aria-label="Открыть меню"
          aria-expanded={open}
          aria-controls="sidebar"
          onClick={() => setOpen(true)}
        >
          <span aria-hidden>☰</span>
          {unread > 0 && <span className="dot" aria-hidden />}
        </button>
      </header>

      {open && <div className="sidebar-backdrop" onClick={() => setOpen(false)} aria-hidden />}

      <aside id="sidebar" className={`sidebar${open ? ' open' : ''}`}>
        <div className="sidebar-head">
          <NavLink to="/" className="logo" aria-label="TourFlow — на главную">
            <Logo />
          </NavLink>
          <button
            type="button"
            className="neu-btn small sidebar-close"
            aria-label="Закрыть меню"
            onClick={() => setOpen(false)}
          >
            ✕
          </button>
        </div>

        <nav className="nav" aria-label="Основная навигация">
          <NavLink to="/" end>
            Отели
          </NavLink>
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
          <div className="sidebar-user neu-inset">
            <NavLink to="/cabinet/profile" className="user-name" title={roleLabel[user.role]}>
              {user.full_name || user.email}
            </NavLink>
            <div className="muted user-role">{roleLabel[user.role]}</div>
            <div className="row" style={{ gap: 8 }}>
              <NavLink
                to="/cabinet/notifications"
                className="neu-btn small"
                aria-label={`Уведомления: ${unread}`}
              >
                🔔 {unread > 0 && <span className="counter">{unread}</span>}
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
          </div>
        ) : (
          <div className="row" style={{ gap: 8 }}>
            <NavLink to="/login" className="neu-btn small">
              Войти
            </NavLink>
            <NavLink to="/register" className="neu-btn small primary">
              Регистрация
            </NavLink>
          </div>
        )}

        {extra}
      </aside>

      <main className="main">
        <Suspense fallback={<Spinner />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}
