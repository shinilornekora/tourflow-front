import { describe, expect, it } from 'vitest';
import { visibleOffers } from './RoomOffers';

describe('видимость номеров по ролям', () => {
  const offers = [
    { room_type_id: 'a', free: 0 },
    { room_type_id: 'b', free: 3 },
  ];
  it('клиент и гость не видят занятые на выбранные даты категории', () => {
    expect(visibleOffers(offers, false).map((o) => o.room_type_id)).toEqual(['b']);
  });
  it('менеджер и админ видят все категории с остатками', () => {
    expect(visibleOffers(offers, true)).toHaveLength(2);
  });
});
