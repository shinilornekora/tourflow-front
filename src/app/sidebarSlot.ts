import { createContext, type ReactNode } from 'react';

/** Дополнительный блок внизу бокового меню (в демо-режиме — демо-входы и сброс данных). */
export const SidebarSlot = createContext<ReactNode>(null);
