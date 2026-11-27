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

  it('новая бронь видна в кабинете сразу, даже если модель чтения ещё не догнала', async () => {
    const user = userEvent.setup();
    db.projectionLag = true;
    renderApp('/hotels/h-mount', { as: 'customer' });
    await user.click(await screen.findByRole('button', { name: 'Показать номера' }));
    await user.click(await screen.findByRole('button', { name: 'Забронировать' }));
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Подтвердить' }));
    await user.click(await screen.findByRole('link', { name: 'К моим броням' }));

    expect(await screen.findByRole('article', { name: 'Бронь Горный приют' })).toBeInTheDocument();
    expect(db.projected.some((r) => r.hotel_name === 'Горный приют')).toBe(false);
  });

  it('показывает сводку кабинета и запрещает отмену в день заезда', async () => {
    db.reservations.push({ ...db.reservations[0]!, id: 'r-now', check_in: '2000-01-01', check_out: '2099-12-31' });
    db.projected = structuredClone(db.reservations);
    renderApp('/cabinet/bookings', { as: 'customer' });
    expect(await screen.findByRole('figure', { name: 'Предстоит поездок' })).toHaveTextContent('1');
    expect(screen.getByRole('figure', { name: 'Сейчас в поездке' })).toHaveTextContent('1');
    await screen.findByRole('tab', { name: 'Предстоящие (2)' });
    expect(screen.getAllByRole('button', { name: 'Отменить' })).toHaveLength(1);
    expect(screen.getByText('Отмена возможна только до дня заезда')).toBeInTheDocument();
  });

  it('клиент меняет пароль', async () => {
    const user = userEvent.setup();
    renderApp('/cabinet/profile', { as: 'customer' });
    const form = await screen.findByRole('form', { name: 'Смена пароля' });
    await user.type(within(form).getByLabelText('Текущий пароль'), 'wrong-one');
    await user.type(within(form).getByLabelText('Новый пароль'), 'new-password');
    await user.click(within(form).getByRole('button', { name: 'Сменить пароль' }));
    expect(await within(form).findByText('Неверный текущий пароль')).toBeInTheDocument();
    await user.clear(within(form).getByLabelText('Текущий пароль'));
    await user.type(within(form).getByLabelText('Текущий пароль'), 'password1');
    await user.click(within(form).getByRole('button', { name: 'Сменить пароль' }));
    expect(await within(form).findByText('Пароль изменён')).toBeInTheDocument();
    expect(db.users.find((u) => u.id === 'u-cust')?.password).toBe('new-password');
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
