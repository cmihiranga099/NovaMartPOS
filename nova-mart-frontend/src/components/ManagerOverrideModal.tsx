import { useState } from 'react';
import { ShieldCheck, X, Delete } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { authService } from '../services/authService';

interface Props {
  title?: string;
  message?: string;
  onApproved: (pin: string, approvedBy: string) => void;
  onClose: () => void;
}

const PIN_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'CLR', '0', 'DEL'];

export default function ManagerOverrideModal({ title, message, onApproved, onClose }: Props) {
  const { t } = useTranslation();
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const handleSubmit = async () => {
    if (!pin) return;
    setChecking(true);
    setError(null);
    try {
      const result = await authService.verifyPin(pin);
      if (result.approved) {
        onApproved(pin, result.approvedBy ?? '');
      } else {
        setError(t('managerOverride.invalidPin'));
      }
    } catch {
      setError(t('managerOverride.invalidPin'));
    } finally {
      setChecking(false);
    }
  };

  const handleKeypadPress = (k: string) => {
    setError(null);
    if (k === 'CLR') {
      setPin('');
      return;
    }
    if (k === 'DEL') {
      setPin((prev) => prev.slice(0, -1));
      return;
    }
    if (pin.length < 8) {
      setPin((prev) => prev + k);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl border border-line shadow-2xl w-full max-w-xs p-5 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <ShieldCheck size={20} className="text-brand-600" />
            <h2 className="font-bold text-base text-ink-900">{title ?? t('managerOverride.title')}</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-ink-500 hover:text-ink-900 hover:bg-surface">
            <X size={18} />
          </button>
        </div>

        <p className="text-xs text-ink-500 mb-3">{message ?? t('managerOverride.message')}</p>

        {/* PIN dots display */}
        <div className="px-3 py-2 border border-ink-500/20 rounded-xl text-center text-xl tracking-[0.4em] mb-3 bg-surface font-mono min-h-[44px] flex items-center justify-center">
          {pin ? '•'.repeat(pin.length) : <span className="text-ink-400 text-sm tracking-normal">Enter 4-digit PIN</span>}
        </div>

        {error && <p className="text-red-600 text-xs text-center mb-2">{error}</p>}

        {/* Touch Keypad */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {PIN_KEYS.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => handleKeypadPress(k)}
              className={`h-11 rounded-xl border border-line font-bold text-base flex items-center justify-center active:scale-95 transition-all shadow-2xs ${
                k === 'CLR'
                  ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs'
                  : k === 'DEL'
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                  : 'bg-surface hover:bg-ink-500/10 text-ink-900'
              }`}
            >
              {k === 'DEL' ? <Delete size={18} /> : k}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 border border-line rounded-xl text-xs font-semibold hover:bg-surface text-ink-700"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!pin || checking}
            className="flex-1 py-2.5 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-700 disabled:opacity-50 transition-colors shadow-xs"
          >
            {checking ? t('managerOverride.checking') : t('managerOverride.approve')}
          </button>
        </div>
      </div>
    </div>
  );
}
