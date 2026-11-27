import { RegisterForm } from '@/features/auth-register';
import { Card } from '@/shared/ui';

export default function RegisterPage() {
  return (
    <div className="page" style={{ maxWidth: 480, margin: '0 auto' }}>
      <Card>
        <RegisterForm />
      </Card>
    </div>
  );
}
