// Каталог: фильтры (фича hotel-filter) + запрос отелей + пагинация.
import { createEvent, createStore, sample } from 'effector';
import { createGate } from 'effector-react';
import { api, type HotelQuery } from '@/shared/api/endpoints';
import { createRequest } from '@/shared/lib/request';
import { $filters, filtersReset, searchSubmitted } from '@/features/hotel-filter';

export const PAGE_SIZE = 12;

export const CatalogGate = createGate<void>();
export const pageChanged = createEvent<number>();

export const $page = createStore(1)
  .on(pageChanged, (_, p) => p)
  .reset([searchSubmitted, filtersReset]);

export const hotelsQuery = createRequest((q: HotelQuery) => api.hotels(q));
export const citiesQuery = createRequest((_: void) => api.cities());

export const $hotels = hotelsQuery.$data.map((d) => d?.items ?? []);
export const $total = hotelsQuery.$data.map((d) => d?.total ?? 0);
export const $cities = citiesQuery.$data.map((d) => d?.items ?? []);

sample({
  clock: [CatalogGate.open, searchSubmitted, filtersReset, pageChanged],
  source: { f: $filters, page: $page },
  fn: ({ f, page }): HotelQuery => ({ ...f, page, page_size: PAGE_SIZE }),
  target: hotelsQuery.start,
});

sample({ clock: CatalogGate.open, fn: () => undefined, target: citiesQuery.start });
