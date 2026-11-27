import { useNavigate } from 'react-router-dom';
import { useUnit } from 'effector-react';
import { logoutFx } from '@/entities/session';
import { Button } from '@/shared/ui';

export function LogoutButton() {
  const logout = useUnit(logoutFx);
  const navigate = useNavigate();
  return (
    <Button small onClick={() => void logout().finally(() => navigate('/'))}>
      Выйти
    </Button>
  );
}
