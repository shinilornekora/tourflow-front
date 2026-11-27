import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp } from '@/test/render';
import { db } from '@/test/gateway';

describe('администратор', () => {
  it('добавляет отель, тип номера и назначает менеджера', async () => {
    const user = userEvent.setup();
    renderApp('/manage/hotels', { as: 'admin' });

    expect(await screen.findByRole('heading', { name: 'Все отели' })).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: '+ Добавить отель' }));

    const form = await screen.findByRole('form', { name: 'Данные отеля' });
    await user.type(within(form).getByLabelText('Название'), 'Озёрный');
    await user.type(within(form).getByLabelText('Город'), 'Казань');
    await user.type(within(form).getByLabelText('Адрес'), 'Набережная, 5');
    await user.selectOptions(within(form).getByLabelText('Звёзды'), '5');
    await user.click(within(form).getByRole('button', { name: 'Создать отель' }));

    expect(await screen.findByRole('heading', { name: 'Озёрный' })).toBeInTheDocument();
    expect(db.hotels.find((h) => h.name === 'Озёрный')).toMatchObject({ city: 'Казань', stars: 5 });

    // тип номера
    await user.click(screen.getByRole('button', { name: '+ Тип номера' }));
    const dialog = await screen.findByRole('dialog', { name: 'Новый тип номера' });
    await user.type(within(dialog).getByLabelText('Название'), 'Люкс');
    await user.clear(within(dialog).getByLabelText('Цена за ночь, ₽'));
    await user.type(within(dialog).getByLabelText('Цена за ночь, ₽'), '9900');
    await user.type(within(dialog).getByLabelText('Удобства через запятую'), 'Wi-Fi, Вид на озеро');
    await user.click(within(dialog).getByRole('button', { name: 'Сохранить' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByText(/9\s900\s₽ \/ ночь/)).toBeInTheDocument();
    expect(db.roomTypes.find((r) => r.name === 'Люкс')?.amenities).toEqual(['Wi-Fi', 'Вид на озеро']);

    // менеджер
    const select = await screen.findByLabelText('Назначить менеджера');
    await waitFor(() => expect(within(select).getAllByRole('option')).toHaveLength(2));
    await user.selectOptions(select, 'u-man');
    await user.click(screen.getByRole('button', { name: 'Назначить' }));
    expect(await screen.findByText('Максим Менеджеров')).toBeInTheDocument();
    expect(db.hotels.find((h) => h.name === 'Озёрный')?.manager_ids).toEqual(['u-man']);
  });

  it('отключает отель — он пропадает из каталога', async () => {
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderApp('/manage/hotels/h-mount', { as: 'admin' });
    await user.click(await screen.findByRole('button', { name: 'Отключить' }));
    expect(confirm).toHaveBeenCalledWith(expect.stringContaining('будущие брони будут отменены'));
    expect(await screen.findByText('Отключён')).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'Отели' }));
    expect(await screen.findByRole('link', { name: 'Морской бриз' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Горный приют' })).not.toBeInTheDocument();
  });

  it('меняет роль пользователя', async () => {
    const user = userEvent.setup();
    renderApp('/admin/users', { as: 'admin' });
    const role = await screen.findByLabelText('Роль anna@example.com');
    await user.selectOptions(role, 'hotel_manager');
    await waitFor(() => expect(db.users.find((u) => u.id === 'u-cust')?.role).toBe('hotel_manager'));
    expect(role).toHaveValue('hotel_manager');
  });

  it('админ не может бронировать номера', async () => {
    const user = userEvent.setup();
    renderApp('/hotels/h-sea', { as: 'admin' });
    await user.click(await screen.findByRole('button', { name: 'Показать номера' }));
    expect(await screen.findByText('Бронируют только клиенты')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Забронировать' })).not.toBeInTheDocument();
  });
});
