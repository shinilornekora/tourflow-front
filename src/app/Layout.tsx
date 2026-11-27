import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/widgets/sidebar';
import { Spinner } from '@/shared/ui';

/** Каркас приложения: боковое меню и область страницы. */
export function Layout() {
  return (
    <div className="shell">
      <Sidebar />
      <main className="main">
        <Suspense fallback={<Spinner />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}
