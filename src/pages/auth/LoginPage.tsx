import { LoginForm } from '@/features/auth-login';
import { Card } from '@/shared/ui';

export default function LoginPage() {
  return (
    <div className="page" style={{ maxWidth: 440, margin: '0 auto' }}>
      <Card>
        <LoginForm />
      </Card>
    </div>
  );
}
