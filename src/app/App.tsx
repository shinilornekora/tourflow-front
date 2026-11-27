import { lazy, useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import { useUnit } from 'effector-react';
import { appStarted, sessionLost, sessionReceived } from '@/entities/session/model';
import { onSessionChange } from '@/shared/api/client';
import { ForbiddenPage, NotFoundPage } from '@/pages/not-found';
import { GuestOnly, RequireAuth, RequireRole } from './guards';
import { Layout } from './Layout';

// Каждая страница — отдельный чанк: админские страницы клиент не скачивает.
const HotelsPage = lazy(() => import('@/pages/hotels'));
const HotelPage = lazy(() => import('@/pages/hotel'));
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'));
const ProfilePage = lazy(() => import('@/pages/profile'));
const MyBookingsPage = lazy(() => import('@/pages/my-bookings'));
const NotificationsPage = lazy(() => import('@/pages/notifications'));
const ManageHotelsPage = lazy(() => import('@/pages/manage-hotels'));
const HotelEditPage = lazy(() => import('@/pages/hotel-edit'));
const ManageBookingsPage = lazy(() => import('@/pages/manage-bookings'));
const UsersPage = lazy(() => import('@/pages/admin-users'));

export function App() {
  const [start, received, lost] = useUnit([appStarted, sessionReceived, sessionLost]);
  useEffect(() => {
    start();
    // Клиент тихо обновил токен или потерял сессию — синхронизируем модель.
    return onSessionChange((s) => (s ? received(s) : lost()));
  }, [start, received, lost]);

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HotelsPage />} />
        <Route path="hotels/:id" element={<HotelPage />} />
        <Route path="login" element={<GuestOnly><LoginPage /></GuestOnly>} />
        <Route path="register" element={<GuestOnly><RegisterPage /></GuestOnly>} />
        <Route path="forbidden" element={<ForbiddenPage />} />
        <Route element={<RequireAuth />}>
          <Route path="cabinet/profile" element={<ProfilePage />} />
          <Route path="cabinet/notifications" element={<NotificationsPage />} />
          <Route element={<RequireRole roles={['customer']} />}>
            <Route path="cabinet/bookings" element={<MyBookingsPage />} />
          </Route>
          <Route element={<RequireRole roles={['hotel_manager', 'admin']} />}>
            <Route path="manage/hotels" element={<ManageHotelsPage />} />
            <Route path="manage/bookings" element={<ManageBookingsPage />} />
          </Route>
          <Route element={<RequireRole roles={['admin']} />}>
            <Route path="manage/hotels/new" element={<HotelEditPage />} />
            <Route path="admin/users" element={<UsersPage />} />
          </Route>
          <Route element={<RequireRole roles={['hotel_manager', 'admin']} />}>
            <Route path="manage/hotels/:id" element={<HotelEditPage />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
