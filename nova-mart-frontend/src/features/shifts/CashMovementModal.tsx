import { useState } from 'react';
import { X, ArrowDownRight, ArrowUpRight, Delete, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { CashMovementRequest } from '../../types/shift';

interface CashMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: CashMovementRequest) => Promise<void>;
  isProcessing?: boolean;
}

const NUMPAD_KEYS = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '.', '0', 'DEL'];
const QUICK_AMOUNTS = [500, 1000, 2000, 5000];

const COMMON_REASONS = {
  CashIn: [
    'Change float replenishment from safe',
    'Customer debt payment',
    'Opening balance adjustment',
    'Other deposit',
  ],
  CashOut: [
    'Store supplies / Petty cash purchase',
    'Supplier / Vendor delivery payout',
    'Bank deposit / drop',
    'Mid-day safe drop',
    'Other payout',
  ],
};

export default function CashMovementModal({
  isOpen,
  onClose,
  onConfirm,
  isProcessing = false,
}: CashMovementModalProps) {
  const { t } = useTranslation();
  const [type, setType] = useState<'CashIn' | 'CashOut'>('CashIn');
  const [amount, setAmount] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleNumpadPress = (key: string) => {
    let updated = amount;
    if (key === 'DEL') {
      updated = updated.slice(0, -1);
    } else if (key === '.') {
      if (!updated.includes('.')) {
        updated = updated ? updated + '.' : '0.';
      }
    } else {
      updated = updated + key;
    }
    setAmount(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(amount);
    if (isNaN(val) || val <= 0) {
      setError(t('shift.invalidAmount', 'Please enter a valid amount greater than zero.'));
      return;
    }
    if (!reason.trim()) {
      setError(t('shift.reasonRequired', 'Please enter or select a reason for this cash movement.'));
      return;
    }

    try {
      setError(null);
      await onConfirm({
        type,
        amount: val,
        reason: reason.trim(),
      });
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || t('shift.movementError', 'Could not record cash movement.'));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-line rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-line bg-surface/50">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                type === 'CashIn' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
              }`}
            >
              {type === 'CashIn' ? <ArrowDownRight size={22} /> : <ArrowUpRight size={22} />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-ink-900">{t('shift.cashMovementTitle', 'Till Cash In / Cash Out')}</h2>
              <p className="text-xs text-ink-500">{t('shift.cashMovementSubtitle', 'Record petty cash float movement')}</p>
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
          {/* Type Toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-surface rounded-xl border border-line">
            <button
              type="button"
              onClick={() => {
                setType('CashIn');
                setReason('');
              }}
              className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                type === 'CashIn'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-ink-600 hover:text-ink-900'
              }`}
            >
              <ArrowDownRight size={16} />
              <span>{t('shift.cashIn', 'Cash In (Paid In)')}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setType('CashOut');
                setReason('');
              }}
              className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                type === 'CashOut'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'text-ink-600 hover:text-ink-900'
              }`}
            >
              <ArrowUpRight size={16} />
              <span>{t('shift.cashOut', 'Cash Out (Paid Out)')}</span>
            </button>
          </div>

          {/* Amount input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-600 mb-1.5">
              {t('shift.amount', 'Amount (Rs.)')}
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-ink-400">
                Rs.
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-12 pr-4 py-2.5 bg-surface border border-line rounded-xl text-xl font-bold text-right text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                required
                autoFocus
              />
            </div>
          </div>

          {/* Quick chips */}
          <div className="grid grid-cols-4 gap-2">
            {QUICK_AMOUNTS.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setAmount(amt.toString())}
                className="py-1 text-xs font-bold rounded-lg border border-line bg-surface hover:bg-ink-500/10 text-ink-700 transition-colors"
              >
                +{amt}
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
                className="py-2 rounded-xl border border-line bg-surface hover:bg-ink-500/10 font-bold text-base text-ink-900 flex items-center justify-center transition-colors shadow-2xs"
              >
                {key === 'DEL' ? <Delete size={16} /> : key}
              </button>
            ))}
          </div>

          {/* Reason selector & text */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-600 mb-1">
              {t('shift.reason', 'Reason / Purpose')}
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {COMMON_REASONS[type].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  className={`text-[11px] py-1 px-2 rounded-md border text-left transition-colors ${
                    reason === r
                      ? 'bg-brand-500/10 border-brand-500/40 text-brand-700 font-semibold'
                      : 'bg-surface border-line text-ink-600 hover:bg-card'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t('shift.customReasonPlaceholder', 'Or type specific reason...')}
              className="w-full px-3 py-2 bg-surface border border-line rounded-lg text-sm text-ink-900 focus:outline-none focus:ring-1 focus:ring-brand-500"
              required
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
              className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-sm text-white shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${
                type === 'CashIn' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              <CheckCircle2 size={16} />
              <span>{isProcessing ? t('pos.processing', 'Recording...') : t('shift.recordMovement', 'Record Movement')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
