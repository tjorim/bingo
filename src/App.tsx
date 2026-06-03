import { useState, useCallback, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { generateCard, parseTotpPairs, checkWin } from './utils/bingo';
import type { WinLine } from './utils/bingo';
import {
  loadConfig,
  loadState,
  saveConfig,
  saveState,
  isStateValid,
  type Config,
} from './utils/persistence';
import BingoCard from './components/BingoCard';
import TotpInput from './components/TotpInput';
import CalledCodes from './components/CalledCodes';
import Settings from './components/Settings';

function fireConfetti() {
  void confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
  setTimeout(() => {
    void confetti({ particleCount: 60, angle: 60, spread: 55, origin: { x: 0, y: 0.7 } });
    void confetti({ particleCount: 60, angle: 120, spread: 55, origin: { x: 1, y: 0.7 } });
  }, 350);
}

// Load everything once, atomically, before any state is initialized
function loadInitial() {
  const config = loadConfig();
  const saved = loadState();
  const valid = saved !== null && isStateValid(saved.createdAt, config.period);
  const card = valid ? saved!.card : generateCard();
  const marked = new Set<number>(valid ? saved!.marked : []);
  const codes = valid ? saved!.codes : [];
  const createdAt = valid ? saved!.createdAt : new Date().toISOString();
  const win = checkWin(card, marked);
  return { config, card, marked, codes, createdAt, win };
}

export default function App() {
  const [init] = useState(loadInitial);

  const [config, setConfig] = useState<Config>(init.config);
  const [card, setCard] = useState<(number | null)[][]>(init.card);
  const [marked, setMarked] = useState<Set<number>>(init.marked);
  const [justMarked, setJustMarked] = useState<Set<number>>(() => new Set());
  const justMarkedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [codes, setCodes] = useState<string[]>(init.codes);
  const [cardCreatedAt, setCardCreatedAt] = useState<string>(init.createdAt);
  const [win, setWin] = useState<WinLine | null>(init.win);
  const [showSettings, setShowSettings] = useState(false);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('bingo-theme');
      if (stored) return stored === 'dark';
    } catch {
      // localStorage unavailable
    }
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  });

  // Persist theme preference
  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', darkMode ? 'dark' : 'light');
    try {
      localStorage.setItem('bingo-theme', darkMode ? 'dark' : 'light');
    } catch {
      // ignore
    }
  }, [darkMode]);

  // Persist game state on every change
  useEffect(() => {
    saveState({
      card,
      marked: Array.from(marked),
      codes,
      createdAt: cardCreatedAt,
    });
  }, [card, marked, codes, cardCreatedAt]);

  const resetCard = useCallback(() => {
    const newCard = generateCard();
    const newCreatedAt = new Date().toISOString();
    setCard(newCard);
    setMarked(new Set());
    setJustMarked(new Set());
    setCodes([]);
    setCardCreatedAt(newCreatedAt);
    setWin(null);
  }, []);

  const handleConfigChange = useCallback(
    (newConfig: Config) => {
      setConfig(newConfig);
      saveConfig(newConfig);
      // Reset if the current card is no longer valid under the new period
      if (!isStateValid(cardCreatedAt, newConfig.period)) {
        resetCard();
      }
    },
    [cardCreatedAt, resetCard],
  );

  const handleSubmit = useCallback(
    (code: string) => {
      if (win) return;
      const pairs = parseTotpPairs(code);
      if (pairs.length === 0) return;

      const nextMarked = new Set(marked);
      pairs.forEach(p => nextMarked.add(p));
      setMarked(nextMarked);

      setJustMarked(new Set(pairs));
      if (justMarkedTimer.current) clearTimeout(justMarkedTimer.current);
      justMarkedTimer.current = setTimeout(() => setJustMarked(new Set()), 700);

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

  const markedCount = card.flat().filter(val => val === null || marked.has(val)).length;
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
          <div className="d-flex gap-1 mt-1">
            <button
              className={`btn btn-sm ${showSettings ? 'btn-secondary' : 'btn-outline-secondary'}`}
              onClick={() => setShowSettings(s => !s)}
              title="Settings"
              aria-label="Settings"
            >
              <i className="bi bi-gear-fill" />
            </button>
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={() => setDarkMode(d => !d)}
              title="Toggle dark mode"
              aria-label="Toggle dark mode"
            >
              <i className={`bi bi-${darkMode ? 'sun-fill' : 'moon-fill'}`} />
            </button>
          </div>
        </div>

        {/* Settings panel */}
        {showSettings && (
          <Settings
            config={config}
            cardCreatedAt={cardCreatedAt}
            onChange={handleConfigChange}
          />
        )}

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
            <button className="btn btn-warning btn-sm fw-bold" onClick={resetCard}>
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
            onClick={resetCard}
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
