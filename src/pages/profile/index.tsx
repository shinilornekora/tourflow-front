import { ProfileForm } from '@/features/profile-edit';
import { PasswordForm } from '@/features/profile-change-password';

export default function ProfilePage() {
  return (
    <div className="page stack" style={{ maxWidth: 560 }}>
      <ProfileForm />
      <PasswordForm />
    </div>
  );
}
