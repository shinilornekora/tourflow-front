import { useState } from 'react';
import { demoAccounts, resetDemo } from './demo';

/** Блок демо-режима в боковом меню: учётки ролей и сброс данных. */
export function DemoBanner() {
  const [open, setOpen] = useState(false);
  return (
    <section className="demo-panel neu-inset" aria-label="Демо-режим">
      <p className="demo-title">
        <b>Демо-режим</b>
        <span className="muted">бэкенд эмулируется в браузере, данные хранятся только у вас</span>
      </p>
      <div className="row" style={{ gap: 8 }}>
        <button
          type="button"
          className="neu-btn small"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
        >
          Демо-входы
        </button>
        <button
          type="button"
          className="neu-btn small"
          onClick={() => {
            resetDemo();
            window.location.reload();
          }}
        >
          Сбросить
        </button>
      </div>
      {open && (
        <ul className="demo-accounts">
          {demoAccounts.map((a) => (
            <li key={a.email}>
              <b>{a.role}</b>
              <span>{a.email}</span>
              <span className="muted">{a.password}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
