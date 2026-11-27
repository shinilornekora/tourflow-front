// Фильтры и сортировка каталога. Сам запрос делает виджет hotel-catalog.
import { createEvent, createStore } from 'effector';

export interface Filters {
  q: string;
  city: string;
  stars_min: number;
  guests: number;
  sort: string;
}

export const initialFilters: Filters = { q: '', city: '', stars_min: 0, guests: 0, sort: '' };

export const filterChanged = createEvent<Partial<Filters>>();
export const searchSubmitted = createEvent();
export const filtersReset = createEvent();

export const $filters = createStore<Filters>(initialFilters)
  .on(filterChanged, (f, patch) => ({ ...f, ...patch }))
  .reset(filtersReset);
