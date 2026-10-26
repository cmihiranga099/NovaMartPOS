import { useState } from 'react';
import { Delete, CornerDownLeft, ChevronDown, Space, Sparkles, Volume2, VolumeX, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  value: string;
  onChange: (value: string) => void;
  onEnter?: () => void;
  title?: string;
}

const playKeyClick = () => {
  try {
    const AudioContextClass =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(750, ctx.currentTime);
    gain.gain.setValueAtTime(0.035, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.03);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.03);
  } catch {
    // ignore
  }
};

const QWERTY_ROWS = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
];

const SYMBOL_ROWS = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')'],
  ['-', '_', '=', '+', '[', ']', '{', '}', '\\', '|'],
  [';', ':', '\'', '"', ',', '.', '/', '?'],
];

export default function VirtualKeyboard({
  isOpen,
  onClose,
  value,
  onChange,
  onEnter,
  title = 'Touch Keyboard',
}: Props) {
  const [capsLock, setCapsLock] = useState(false);
  const [symbolMode, setSymbolMode] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  if (!isOpen) return null;

  const handleKeyPress = (char: string) => {
    if (soundEnabled) playKeyClick();
    const toInsert = capsLock && !symbolMode ? char.toUpperCase() : char;
    onChange(value + toInsert);
  };

  const handleBackspace = () => {
    if (soundEnabled) playKeyClick();
    if (value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const handleClear = () => {
    if (soundEnabled) playKeyClick();
    onChange('');
  };

  const handleSpace = () => {
    if (soundEnabled) playKeyClick();
    onChange(value + ' ');
  };

  const handleEnter = () => {
    if (soundEnabled) playKeyClick();
    if (onEnter) {
      onEnter();
    }
  };

  const rows = symbolMode ? SYMBOL_ROWS : QWERTY_ROWS;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-line shadow-2xl animate-in slide-in-from-bottom-5 duration-200 select-none pb-2 pt-2 px-3 sm:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Top Header bar with field target, value preview, and controls */}
        <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-line/60">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0">
              <Sparkles size={12} />
              {title}
            </span>
            <div className="text-xs font-mono truncate px-2.5 py-1 bg-surface rounded-md border border-line text-ink-900 max-w-xs sm:max-w-md">
              {value ? value : <span className="text-ink-400 italic">Empty</span>}
              <span className="inline-block w-1.5 h-3.5 bg-brand-600 ml-1 animate-pulse align-middle" />
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSoundEnabled((prev) => !prev)}
              title={soundEnabled ? 'Mute click sound' : 'Enable click sound'}
              className="p-1.5 rounded-lg text-ink-500 hover:text-ink-900 hover:bg-surface transition-colors"
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
            <button
              type="button"
              onClick={onClose}
              title="Close keyboard"
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-ink-600 hover:text-ink-900 bg-surface hover:bg-ink-500/10 rounded-lg border border-line transition-colors"
            >
              <ChevronDown size={14} />
              <span>Hide</span>
            </button>
          </div>
        </div>

        {/* Keyboard Layout */}
        <div className="space-y-1.5">
          {/* Row 0: Numbers */}
          <div className="flex justify-center gap-1 sm:gap-1.5">
            {rows[0].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleKeyPress(num)}
                className="flex-1 max-w-[48px] h-11 sm:h-12 rounded-xl bg-surface border border-line font-bold text-base sm:text-lg text-ink-900 flex items-center justify-center shadow-2xs hover:bg-ink-500/10 active:scale-95 active:bg-brand-600 active:text-white transition-all"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={handleBackspace}
              title="Backspace"
              className="flex-1 max-w-[64px] h-11 sm:h-12 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 flex items-center justify-center shadow-2xs active:scale-95 transition-all"
            >
              <Delete size={20} />
            </button>
          </div>

          {/* Row 1: Letters top */}
          <div className="flex justify-center gap-1 sm:gap-1.5">
            {rows[1].map((char) => (
              <button
                key={char}
                type="button"
                onClick={() => handleKeyPress(char)}
                className="flex-1 max-w-[54px] h-11 sm:h-12 rounded-xl bg-surface border border-line font-semibold text-base sm:text-lg text-ink-900 flex items-center justify-center shadow-2xs hover:bg-ink-500/10 active:scale-95 active:bg-brand-600 active:text-white transition-all"
              >
                {capsLock && !symbolMode ? char.toUpperCase() : char}
              </button>
            ))}
          </div>

          {/* Row 2: Letters mid */}
          <div className="flex justify-center gap-1 sm:gap-1.5 px-3">
            {rows[2].map((char) => (
              <button
                key={char}
                type="button"
                onClick={() => handleKeyPress(char)}
                className="flex-1 max-w-[54px] h-11 sm:h-12 rounded-xl bg-surface border border-line font-semibold text-base sm:text-lg text-ink-900 flex items-center justify-center shadow-2xs hover:bg-ink-500/10 active:scale-95 active:bg-brand-600 active:text-white transition-all"
              >
                {capsLock && !symbolMode ? char.toUpperCase() : char}
              </button>
            ))}
          </div>

          {/* Row 3: Shift / Letters bottom / Clear */}
          <div className="flex justify-center gap-1 sm:gap-1.5">
            <button
              type="button"
              onClick={() => {
                if (soundEnabled) playKeyClick();
                setCapsLock((prev) => !prev);
              }}
              className={`flex-1 max-w-[70px] h-11 sm:h-12 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center border shadow-2xs active:scale-95 transition-all ${
                capsLock
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-surface border-line text-ink-700 hover:bg-ink-500/10'
              }`}
            >
              CAPS
            </button>

            {rows[3].map((char) => (
              <button
                key={char}
                type="button"
                onClick={() => handleKeyPress(char)}
                className="flex-1 max-w-[54px] h-11 sm:h-12 rounded-xl bg-surface border border-line font-semibold text-base sm:text-lg text-ink-900 flex items-center justify-center shadow-2xs hover:bg-ink-500/10 active:scale-95 active:bg-brand-600 active:text-white transition-all"
              >
                {capsLock && !symbolMode ? char.toUpperCase() : char}
              </button>
            ))}

            <button
              type="button"
              onClick={handleClear}
              title="Clear text"
              className="flex-1 max-w-[70px] h-11 sm:h-12 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 font-semibold text-xs flex items-center justify-center shadow-2xs active:scale-95 transition-all"
            >
              CLR
            </button>
          </div>

          {/* Row 4: Symbols toggle / Space / Enter */}
          <div className="flex justify-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => {
                if (soundEnabled) playKeyClick();
                setSymbolMode((prev) => !prev);
              }}
              className="w-16 sm:w-20 h-11 sm:h-12 rounded-xl bg-surface border border-line font-bold text-xs sm:text-sm text-ink-700 hover:bg-ink-500/10 shadow-2xs active:scale-95 transition-all"
            >
              {symbolMode ? 'ABC' : '?123'}
            </button>

            <button
              type="button"
              onClick={handleSpace}
              className="flex-1 max-w-[320px] h-11 sm:h-12 rounded-xl bg-surface border border-line text-ink-600 font-medium text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-2xs hover:bg-ink-500/10 active:scale-95 active:bg-brand-600 active:text-white transition-all"
            >
              <Space size={18} />
              <span>Space</span>
            </button>

            <button
              type="button"
              onClick={() => handleKeyPress('.')}
              className="w-12 sm:w-14 h-11 sm:h-12 rounded-xl bg-surface border border-line font-bold text-base text-ink-900 flex items-center justify-center shadow-2xs hover:bg-ink-500/10 active:scale-95 transition-all"
            >
              .
            </button>

            <button
              type="button"
              onClick={handleEnter}
              className="w-24 sm:w-28 h-11 sm:h-12 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all"
            >
              <span>Enter</span>
              <CornerDownLeft size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
