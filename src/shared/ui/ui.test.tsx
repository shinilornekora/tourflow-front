import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button, Modal, Stars, Tabs, TextField } from './index';

describe('неоморфный UI-кит', () => {
  it('поле связано с подписью и показывает ошибку', () => {
    render(<TextField label="Email" error="Неверный формат" defaultValue="" />);
    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Неверный формат')).toBeInTheDocument();
  });

  it('кнопка получает класс варианта', () => {
    render(
      <Button variant="danger" small>
        Удалить
      </Button>,
    );
    expect(screen.getByRole('button', { name: 'Удалить' })).toHaveClass('neu-btn', 'danger', 'small');
  });

  it('вкладки переключаются и отмечают выбранную', async () => {
    const onChange = vi.fn();
    render(
      <Tabs
        value="a"
        onChange={onChange}
        items={[
          { value: 'a', label: 'А' },
          { value: 'b', label: 'Б' },
        ]}
      />,
    );
    expect(screen.getByRole('tab', { name: 'А' })).toHaveAttribute('aria-selected', 'true');
    await userEvent.click(screen.getByRole('tab', { name: 'Б' }));
    expect(onChange).toHaveBeenCalledWith('b');
  });

  it('модалка закрывается по клику на фон, но не по содержимому', async () => {
    const onClose = vi.fn();
    render(
      <Modal title="Окно" onClose={onClose}>
        <p>Текст</p>
      </Modal>,
    );
    await userEvent.click(screen.getByText('Текст'));
    expect(onClose).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('dialog').parentElement!);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('звёзды озвучивают рейтинг', () => {
    render(<Stars n={4} />);
    expect(screen.getByLabelText('4 звезд')).toBeInTheDocument();
  });
});
