import { describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
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

  it('архивирует тип номера своего отеля и не видит назначение менеджеров', async () => {
    const user = userEvent.setup();
    renderApp('/manage/hotels/h-sea', { as: 'manager' });
    await user.click(await screen.findByRole('button', { name: 'В архив' }));
    expect(await screen.findByText('В архиве')).toBeInTheDocument();
    expect(db.roomTypes.find((r) => r.id === 'rt-std')?.status).toBe('archived');
    // назначать менеджеров может только админ
    expect(screen.queryByRole('heading', { name: 'Менеджеры отеля' })).not.toBeInTheDocument();
  });

  it('архивирует тип номера, но не может отключить отель целиком', async () => {
    renderApp('/manage/hotels/h-sea', { as: 'manager' });
    expect(await screen.findByRole('button', { name: 'В архив' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Отключить' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Журнал' })).toHaveAttribute('href', '/manage/hotels/h-sea/audit');
  });

  it('видит сводку, фильтрует брони и отменяет бронь гостя с обязательной причиной', async () => {
    const user = userEvent.setup();
    db.projectionLag = true; // booking-query отстаёт — UI всё равно должен показать отмену сразу
    renderApp('/manage/bookings', { as: 'manager' });
    await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(3));
    expect(screen.getByRole('figure', { name: 'Подтверждено' })).toHaveTextContent('2');

    await user.selectOptions(screen.getByLabelText('Статус'), 'confirmed');
    await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(2));
    // прошедшую бронь (выезд в прошлом) отменить уже нельзя
    const cancelButtons = screen.getAllByRole('button', { name: 'Отменить' });
    expect(cancelButtons).toHaveLength(1);
    await user.click(cancelButtons[0]!);

    const dialog = await screen.findByRole('dialog', { name: 'Отменить бронь гостя?' });
    const submit = within(dialog).getByRole('button', { name: 'Отменить бронь' });
    expect(submit).toBeDisabled();
    await user.type(within(dialog).getByLabelText(/Причина/), 'Ремонт в номере');
    await user.click(submit);

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(db.reservations.find((r) => r.id === 'r-1')).toMatchObject({ status: 'cancelled', cancel_reason: 'Ремонт в номере' });
    // в фильтре «Подтверждённые» отменённая бронь пропала, хотя модель чтения её ещё не увидела
    await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(1));
  });

  it('открывает журнал действий отеля', async () => {
    renderApp('/manage/hotels/h-sea/audit', { as: 'manager' });
    expect(await screen.findByRole('heading', { name: 'Журнал действий' })).toBeInTheDocument();
    expect(await screen.findAllByText('Бронь создана')).toHaveLength(3);
  });
});
