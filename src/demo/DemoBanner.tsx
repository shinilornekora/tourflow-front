import { useState } from 'react';
import { demoAccounts, resetDemo } from './demo';

/** Плашка демо-режима: подсказывает учётки ролей и сбрасывает данные. */
export function DemoBanner() {
  const [open, setOpen] = useState(false);
  return (
    <div className="container" style={{ paddingTop: 12 }}>
      <div className="neu-inset row-between" style={{ padding: '10px 16px' }}>
        <span>
          <b>Демо-режим:</b> бэкенд эмулируется в браузере, данные хранятся только у вас.
        </span>
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
            Сбросить данные
          </button>
        </div>
      </div>
      {open && (
        <div className="neu-card" style={{ marginTop: 12 }}>
          <table className="table">
            <tbody>
              {demoAccounts.map((a) => (
                <tr key={a.email}>
                  <td>
                    <b>{a.role}</b>
                  </td>
                  <td>{a.email}</td>
                  <td>{a.password}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
