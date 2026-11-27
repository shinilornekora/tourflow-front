import { describe, expect, it, vi } from 'vitest';
import { fetchAll, MAX_PAGE_SIZE } from './endpoints';

describe('fetchAll', () => {
  it('собирает все страницы по 50 записей (лимит gateway)', async () => {
    const all = Array.from({ length: 120 }, (_, i) => i);
    const load = vi.fn(async (page: number, size: number) => ({
      items: all.slice((page - 1) * size, page * size),
      page,
      page_size: size,
      total: all.length,
    }));
    const res = await fetchAll(load);
    expect(res.items).toEqual(all);
    expect(load).toHaveBeenCalledTimes(3);
    expect(load).toHaveBeenCalledWith(1, MAX_PAGE_SIZE);
  });

  it('останавливается на пустой странице и на лимите страниц', async () => {
    const empty = vi.fn(async () => ({ items: [], page: 1, page_size: 50, total: 999 }));
    expect((await fetchAll(empty)).items).toEqual([]);
    expect(empty).toHaveBeenCalledTimes(1);
    const endless = vi.fn(async () => ({ items: [1], page: 1, page_size: 50, total: 999 }));
    await fetchAll(endless, 4);
    expect(endless).toHaveBeenCalledTimes(4);
  });
});
