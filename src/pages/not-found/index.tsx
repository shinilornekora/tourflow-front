import { Link, isRouteErrorResponse, useRouteError } from 'react-router-dom';
import { Card } from '@/shared/ui';

export function NotFoundPage() {
  return (
    <div className="page" style={{ maxWidth: 520, margin: '0 auto', textAlign: 'center' }}>
      <Card>
        <h1>404</h1>
        <p className="muted">Такой страницы нет.</p>
        <Link to="/">На главную</Link>
      </Card>
    </div>
  );
}

export function ForbiddenPage() {
  return (
    <div className="page" style={{ maxWidth: 520, margin: '0 auto', textAlign: 'center' }}>
      <Card>
        <h1>Нет доступа</h1>
        <p className="muted">Этот раздел недоступен для вашей роли.</p>
        <Link to="/">На главную</Link>
      </Card>
    </div>
  );
}

/** errorElement роутера: падение рендера или ошибка маршрута не роняет всё приложение. */
export function ErrorPage() {
  const error = useRouteError();
  const text = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : 'Неизвестная ошибка';
  return (
    <div className="container page" style={{ maxWidth: 520, textAlign: 'center' }}>
      <Card>
        <h1>Что-то пошло не так</h1>
        <p className="muted">{text}</p>
        <a href={import.meta.env.BASE_URL}>На главную</a>
      </Card>
    </div>
  );
}
