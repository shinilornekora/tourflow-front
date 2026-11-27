import { render } from '@testing-library/react';
import { fork, type Scope } from 'effector';
import { Provider } from 'effector-react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { routes } from '@/app/routes';
import { db } from './gateway';
import { users } from './fixtures';
import { SESSION_HINT } from '@/entities/session/model';

/**
 * Рендерит всё приложение в изолированном scope Effector:
 * у каждого теста своё состояние сторов, как у отдельной вкладки браузера.
 */
export function renderApp(path = '/', opts: { as?: keyof typeof users } = {}) {
  if (opts.as) {
    // «Браузер с живой сессией»: refresh-cookie есть, SPA восстановит её сама.
    db.refreshUser = users[opts.as]!.id;
    localStorage.setItem(SESSION_HINT, '1');
  }
  const scope: Scope = fork();
  const utils = render(
    <Provider value={scope}>
      <RouterProvider router={createMemoryRouter(routes, { initialEntries: [path] })} />
    </Provider>,
  );
  return { scope, ...utils };
}
