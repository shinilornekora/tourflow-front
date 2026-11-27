import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp } from '@/test/render';

describe('вход и регистрация', () => {
  it('защищённый раздел отправляет гостя на вход', async () => {
    renderApp('/cabinet/bookings');
    expect(await screen.findByRole('heading', { name: 'Вход' })).toBeInTheDocument();
  });

  it('показывает ошибку неверного пароля', async () => {
    const user = userEvent.setup();
    renderApp('/login');
    await user.type(await screen.findByLabelText('Email'), 'anna@example.com');
    await user.type(screen.getByLabelText('Пароль'), 'wrong-pass');
    await user.click(screen.getByRole('button', { name: 'Войти' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Неверный email или пароль');
  });

  it('регистрация с занятым email подсвечивает поле', async () => {
    const user = userEvent.setup();
    renderApp('/register');
    await user.type(await screen.findByLabelText('Имя и фамилия'), 'Двойник');
    await user.type(screen.getByLabelText('Email'), 'anna@example.com');
    await user.type(screen.getByLabelText('Пароль'), 'password1');
    await user.click(screen.getByRole('button', { name: 'Создать аккаунт' }));
    expect(await screen.findByText('Этот email уже зарегистрирован')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
  });

  it('после регистрации клиент попадает в каталог с личным меню', async () => {
    const user = userEvent.setup();
    renderApp('/register');
    await user.type(await screen.findByLabelText('Имя и фамилия'), 'Пётр Новый');
    await user.type(screen.getByLabelText('Email'), 'petr@example.com');
    await user.type(screen.getByLabelText('Пароль'), 'password1');
    await user.click(screen.getByRole('button', { name: 'Создать аккаунт' }));
    expect(await screen.findByRole('link', { name: 'Мои заказы' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Пётр Новый' })).toBeInTheDocument();
  });

  it('выход возвращает гостевое меню', async () => {
    const user = userEvent.setup();
    renderApp('/', { as: 'customer' });
    await user.click(await screen.findByRole('button', { name: 'Выйти' }));
    expect(await screen.findByRole('link', { name: 'Войти' })).toBeInTheDocument();
  });
});
