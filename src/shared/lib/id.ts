/**
 * Случайный ключ идемпотентности. crypto.randomUUID есть только в
 * «безопасном контексте» (https или localhost) — при открытии SPA по
 * http://192.168.x.x его нет, поэтому есть запасной вариант на getRandomValues.
 */
export function newKey(): string {
  const c: Crypto = globalThis.crypto;
  if (typeof c.randomUUID === 'function' && window.isSecureContext) return c.randomUUID();
  const b = new Uint8Array(16);
  c.getRandomValues(b);
  return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
}
