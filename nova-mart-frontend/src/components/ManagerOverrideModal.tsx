import { useState } from 'react';
import { ShieldCheck, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { authService } from '../services/authService';

interface Props {
  title?: string;
  message?: string;
  onApproved: (pin: string, approvedBy: string) => void;
  onClose: () => void;
}

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

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg border border-line shadow-xl w-full max-w-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck size={20} className="text-brand-600" />
            <h2 className="font-bold">{title ?? t('managerOverride.title')}</h2>
          </div>
          <button onClick={onClose} className="text-ink-500 hover:text-ink-900">
            <X size={18} />
          </button>
        </div>

        <p className="text-sm text-ink-500 mb-4">{message ?? t('managerOverride.message')}</p>

        <input
          type="password"
          inputMode="numeric"
          autoFocus
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder={t('managerOverride.pinPlaceholder')}
          className="w-full px-3 py-2 border border-ink-500/20 rounded-lg text-center text-lg tracking-[0.4em] mb-2"
          maxLength={8}
        />

        {error && <p className="text-red-600 text-sm mb-2">{error}</p>}

        <div className="flex gap-2 mt-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 border border-line rounded-lg text-sm font-medium hover:bg-surface"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={!pin || checking}
            className="flex-1 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50"
          >
            {checking ? t('managerOverride.checking') : t('managerOverride.approve')}
          </button>
        </div>
      </div>
    </div>
  );
}