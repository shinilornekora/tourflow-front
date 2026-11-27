import { createEvent, createStore, sample } from 'effector';
import { createGate } from 'effector-react';
import { api, type HotelQuery } from '@/shared/api/endpoints';
import { createRequest } from '@/shared/lib/request';

export interface Filters {
  q: string;
  city: string;
  stars_min: number;
  guests: number;
  sort: string;
}

export const initialFilters: Filters = { q: '', city: '', stars_min: 0, guests: 0, sort: '' };

export const HotelsGate = createGate<void>();

export const filterChanged = createEvent<Partial<Filters>>();
export const searchSubmitted = createEvent();
export const filtersReset = createEvent();
export const pageChanged = createEvent<number>();

export const $filters = createStore<Filters>(initialFilters)
  .on(filterChanged, (f, patch) => ({ ...f, ...patch }))
  .reset(filtersReset);
export const $page = createStore(1)
  .on(pageChanged, (_, p) => p)
  .reset([searchSubmitted, filtersReset]);

export const PAGE_SIZE = 12;

export const hotelsQuery = createRequest((q: HotelQuery) => api.hotels(q));
export const citiesQuery = createRequest((_: void) => api.cities());

export const $hotels = hotelsQuery.$data.map((d) => d?.items ?? []);
export const $total = hotelsQuery.$data.map((d) => d?.total ?? 0);

sample({
  clock: [HotelsGate.open, searchSubmitted, filtersReset, pageChanged],
  source: { f: $filters, page: $page },
  fn: ({ f, page }): HotelQuery => ({ ...f, page, page_size: PAGE_SIZE }),
  target: hotelsQuery.start,
});

sample({ clock: HotelsGate.open, fn: () => undefined, target: citiesQuery.start });
