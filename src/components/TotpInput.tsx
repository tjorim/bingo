import { useRef, useState } from 'react';
import type { KeyboardEvent, ClipboardEvent, ChangeEvent } from 'react';

interface Props {
  onSubmit: (code: string) => void;
  disabled?: boolean;
}

export default function TotpInput({ onSubmit, disabled }: Props) {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''));
  const [flash, setFlash] = useState(false);
  const refs = useRef<(HTMLInputElement | null)[]>(Array(6).fill(null));

  const submit = (code: string) => {
    onSubmit(code);
    setFlash(true);
    setTimeout(() => {
      setDigits(Array(6).fill(''));
      setFlash(false);
      refs.current[0]?.focus();
    }, 400);
  };

  const handleChange = (i: number, e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[i] = val;
    setDigits(next);
    if (val && i < 5) refs.current[i + 1]?.focus();
    if (next.every(d => d !== '')) submit(next.join(''));
  };

  const handleKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      refs.current[i - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus();
    if (e.key === 'ArrowRight' && i < 5) refs.current[i + 1]?.focus();
  };

  const handlePaste = (e: ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const next = Array(6).fill('');
    pasted.split('').forEach((d, i) => { next[i] = d; });
    setDigits(next);
    if (pasted.length === 6) {
      submit(pasted);
    } else {
      refs.current[Math.min(pasted.length, 5)]?.focus();
    }
  };

  return (
    <div className={`totp-input-wrapper${flash ? ' totp-flash' : ''}`}>
      <div className="d-flex align-items-center gap-1 justify-content-center">
        {[0, 1, 2].map(i => (
          <input
            key={i}
            ref={el => { refs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digits[i]}
            onChange={e => handleChange(i, e)}
            onKeyDown={e => handleKeyDown(i, e)}
            onPaste={handlePaste}
            onFocus={e => e.target.select()}
            disabled={disabled || flash}
            className="totp-digit form-control text-center fw-bold"
            aria-label={`Digit ${i + 1}`}
          />
        ))}
        <span className="totp-sep text-muted">·</span>
        {[3, 4, 5].map(i => (
          <input
            key={i}
            ref={el => { refs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digits[i]}
            onChange={e => handleChange(i, e)}
            onKeyDown={e => handleKeyDown(i, e)}
            onPaste={handlePaste}
            onFocus={e => e.target.select()}
            disabled={disabled || flash}
            className="totp-digit form-control text-center fw-bold"
            aria-label={`Digit ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
