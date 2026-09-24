import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Languages, Check } from 'lucide-react';

type LanguageCode = 'en' | 'si' | 'ta';

interface LanguageOption {
  code: LanguageCode;
  label: string;
  disabled?: boolean;
}

const LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'ENGLISH' },
  { code: 'si', label: 'සිංහල' },
  // Tamil is a placeholder for now — not yet translated, so it's shown
  // in the menu but isn't selectable.
  { code: 'ta', label: 'தமிழ்', disabled: true },
];

export default function LanguageDropdown() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const selectLanguage = (code: LanguageCode, disabled?: boolean) => {
    if (disabled) return;
    i18n.changeLanguage(code);
    setOpen(false);
  };

  return (
    <div className="relative shrink-0" ref={panelRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-center py-1.5 px-2.5 rounded-lg border border-line text-ink-700 hover:bg-surface transition-colors"
        title="Change language"
      >
        <Languages size={15} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 z-50 w-40 bg-card rounded-lg border border-line shadow-lg overflow-hidden py-1">
          {LANGUAGES.map(({ code, label, disabled }) => {
            const active = i18n.language === code;
            return (
              <button
                key={code}
                onClick={() => selectLanguage(code, disabled)}
                disabled={disabled}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-left transition-colors ${
                  disabled
                    ? 'text-ink-500 cursor-not-allowed'
                    : active
                      ? 'text-brand-600 font-bold'
                      : 'text-ink-700 hover:bg-surface'
                }`}
              >
                <span>{label}</span>
                {active && !disabled && <Check size={14} />}
                {disabled && <span className="text-[10px] uppercase tracking-wide text-ink-500">Soon</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}