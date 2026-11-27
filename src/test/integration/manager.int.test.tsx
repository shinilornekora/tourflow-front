import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp } from '@/test/render';
import { db } from '@/test/gateway';

describe('менеджер отеля', () => {
  it('видит только назначенные ему отели и не может создавать новые', async () => {
    renderApp('/manage/hotels', { as: 'manager' });
    expect(await screen.findByRole('heading', { name: 'Мои отели' })).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: 'Морской бриз' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Горный приют' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '+ Добавить отель' })).not.toBeInTheDocument();
  });

  it('не может открыть создание отеля и список пользователей', async () => {
    renderApp('/manage/hotels/new', { as: 'manager' });
    expect(await screen.findByRole('heading', { name: 'Нет доступа' })).toBeInTheDocument();
  });

  it('архивирует тип номера своего отеля', async () => {
    const user = userEvent.setup();
    renderApp('/manage/hotels/h-sea', { as: 'manager' });
    await user.click(await screen.findByRole('button', { name: 'В архив' }));
    expect(await screen.findByText('В архиве')).toBeInTheDocument();
    expect(db.roomTypes.find((r) => r.id === 'rt-std')?.status).toBe('archived');
    // назначать менеджеров может только админ
    expect(screen.queryByRole('heading', { name: 'Менеджеры отеля' })).not.toBeInTheDocument();
  });

  it('фильтрует и отменяет брони гостей', async () => {
    const user = userEvent.setup();
    renderApp('/manage/bookings', { as: 'manager' });
    await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(3));
    await user.selectOptions(screen.getByLabelText('Статус'), 'confirmed');
    await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(2));
    await user.click(screen.getAllByRole('button', { name: 'Отменить' })[0]!);
    await waitFor(() => expect(screen.getAllByRole('button', { name: 'Отменить' })).toHaveLength(1));
    expect(db.reservations.filter((r) => r.status === 'cancelled')).toHaveLength(2);
  });
});
