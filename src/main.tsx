import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from '@/app/App';
import '@/app/styles.css';

async function enableMocks() {
  // npm run dev:mock — фронт работает без бэкенда, на фейковом gateway из тестов.
  if (import.meta.env.VITE_MOCK !== '1') return;
  const { setupWorker } = await import('msw/browser');
  const { handlers } = await import('@/test/gateway');
  await setupWorker(...handlers).start({ onUnhandledRequest: 'bypass' });
}

enableMocks().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>,
  );
});
