import { useState, useRef } from 'react';
import type { KeyboardEvent, ChangeEvent } from 'react';

interface Props {
  onSubmit: (n: number) => void;
  disabled?: boolean;
}

export default function NumberInput({ onSubmit, disabled }: Props) {
  const [value, setValue] = useState('');
  const [flash, setFlash] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const trySubmit = (raw: string) => {
    const n = parseInt(raw, 10);
    if (isNaN(n) || n < 1 || n > 99) return;
    onSubmit(n);
    setFlash(true);
    setTimeout(() => {
      setValue('');
      setFlash(false);
      inputRef.current?.focus();
    }, 400);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 2);
    setValue(raw);
    // Auto-submit on 2 digits
    if (raw.length === 2) trySubmit(raw);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') trySubmit(value);
  };

  return (
    <div className="d-flex flex-column align-items-center gap-2">
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        maxLength={2}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={e => e.target.select()}
        disabled={disabled || flash}
        placeholder="–"
        className={`number-input form-control text-center fw-black font-monospace${flash ? ' number-flash' : ''}`}
        aria-label="Number shown on your laptop"
        autoFocus
      />
      <span className="text-muted small">press Enter for single digits (1–9)</span>
    </div>
  );
}
