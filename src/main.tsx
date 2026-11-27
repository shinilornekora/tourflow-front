import { StrictMode, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { routes } from '@/app/routes';
import { SidebarSlot } from '@/app/sidebarSlot';
import '@/app/styles.css';

// На github.io приложение живёт в подпапке /tourflow-front/.
const router = createBrowserRouter(routes, { basename: import.meta.env.BASE_URL.replace(/\/$/, '') || '/' });

async function boot() {
  let banner: ReactNode = null;
  // Демо (GitHub Pages, npm run dev:mock): фронт работает без бэкенда, на MSW.
  // Условие записано прямо через import.meta.env, чтобы оба сборщика вырезали
  // демо-код (MSW, фейковый gateway) из обычной сборки.
  if (import.meta.env.VITE_MOCK === '1') {
    const [{ startDemo }, { DemoBanner }] = await Promise.all([
      import('@/demo/demo'),
      import('@/demo/DemoBanner'),
    ]);
    await startDemo();
    banner = <DemoBanner />;
  }
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <SidebarSlot.Provider value={banner}>
        <RouterProvider router={router} />
      </SidebarSlot.Provider>
    </StrictMode>,
  );
}

void boot();
