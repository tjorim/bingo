import { useState, useCallback, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { generateCard, parseTotpPairs, checkWin } from './utils/bingo';
import type { WinLine } from './utils/bingo';
import BingoCard from './components/BingoCard';
import TotpInput from './components/TotpInput';
import CalledCodes from './components/CalledCodes';

function fireConfetti() {
  void confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
  setTimeout(() => {
    void confetti({ particleCount: 60, angle: 60, spread: 55, origin: { x: 0, y: 0.7 } });
    void confetti({ particleCount: 60, angle: 120, spread: 55, origin: { x: 1, y: 0.7 } });
  }, 350);
}

export default function App() {
  const [card, setCard] = useState(() => generateCard());
  const [marked, setMarked] = useState<Set<number>>(() => new Set());
  const [justMarked, setJustMarked] = useState<Set<number>>(() => new Set());
  const [codes, setCodes] = useState<string[]>([]);
  const [win, setWin] = useState<WinLine | null>(null);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const stored = localStorage.getItem('bingo-theme');
    if (stored) return stored === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('bingo-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const handleSubmit = useCallback(
    (code: string) => {
      if (win) return;
      const pairs = parseTotpPairs(code);
      if (pairs.length === 0) return;

      const nextMarked = new Set(marked);
      pairs.forEach(p => nextMarked.add(p));
      setMarked(nextMarked);
      setJustMarked(new Set(pairs));
      setTimeout(() => setJustMarked(new Set()), 700);

      setCodes(prev => [code, ...prev]);

      const winLine = checkWin(card, nextMarked);
      if (winLine) {
        setWin(winLine);
        fireConfetti();
      }
    },
    [card, marked, win],
  );

  const handleDemo = useCallback(() => {
    const code = Math.floor(Math.random() * 1_000_000)
      .toString()
      .padStart(6, '0');
    handleSubmit(code);
  }, [handleSubmit]);

  const handleNewCard = () => {
    setCard(generateCard());
    setMarked(new Set());
    setJustMarked(new Set());
    setCodes([]);
    setWin(null);
  };

  const markedCount = marked.size + 1; // +1 for FREE
  const totalCells = 25;

  return (
    <div className="min-vh-100 py-3 py-md-5">
      <div className="container px-3" style={{ maxWidth: 480 }}>

        {/* Header */}
        <div className="d-flex justify-content-between align-items-start mb-4">
          <div>
            <h1 className="h2 fw-black mb-0 app-title">
              <span className="okta-brand">Okta</span> Bingo
            </h1>
            <p className="text-muted small mb-0">
              Enter your TOTP codes — get five in a row!
            </p>
          </div>
          <button
            className="btn btn-sm btn-outline-secondary mt-1"
            onClick={() => setDarkMode(d => !d)}
            title="Toggle dark mode"
            aria-label="Toggle dark mode"
          >
            <i className={`bi bi-${darkMode ? 'sun-fill' : 'moon-fill'}`} />
          </button>
        </div>

        {/* Win banner */}
        {win && (
          <div className="win-banner alert alert-warning d-flex align-items-center gap-3 mb-4">
            <span className="win-emoji">🎉</span>
            <div className="flex-grow-1">
              <div className="fw-black fs-3 lh-1">BINGO!</div>
              <div className="text-muted small">
                {codes.length} code{codes.length !== 1 ? 's' : ''} — not bad!
              </div>
            </div>
            <button className="btn btn-warning btn-sm fw-bold" onClick={handleNewCard}>
              Play again
            </button>
          </div>
        )}

        {/* Card */}
        <BingoCard card={card} marked={marked} justMarked={justMarked} win={win} />

        {/* Progress */}
        <div className="progress mt-3 mb-1" style={{ height: 6 }}>
          <div
            className="progress-bar bg-okta"
            style={{ width: `${(markedCount / totalCells) * 100}%`, transition: 'width 0.4s ease' }}
          />
        </div>
        <p className="text-muted small text-center mb-4">
          {markedCount} / {totalCells} cells marked
        </p>

        {/* TOTP input */}
        <div className="mb-1">
          <label className="form-label text-muted small w-100 text-center mb-2">
            <i className="bi bi-shield-lock me-1" />
            Enter your Okta Verify code:
          </label>
          <TotpInput onSubmit={handleSubmit} disabled={!!win} />
        </div>
        <p className="text-muted small text-center mt-2 mb-4">
          <code>482&thinsp;951</code> marks <code>48</code>, <code>29</code>, <code>51</code>
          &ensp;·&ensp;each code marks 3 cells
        </p>

        {/* Actions */}
        <div className="d-flex gap-2 justify-content-center">
          <button
            className="btn btn-outline-primary"
            onClick={handleNewCard}
            title="Generate a fresh card"
          >
            <i className="bi bi-arrow-clockwise me-1" />
            New card
          </button>
          <button
            className="btn btn-outline-secondary"
            onClick={handleDemo}
            disabled={!!win}
            title="Simulate a random TOTP code"
          >
            <i className="bi bi-dice-5 me-1" />
            Demo
          </button>
        </div>

        {/* History */}
        <CalledCodes codes={codes} />

        <footer className="text-center text-muted small mt-5">
          Built with{' '}
          <span title="questionable life choices">☕</span>{' '}
          to survive the 2FA flood
        </footer>
      </div>
    </div>
  );
}
