// Неоморфный UI-кит: тонкие обёртки над нативными элементами,
// чтобы тесты могли находить их по ролям и подписям.
import { useId, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';

type Variant = 'default' | 'primary' | 'danger';

export function Button({
  variant = 'default',
  small,
  className = '',
  type = 'button',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; small?: boolean }) {
  const cls = ['neu-btn', variant !== 'default' && variant, small && 'small', className].filter(Boolean).join(' ');
  return <button type={type} className={cls} {...rest} />;
}

export function Card({ children, className = '', as: Tag = 'div' }: { children: ReactNode; className?: string; as?: 'div' | 'section' | 'article' | 'form' }) {
  return <Tag className={`neu-card ${className}`}>{children}</Tag>;
}

interface FieldProps {
  label: string;
  error?: string;
}

export function TextField({ label, error, ...rest }: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} className="neu-input" aria-invalid={Boolean(error) || undefined} {...rest} />
      {error && <em className="error" role="alert">{error}</em>}
    </div>
  );
}

export function TextArea({ label, error, ...rest }: FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <textarea id={id} className="neu-input" {...rest} />
      {error && <em className="error" role="alert">{error}</em>}
    </div>
  );
}

export function Select({
  label,
  options,
  ...rest
}: FieldProps & SelectHTMLAttributes<HTMLSelectElement> & { options: { value: string; label: string }[] }) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select id={id} className="neu-input" {...rest}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function Badge({ tone = 'info', children }: { tone?: 'ok' | 'bad' | 'info' | 'warn'; children: ReactNode }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}

export function Alert({ tone = 'error', children }: { tone?: 'error' | 'success' | 'info'; children: ReactNode }) {
  return (
    <div className={`alert ${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      {children}
    </div>
  );
}

export function Spinner({ label = 'Загрузка' }: { label?: string }) {
  return <div className="spinner" role="progressbar" aria-label={label} />;
}

export function Stars({ n }: { n: number }) {
  return (
    <span className="stars" aria-label={`${n} звезд`}>
      {'★'.repeat(n)}
      <span className="muted">{'★'.repeat(Math.max(0, 5 - n))}</span>
    </span>
  );
}

export function Tabs<T extends string>({
  value,
  onChange,
  items,
}: {
  value: T;
  onChange: (v: T) => void;
  items: { value: T; label: ReactNode }[];
}) {
  return (
    <div className="tabs" role="tablist">
      {items.map((i) => (
        <button
          key={i.value}
          type="button"
          role="tab"
          aria-selected={value === i.value}
          className="neu-btn small"
          onClick={() => onChange(i.value)}
        >
          {i.label}
        </button>
      ))}
    </div>
  );
}

export function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="neu-card modal" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="neu-inset muted" style={{ textAlign: 'center' }}>{children}</div>;
}
