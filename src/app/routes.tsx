// Маршруты приложения: объект-конфиг для createBrowserRouter (data router).
// В тестах тот же массив отдаётся в createMemoryRouter.
import { lazy, useEffect } from 'react';
import type { RouteObject } from 'react-router-dom';
import { useUnit } from 'effector-react';
import { appStarted, sessionLost, sessionReceived } from '@/entities/session/model';
import { onSessionChange } from '@/shared/api/client';
import { ErrorPage, ForbiddenPage, NotFoundPage } from '@/pages/not-found';
import { GuestOnly, RequireAuth, RequireRole } from './guards';
import { Layout } from './Layout';

/** Все пути приложения в одном месте. */
export const RoutePath = {
  hotels: '/',
  hotel: '/hotels/:id',
  login: '/login',
  register: '/register',
  forbidden: '/forbidden',
  profile: '/cabinet/profile',
  notifications: '/cabinet/notifications',
  myBookings: '/cabinet/bookings',
  manageHotels: '/manage/hotels',
  hotelNew: '/manage/hotels/new',
  hotelEdit: '/manage/hotels/:id',
  hotelAudit: '/manage/hotels/:id/audit',
  manageBookings: '/manage/bookings',
  users: '/admin/users',
  notFound: '*',
} as const;

// Каждая страница — отдельный чанк: админские страницы клиент не скачивает.
const HotelsPage = lazy(() => import(/* webpackChunkName: "page-hotels" */ '@/pages/hotels'));
const HotelPage = lazy(() => import(/* webpackChunkName: "page-hotel" */ '@/pages/hotel'));
const LoginPage = lazy(() => import(/* webpackChunkName: "page-auth-LoginPage" */ '@/pages/auth/LoginPage'));
const RegisterPage = lazy(
  () => import(/* webpackChunkName: "page-auth-RegisterPage" */ '@/pages/auth/RegisterPage'),
);
const ProfilePage = lazy(() => import(/* webpackChunkName: "page-profile" */ '@/pages/profile'));
const MyBookingsPage = lazy(() => import(/* webpackChunkName: "page-my-bookings" */ '@/pages/my-bookings'));
const NotificationsPage = lazy(
  () => import(/* webpackChunkName: "page-notifications" */ '@/pages/notifications'),
);
const ManageHotelsPage = lazy(
  () => import(/* webpackChunkName: "page-manage-hotels" */ '@/pages/manage-hotels'),
);
const HotelEditPage = lazy(() => import(/* webpackChunkName: "page-hotel-edit" */ '@/pages/hotel-edit'));
const ManageBookingsPage = lazy(
  () => import(/* webpackChunkName: "page-manage-bookings" */ '@/pages/manage-bookings'),
);
const UsersPage = lazy(() => import(/* webpackChunkName: "page-admin-users" */ '@/pages/admin-users'));
const AuditPage = lazy(() => import(/* webpackChunkName: "page-audit" */ '@/pages/audit'));

/** Корневой элемент: восстанавливает сессию и рисует общий layout. */
export function Root() {
  const [start, received, lost] = useUnit([appStarted, sessionReceived, sessionLost]);
  useEffect(() => {
    start();
    // Клиент тихо обновил токен или потерял сессию — синхронизируем модель.
    return onSessionChange((s) => (s ? received(s) : lost()));
  }, [start, received, lost]);
  return <Layout />;
}

export const routes: RouteObject[] = [
  {
    path: RoutePath.hotels,
    element: <Root />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <HotelsPage /> },
      { path: RoutePath.hotel, element: <HotelPage /> },
      {
        path: RoutePath.login,
        element: (
          <GuestOnly>
            <LoginPage />
          </GuestOnly>
        ),
      },
      {
        path: RoutePath.register,
        element: (
          <GuestOnly>
            <RegisterPage />
          </GuestOnly>
        ),
      },
      { path: RoutePath.forbidden, element: <ForbiddenPage /> },
      {
        element: <RequireAuth />,
        children: [
          // Личный кабинет есть у всех ролей.
          { path: RoutePath.profile, element: <ProfilePage /> },
          { path: RoutePath.notifications, element: <NotificationsPage /> },
          {
            element: <RequireRole roles={['customer']} />,
            children: [{ path: RoutePath.myBookings, element: <MyBookingsPage /> }],
          },
          {
            element: <RequireRole roles={['admin']} />,
            children: [
              { path: RoutePath.hotelNew, element: <HotelEditPage /> },
              { path: RoutePath.users, element: <UsersPage /> },
            ],
          },
          {
            element: <RequireRole roles={['hotel_manager', 'admin']} />,
            children: [
              { path: RoutePath.manageHotels, element: <ManageHotelsPage /> },
              { path: RoutePath.manageBookings, element: <ManageBookingsPage /> },
              { path: RoutePath.hotelEdit, element: <HotelEditPage /> },
              { path: RoutePath.hotelAudit, element: <AuditPage /> },
            ],
          },
        ],
      },
      { path: RoutePath.notFound, element: <NotFoundPage /> },
    ],
  },
];
