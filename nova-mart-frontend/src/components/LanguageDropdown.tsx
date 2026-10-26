import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Languages, Check, ChevronDown } from 'lucide-react';

type LanguageCode = 'en' | 'si' | 'ta';

interface LanguageOption {
  code: LanguageCode;
  label: string;
}

const LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'ENGLISH' },
  { code: 'si', label: 'සිංහල' },
  { code: 'ta', label: 'தமிழ்' },
];

export default function LanguageDropdown() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const currentLang = LANGUAGES.find((l) => l.code === i18n.language) || LANGUAGES[0];

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

  const selectLanguage = (code: LanguageCode) => {
    i18n.changeLanguage(code);
    setOpen(false);
  };

  return (
    <div className="relative flex-1" ref={panelRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between py-1.5 px-2.5 rounded-lg border border-line text-xs font-semibold text-ink-700 hover:bg-surface transition-colors cursor-pointer"
        title="Change language"
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <Languages size={15} className="text-brand-600 shrink-0" />
          <span className="truncate">{currentLang.label}</span>
        </div>
        <ChevronDown size={14} className="text-ink-400 shrink-0" />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1.5 z-50 w-full min-w-[130px] bg-card rounded-lg border border-line shadow-lg overflow-hidden py-1">
          {LANGUAGES.map(({ code, label }) => {
            const active = i18n.language === code;
            return (
              <button
                key={code}
                onClick={() => selectLanguage(code)}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-xs font-medium text-left transition-colors cursor-pointer ${
                  active
                    ? 'text-brand-600 bg-brand-50/60 font-bold'
                    : 'text-ink-700 hover:bg-surface'
                }`}
              >
                <span>{label}</span>
                {active && <Check size={14} className="text-brand-600" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
