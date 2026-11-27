import { describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp } from '@/test/render';
import { db } from '@/test/gateway';

describe('клиент: от поиска до брони и истории заказов', () => {
  it('гость входит, бронирует номер и видит его в «Моих заказах»', async () => {
    const user = userEvent.setup();
    renderApp('/');

    // каталог доступен гостю
    expect(await screen.findByRole('link', { name: 'Морской бриз' })).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'Морской бриз' }));

    await user.clear(await screen.findByLabelText('Заезд'));
    await user.type(screen.getByLabelText('Заезд'), '2099-07-01');
    await user.clear(screen.getByLabelText('Выезд'));
    await user.type(screen.getByLabelText('Выезд'), '2099-07-04');
    await user.click(screen.getByRole('button', { name: 'Показать номера' }));

    // гостю предлагают войти, вместо кнопки брони
    const offers = await screen.findByRole('region', { name: 'Свободные номера' });
    await user.click(within(offers).getByRole('link', { name: 'Войти, чтобы забронировать' }));

    await user.type(await screen.findByLabelText('Email'), 'anna@example.com');
    await user.type(screen.getByLabelText('Пароль'), 'password1');
    await user.click(screen.getByRole('button', { name: 'Войти' }));

    // после входа возвращаемся на страницу отеля
    await user.click(await screen.findByRole('button', { name: 'Показать номера' }));
    const region = await screen.findByRole('region', { name: 'Свободные номера' });
    expect(within(region).getByText(/до 2 гостей · свободно 5 из 5/)).toBeInTheDocument();
    await user.click(within(region).getByRole('button', { name: 'Забронировать' }));

    const dialog = await screen.findByRole('dialog', { name: 'Подтверждение брони' });
    await user.click(within(dialog).getByRole('button', { name: 'Подтвердить' }));
    expect(await screen.findByRole('dialog', { name: 'Номер забронирован' })).toBeInTheDocument();
    expect(db.reservations).toHaveLength(4);

    // свободных номеров стало меньше
    await waitFor(() => expect(within(screen.getByRole('region', { name: 'Свободные номера' })).getByText(/свободно 4 из 5/)).toBeInTheDocument());

    await user.click(screen.getByRole('link', { name: 'К моим броням' }));
    expect(await screen.findByRole('heading', { name: 'Мои заказы' })).toBeInTheDocument();
    expect(await screen.findByRole('tab', { name: 'Предстоящие (2)' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getAllByRole('article', { name: 'Бронь Морской бриз' })).toHaveLength(2);
  });

  it('клиент отменяет бронь, и она уходит в историю', async () => {
    const user = userEvent.setup();
    renderApp('/cabinet/bookings', { as: 'customer' });

    expect(await screen.findByRole('tab', { name: 'Предстоящие (1)' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'История (2)' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Отменить' }));
    const dialog = await screen.findByRole('dialog', { name: 'Отменить бронь?' });
    await user.type(within(dialog).getByLabelText('Причина (необязательно)'), 'Сменились планы');
    await user.click(within(dialog).getByRole('button', { name: 'Отменить бронь' }));

    expect(await screen.findByRole('tab', { name: 'Предстоящие (0)' })).toBeInTheDocument();
    expect(screen.getByText(/Предстоящих поездок нет/)).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'История (3)' }));
    expect(screen.getByText('Причина отмены: Сменились планы')).toBeInTheDocument();
  });

  it('счётчик уведомлений обнуляется после «Прочитать все»', async () => {
    const user = userEvent.setup();
    renderApp('/cabinet/notifications', { as: 'customer' });
    expect(await screen.findByRole('link', { name: 'Уведомления: 1' })).toBeInTheDocument();
    expect(await screen.findByRole('article', { name: 'Бронь подтверждена' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Прочитать все' }));
    expect(await screen.findByRole('link', { name: 'Уведомления: 0' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Отметить прочитанным' })).not.toBeInTheDocument();
  });

  it('клиент редактирует профиль', async () => {
    const user = userEvent.setup();
    renderApp('/cabinet/profile', { as: 'customer' });
    const name = await screen.findByLabelText('Имя и фамилия');
    await waitFor(() => expect(name).toHaveValue('Анна Клиентова'));
    await user.clear(name);
    await user.type(name, 'Анна Путешественница');
    await user.click(screen.getByRole('button', { name: 'Сохранить' }));
    expect(await screen.findByText('Профиль сохранён')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Анна Путешественница' })).toBeInTheDocument();
  });

  it('клиенту закрыты разделы менеджера и админа', async () => {
    renderApp('/admin/users', { as: 'customer' });
    expect(await screen.findByRole('heading', { name: 'Нет доступа' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Пользователи' })).not.toBeInTheDocument();
  });
});
