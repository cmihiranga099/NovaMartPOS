import { useState } from 'react';
import { X, DollarSign, Delete, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface OpenShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmOpen: (startingCash: number, notes?: string) => Promise<void>;
  isProcessing?: boolean;
}

const NUMPAD_KEYS = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '.', '0', 'DEL'];
const PRESET_FLOATS = [2000, 5000, 10000, 15000];

export default function OpenShiftModal({
  isOpen,
  onClose,
  onConfirmOpen,
  isProcessing = false,
}: OpenShiftModalProps) {
  const { t } = useTranslation();
  const [startingCash, setStartingCash] = useState<string>('5000');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleNumpadPress = (key: string) => {
    let updated = startingCash;
    if (key === 'DEL') {
      updated = updated.slice(0, -1);
    } else if (key === '.') {
      if (!updated.includes('.')) {
        updated = updated ? updated + '.' : '0.';
      }
    } else {
      updated = updated + key;
    }
    setStartingCash(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(startingCash);
    if (isNaN(amount) || amount < 0) {
      setError(t('shift.invalidAmount', 'Please enter a valid starting cash float.'));
      return;
    }

    try {
      setError(null);
      await onConfirmOpen(amount, notes.trim() || undefined);
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || t('shift.openError', 'Could not open shift.'));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-line rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-line bg-surface/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
              <DollarSign size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-ink-900">{t('shift.openTitle', 'Open Register / Shift')}</h2>
              <p className="text-xs text-ink-500">{t('shift.openSubtitle', 'Enter your opening cash float to begin')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-ink-500 hover:text-ink-900 hover:bg-surface transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-600 mb-1.5">
              {t('shift.startingFloat', 'Starting Cash Float (Rs.)')}
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-ink-400">
                Rs.
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={startingCash}
                onChange={(e) => setStartingCash(e.target.value)}
                placeholder="0.00"
                className="w-full pl-12 pr-4 py-3 bg-surface border border-line rounded-xl text-xl font-bold text-right text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                required
                autoFocus
              />
            </div>
          </div>

          {/* Quick preset chips */}
          <div className="grid grid-cols-4 gap-2">
            {PRESET_FLOATS.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setStartingCash(amt.toString())}
                className={`py-1.5 text-xs font-bold rounded-lg border transition-all ${
                  Number(startingCash) === amt
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                    : 'bg-surface hover:bg-ink-500/10 border-line text-ink-700'
                }`}
              >
                Rs. {amt.toLocaleString()}
              </button>
            ))}
          </div>

          {/* Touch Numpad */}
          <div className="grid grid-cols-3 gap-1.5 pt-1">
            {NUMPAD_KEYS.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => handleNumpadPress(key)}
                className="py-2.5 rounded-xl border border-line bg-surface hover:bg-ink-500/10 font-bold text-base text-ink-900 flex items-center justify-center transition-colors shadow-2xs"
              >
                {key === 'DEL' ? <Delete size={18} /> : key}
              </button>
            ))}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-600 mb-1">
              {t('shift.notes', 'Notes / Register # (Optional)')}
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('shift.notesPlaceholder', 'e.g., Counter 1 Morning Shift')}
              className="w-full px-3 py-2 bg-surface border border-line rounded-lg text-sm text-ink-900 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {error && <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 p-2.5 rounded-lg">{error}</p>}

          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-line text-sm font-semibold text-ink-700 hover:bg-surface transition-colors"
            >
              {t('common.cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="flex-1 py-2.5 px-4 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{isProcessing ? t('pos.processing', 'Opening...') : t('shift.startShift', 'Start Shift & Open Drawer')}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
