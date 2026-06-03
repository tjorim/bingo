import { useState, useCallback, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { generateCard, parseTotpPairs, checkWin } from './utils/bingo';
import type { WinLine } from './utils/bingo';
import {
  loadConfig,
  loadState,
  loadStats,
  loadTheme,
  saveConfig,
  saveState,
  saveStats,
  saveTheme,
  isStateValid,
  type Config,
  type Stats,
  type ThemeMode,
} from './utils/persistence';
import BingoCard from './components/BingoCard';
import TotpInput from './components/TotpInput';
import CalledCodes from './components/CalledCodes';
import Settings from './components/Settings';
import StatsPanel from './components/StatsPanel';

const THEME_CYCLE: Record<ThemeMode, ThemeMode> = { auto: 'light', light: 'dark', dark: 'auto' };
const THEME_ICON: Record<ThemeMode, string> = { auto: 'circle-half', light: 'sun-fill', dark: 'moon-fill' };
const THEME_TITLE: Record<ThemeMode, string> = {
  auto: 'Theme: auto (follows system)',
  light: 'Theme: light',
  dark: 'Theme: dark',
};

function fireConfetti() {
  void confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
  setTimeout(() => {
    void confetti({ particleCount: 60, angle: 60, spread: 55, origin: { x: 0, y: 0.7 } });
    void confetti({ particleCount: 60, angle: 120, spread: 55, origin: { x: 1, y: 0.7 } });
  }, 350);
}

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
  const [stats, setStats] = useState<Stats>(() => loadStats());
  const [showSettings, setShowSettings] = useState(false);
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => loadTheme());

  // Apply theme + listen for system changes when in auto mode
  useEffect(() => {
    const applyTheme = (dark: boolean) =>
      document.documentElement.setAttribute('data-bs-theme', dark ? 'dark' : 'light');

    if (themeMode === 'auto') {
      const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
      applyTheme(mq?.matches ?? false);
      const handler = (e: MediaQueryListEvent) => applyTheme(e.matches);
      mq?.addEventListener('change', handler);
      return () => mq?.removeEventListener('change', handler);
    }

    applyTheme(themeMode === 'dark');
    saveTheme(themeMode);
  }, [themeMode]);

  // Persist game state on every change
  useEffect(() => {
    saveState({ card, marked: Array.from(marked), codes, createdAt: cardCreatedAt });
  }, [card, marked, codes, cardCreatedAt]);

  const resetCard = useCallback(() => {
    setCard(generateCard());
    setMarked(new Set());
    setJustMarked(new Set());
    setCodes([]);
    setCardCreatedAt(new Date().toISOString());
    setWin(null);
  }, []);

  const handleConfigChange = useCallback(
    (newConfig: Config) => {
      setConfig(newConfig);
      saveConfig(newConfig);
      if (!isStateValid(cardCreatedAt, newConfig.period)) resetCard();
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

      const newCodesCount = codes.length + 1;
      setCodes(prev => [code, ...prev]);

      const winLine = checkWin(card, nextMarked);
      if (winLine) {
        setWin(winLine);
        fireConfetti();
        setStats(prev => {
          const next: Stats = {
            totalCodes: prev.totalCodes + 1,
            totalBingos: prev.totalBingos + 1,
            bestGame: prev.bestGame === null || newCodesCount < prev.bestGame ? newCodesCount : prev.bestGame,
            totalCodesInBingos: prev.totalCodesInBingos + newCodesCount,
          };
          saveStats(next);
          return next;
        });
      } else {
        setStats(prev => {
          const next = { ...prev, totalCodes: prev.totalCodes + 1 };
          saveStats(next);
          return next;
        });
      }
    },
    [card, codes.length, marked, win],
  );

  const handleDemo = useCallback(() => {
    const code = Math.floor(Math.random() * 1_000_000).toString().padStart(6, '0');
    handleSubmit(code);
  }, [handleSubmit]);

  const markedCount = card.flat().filter(val => val === null || marked.has(val)).length;

  return (
    <div className="min-vh-100 py-3 py-md-5">
      <div className="container px-3" style={{ maxWidth: 480 }}>

        {/* Header */}
        <div className="d-flex justify-content-between align-items-start mb-4">
          <div>
            <h1 className="h2 fw-black mb-0 app-title">
              <span className="okta-brand">Okta</span> Bingo
            </h1>
            <p className="text-muted small mb-0">Enter your TOTP codes — get five in a row!</p>
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
              onClick={() => setThemeMode(m => THEME_CYCLE[m])}
              title={THEME_TITLE[themeMode]}
              aria-label={THEME_TITLE[themeMode]}
            >
              <i className={`bi bi-${THEME_ICON[themeMode]}`} />
            </button>
          </div>
        </div>

        {showSettings && (
          <Settings config={config} cardCreatedAt={cardCreatedAt} onChange={handleConfigChange} />
        )}

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

        <BingoCard card={card} marked={marked} justMarked={justMarked} win={win} />

        <div className="progress mt-3 mb-1" style={{ height: 6 }}>
          <div
            className="progress-bar bg-okta"
            style={{ width: `${(markedCount / 25) * 100}%`, transition: 'width 0.4s ease' }}
          />
        </div>
        <p className="text-muted small text-center mb-4">{markedCount} / 25 cells marked</p>

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

        <div className="d-flex gap-2 justify-content-center">
          <button className="btn btn-outline-primary" onClick={resetCard} title="Generate a fresh card">
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

        <CalledCodes codes={codes} />

        <StatsPanel stats={stats} />

        <footer className="text-center text-muted small mt-5">
          Built with <span title="questionable life choices">☕</span> to survive the 2FA flood
        </footer>
      </div>
    </div>
  );
}
