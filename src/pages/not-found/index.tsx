import { Link } from 'react-router-dom';
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
