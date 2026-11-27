import { useGate, useUnit } from 'effector-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ReservationCard } from '@/entities/reservation/ReservationCard';
import { Alert, Button, Empty, Modal, Spinner, Stat, Tabs, TextField } from '@/shared/ui';
import { formatDate, formatMoney } from '@/shared/lib/format';
import * as m from './model';

export default function MyBookingsPage() {
  useGate(m.MyBookingsGate);
  const [tab, split, visible, pending, error] = useUnit([
    m.$tab,
    m.$split,
    m.$visible,
    m.listQuery.$pending,
    m.listQuery.$error,
  ]);
  const [setTab, askCancel, summary] = useUnit([m.tabChanged, m.cancelClicked, m.summaryQuery.$data]);

  return (
    <div className="page stack">
      <div className="row-between">
        <h1 style={{ margin: 0 }}>Мои заказы</h1>
        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            { value: 'active', label: `Предстоящие (${split.active.length})` },
            { value: 'history', label: `История (${split.history.length})` },
          ]}
        />
      </div>
      {summary && (
        <div className="stats" aria-label="Сводка по заказам" role="group">
          <Stat label="Предстоит поездок" value={summary.upcoming} />
          <Stat label="Сейчас в поездке" value={summary.in_progress} />
          <Stat label="Завершено" value={summary.completed} />
          <Stat label="Потрачено" value={formatMoney(summary.total_spent)} />
        </div>
      )}
      {summary?.next_check_in && (
        <p className="muted">Ближайший заезд: {formatDate(summary.next_check_in)}</p>
      )}
      {error && <Alert>{error}</Alert>}
      {pending && visible.length === 0 ? (
        <Spinner />
      ) : visible.length === 0 ? (
        <Empty>
          {tab === 'active' ? (
            <>
              Предстоящих поездок нет. <Link to="/">Найти отель</Link>
            </>
          ) : (
            'История заказов пуста'
          )}
        </Empty>
      ) : (
        <div className="stack">
          {visible.map((r) => (
            <ReservationCard
              key={r.id}
              r={r}
              actions={
                m.canCustomerCancel(r) ? (
                  <Button small variant="danger" onClick={() => askCancel(r)}>
                    Отменить
                  </Button>
                ) : tab === 'active' ? (
                  <span className="muted">Отмена возможна только до дня заезда</span>
                ) : undefined
              }
            />
          ))}
        </div>
      )}
      <CancelModal />
    </div>
  );
}

function CancelModal() {
  const [target, pending, error, dismiss, confirm] = useUnit([
    m.$toCancel,
    m.cancelRequest.$pending,
    m.cancelRequest.$error,
    m.cancelDismissed,
    m.cancelConfirmed,
  ]);
  const [reason, setReason] = useState('');
  if (!target) return null;
  return (
    <Modal title="Отменить бронь?" onClose={dismiss}>
      <div className="stack">
        <p>
          {target.hotel_name}, {target.room_type_name}
        </p>
        <TextField
          label="Причина (необязательно)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        {error && <Alert>{error}</Alert>}
        <div className="row">
          <Button onClick={dismiss}>Не отменять</Button>
          <Button variant="danger" disabled={pending} onClick={() => confirm(reason)}>
            Отменить бронь
          </Button>
        </div>
      </div>
    </Modal>
  );
}
