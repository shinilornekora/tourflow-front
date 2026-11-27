import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useGate, useUnit } from 'effector-react';
import { ReservationCard } from '@/entities/reservation';
import { CancelBookingButton, CancelBookingModal } from '@/features/booking-cancel';
import { Alert, Empty, Spinner, Tabs } from '@/shared/ui';
import * as m from './model';

/** «Мои заказы»: вкладки, список и отмена. summary — блок между шапкой и списком. */
export function MyReservations({ summary }: { summary?: ReactNode }) {
  useGate(m.MyReservationsGate);
  const [tab, split, visible, pending, error, setTab] = useUnit([
    m.$tab,
    m.$split,
    m.$visible,
    m.listQuery.$pending,
    m.listQuery.$error,
    m.tabChanged,
  ]);

  return (
    <>
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
      {summary}
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
              actions={<CancelBookingButton r={r} showHint={tab === 'active'} />}
            />
          ))}
        </div>
      )}
      <CancelBookingModal />
    </>
  );
}
