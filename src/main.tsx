import { StrictMode, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from '@/app/App';
import '@/app/styles.css';

const isDemo = import.meta.env.VITE_MOCK === '1';

async function boot() {
  let banner: ReactNode = null;
  // Демо (GitHub Pages, npm run dev:mock): фронт работает без бэкенда, на MSW.
  if (isDemo) {
    const [{ startDemo }, { DemoBanner }] = await Promise.all([import('@/demo/demo'), import('@/demo/DemoBanner')]);
    await startDemo();
    banner = <DemoBanner />;
  }
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      {/* На github.io приложение живёт в подпапке /tourflow-front/. */}
      <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        {banner}
        <App />
      </BrowserRouter>
    </StrictMode>,
  );
}

void boot();
