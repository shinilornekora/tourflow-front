import { useEffect } from 'react';
import { useUnit } from 'effector-react';
import { formatDate, formatMoney } from '@/shared/lib/format';
import { Stat } from '@/shared/ui';
import { customerSummaryQuery, hotelSummaryQuery } from './model';

export function CustomerSummary() {
  const [summary, load] = useUnit([customerSummaryQuery.$data, customerSummaryQuery.start]);
  useEffect(() => {
    load();
  }, [load]);
  if (!summary) return null;
  return (
    <>
      <div className="stats" aria-label="Сводка по заказам" role="group">
        <Stat label="Предстоит поездок" value={summary.upcoming} />
        <Stat label="Сейчас в поездке" value={summary.in_progress} />
        <Stat label="Завершено" value={summary.completed} />
        <Stat label="Потрачено" value={formatMoney(summary.total_spent)} />
      </div>
      {summary.next_check_in && <p className="muted">Ближайший заезд: {formatDate(summary.next_check_in)}</p>}
    </>
  );
}

/** hotelId '' — по всем отелям менеджера. */
export function HotelSummary({ hotelId }: { hotelId: string }) {
  const [summary, load] = useUnit([hotelSummaryQuery.$data, hotelSummaryQuery.start]);
  useEffect(() => {
    load(hotelId);
  }, [load, hotelId]);
  if (!summary) return null;
  return (
    <div className="stats" role="group" aria-label="Сводка по броням">
      <Stat label="Подтверждено" value={summary.confirmed} />
      <Stat label="Предстоит заездов" value={summary.upcoming} />
      <Stat label="Отменено" value={summary.cancelled} />
      <Stat label="Выручка" value={formatMoney(summary.revenue)} />
    </div>
  );
}
