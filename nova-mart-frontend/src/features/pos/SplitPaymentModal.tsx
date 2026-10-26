import { useState, useEffect } from 'react';
import { X, Plus, Trash2, CheckCircle2, AlertCircle, CreditCard, Banknote, Landmark, ArrowRight, Delete } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface SplitItem {
  id: string;
  method: 'Cash' | 'Card' | 'BankTransfer';
  amount: number;
}

interface SplitPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  grandTotal: number;
  onConfirmCheckout: (splits: { method: string; amount: number }[]) => void;
  isProcessing?: boolean;
}

const METHODS: { key: 'Cash' | 'Card' | 'BankTransfer'; label: string; icon: typeof Banknote }[] = [
  { key: 'Cash', label: 'Cash', icon: Banknote },
  { key: 'Card', label: 'Card', icon: CreditCard },
  { key: 'BankTransfer', label: 'Bank Transfer', icon: Landmark },
];

const NUMPAD_KEYS = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '.', '0', 'DEL'];
const QUICK_AMOUNTS = [100, 500, 1000, 2000, 5000];

export default function SplitPaymentModal({
  isOpen,
  onClose,
  grandTotal,
  onConfirmCheckout,
  isProcessing = false,
}: SplitPaymentModalProps) {
  const { t } = useTranslation();

  const [splits, setSplits] = useState<SplitItem[]>([]);
  const [activeSplitId, setActiveSplitId] = useState<string>('');
  const [activeInputString, setActiveInputString] = useState<string>('');

  // Initialize splits whenever the modal opens or grandTotal changes
  useEffect(() => {
    if (isOpen) {
      const half = Math.round((grandTotal / 2) * 100) / 100;
      const otherHalf = Math.round((grandTotal - half) * 100) / 100;
      const initial: SplitItem[] = [
        { id: 'split-1', method: 'Cash', amount: half },
        { id: 'split-2', method: 'Card', amount: otherHalf },
      ];
      setSplits(initial);
      setActiveSplitId('split-1');
      setActiveInputString(half > 0 ? half.toString() : '');
    }
  }, [isOpen, grandTotal]);

  if (!isOpen) return null;

  const totalTendered = splits.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
  const remaining = Math.max(0, grandTotal - totalTendered);
  const change = Math.max(0, totalTendered - grandTotal);
  const isSatisfied = totalTendered >= grandTotal - 0.009; // precision tolerance

  const handleSelectSplit = (id: string) => {
    setActiveSplitId(id);
    const target = splits.find((s) => s.id === id);
    setActiveInputString(target && target.amount > 0 ? target.amount.toString() : '');
  };

  const updateSplitAmount = (id: string, amount: number) => {
    setSplits((prev) =>
      prev.map((s) => (s.id === id ? { ...s, amount: Math.max(0, amount) } : s))
    );
  };

  const updateSplitMethod = (id: string, method: 'Cash' | 'Card' | 'BankTransfer') => {
    setSplits((prev) => prev.map((s) => (s.id === id ? { ...s, method } : s)));
  };

  const handleAddSplit = () => {
    const newId = `split-${Date.now()}`;
    const defaultMethod = splits.some((s) => s.method === 'Card') ? 'BankTransfer' : 'Card';
    const fillAmount = remaining > 0 ? Math.round(remaining * 100) / 100 : 0;
    const newSplit: SplitItem = {
      id: newId,
      method: defaultMethod,
      amount: fillAmount,
    };
    setSplits((prev) => [...prev, newSplit]);
    setActiveSplitId(newId);
    setActiveInputString(fillAmount > 0 ? fillAmount.toString() : '');
  };

  const handleRemoveSplit = (id: string) => {
    if (splits.length <= 1) return;
    const remainingSplits = splits.filter((s) => s.id !== id);
    setSplits(remainingSplits);
    if (activeSplitId === id) {
      setActiveSplitId(remainingSplits[0].id);
      setActiveInputString(remainingSplits[0].amount > 0 ? remainingSplits[0].amount.toString() : '');
    }
  };

  const handleFillRemaining = (id: string) => {
    const current = splits.find((s) => s.id === id);
    const otherTotal = splits
      .filter((s) => s.id !== id)
      .reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
    const needed = Math.max(0, grandTotal - otherTotal);
    const rounded = Math.round(needed * 100) / 100;
    updateSplitAmount(id, rounded);
    if (activeSplitId === id) {
      setActiveInputString(rounded > 0 ? rounded.toString() : '');
    }
  };

  const handleNumpadPress = (key: string) => {
    if (!activeSplitId) return;

    let updated = activeInputString;
    if (key === 'DEL') {
      updated = updated.slice(0, -1);
    } else if (key === '.') {
      if (!updated.includes('.')) {
        updated = updated ? updated + '.' : '0.';
      }
    } else {
      updated = updated + key;
    }

    setActiveInputString(updated);
    const num = Number(updated) || 0;
    updateSplitAmount(activeSplitId, num);
  };

  const handleQuickAdd = (value: number) => {
    if (!activeSplitId) return;
    const current = splits.find((s) => s.id === activeSplitId);
    const currentAmount = current ? current.amount : 0;
    const newTotal = currentAmount + value;
    updateSplitAmount(activeSplitId, newTotal);
    setActiveInputString(newTotal.toString());
  };

  const handleSubmit = () => {
    if (!isSatisfied || isProcessing) return;
    const validSplits = splits
      .filter((s) => s.amount > 0)
      .map((s) => ({ method: s.method, amount: s.amount }));

    if (validSplits.length === 0) return;
    onConfirmCheckout(validSplits);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl shadow-2xl border border-line w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-line flex items-center justify-between bg-surface">
          <div>
            <h2 className="text-lg font-bold text-ink-900 flex items-center gap-2">
              <CreditCard className="text-brand-600" size={20} />
              {t('splitPayment.title', 'Split Payment (Multi-Tender)')}
            </h2>
            <p className="text-xs text-ink-500 mt-0.5">
              {t('splitPayment.subtitle', 'Split this invoice across multiple tender types')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-ink-500/10 text-ink-500 hover:text-ink-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Balance Status Banner */}
        <div className="px-6 py-3 bg-card border-b border-line grid grid-cols-3 gap-4">
          <div className="bg-surface rounded-xl p-3 border border-line">
            <span className="text-[11px] font-medium text-ink-500 uppercase tracking-wider block">
              {t('common.total', 'Invoice Total')}
            </span>
            <span className="text-xl font-black text-ink-900">
              Rs. {grandTotal.toFixed(2)}
            </span>
          </div>

          <div className="bg-surface rounded-xl p-3 border border-line">
            <span className="text-[11px] font-medium text-ink-500 uppercase tracking-wider block">
              {t('splitPayment.tendered', 'Total Tendered')}
            </span>
            <span className={`text-xl font-black ${isSatisfied ? 'text-brand-600' : 'text-amber-600'}`}>
              Rs. {totalTendered.toFixed(2)}
            </span>
          </div>

          <div
            className={`rounded-xl p-3 border ${
              isSatisfied
                ? change > 0
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700'
                  : 'bg-brand-500/10 border-brand-500/30 text-brand-700'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-700'
            }`}
          >
            <span className="text-[11px] font-medium uppercase tracking-wider block">
              {isSatisfied ? t('pos.change', 'Change Return') : t('splitPayment.remaining', 'Remaining')}
            </span>
            <span className="text-xl font-black">
              Rs. {(isSatisfied ? change : remaining).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 overflow-y-auto flex-1">
          {/* Left Column: List of Split Tenders (7 cols) */}
          <div className="md:col-span-7 flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-ink-700 uppercase tracking-wider">
                {t('splitPayment.tenders', 'Payment Tenders')} ({splits.length})
              </span>
              <button
                type="button"
                onClick={handleAddSplit}
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 py-1 px-2.5 rounded-lg bg-brand-500/10 hover:bg-brand-500/20 transition-colors"
              >
                <Plus size={14} />
                <span>{t('splitPayment.addTender', 'Add Tender')}</span>
              </button>
            </div>

            <div className="space-y-2.5 overflow-y-auto pr-1 flex-1 min-h-[220px]">
              {splits.map((split, index) => {
                const isActive = split.id === activeSplitId;
                return (
                  <div
                    key={split.id}
                    onClick={() => handleSelectSplit(split.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isActive
                        ? 'border-brand-500 bg-brand-50/40 ring-2 ring-brand-500/20 shadow-xs'
                        : 'border-line bg-surface hover:border-ink-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-ink-500/10 text-ink-700 font-bold text-[11px] flex items-center justify-center">
                          {index + 1}
                        </span>
                        <div className="flex gap-1">
                          {METHODS.map((m) => {
                            const isSelected = split.method === m.key;
                            return (
                              <button
                                key={m.key}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateSplitMethod(split.id, m.key);
                                }}
                                className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 border transition-colors ${
                                  isSelected
                                    ? 'bg-brand-600 text-white border-brand-600'
                                    : 'bg-card text-ink-600 border-line hover:bg-surface'
                                }`}
                              >
                                <m.icon size={12} />
                                <span>{m.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {splits.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveSplit(split.id);
                          }}
                          className="p-1 rounded text-ink-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title={t('common.remove', 'Remove')}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-ink-400">
                          Rs.
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={isActive ? activeInputString : split.amount > 0 ? split.amount : ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (isActive) setActiveInputString(val);
                            updateSplitAmount(split.id, Number(val) || 0);
                          }}
                          onFocus={() => handleSelectSplit(split.id)}
                          placeholder="0.00"
                          className="w-full pl-9 pr-3 py-2 bg-card border border-line rounded-lg text-sm font-bold text-right text-ink-900 focus:outline-none focus:ring-1 focus:ring-brand-500"
                        />
                      </div>

                      {remaining > 0 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFillRemaining(split.id);
                          }}
                          className="px-2.5 py-2 text-xs font-medium text-brand-700 bg-brand-50 border border-brand-200 rounded-lg hover:bg-brand-100 transition-colors whitespace-nowrap"
                        >
                          {t('splitPayment.fillRemaining', 'Fill Balance')}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Numeric Pad & Quick Add (5 cols) */}
          <div className="md:col-span-5 flex flex-col justify-between border-l border-line md:pl-6 space-y-3">
            <div>
              <span className="text-xs font-bold text-ink-700 uppercase tracking-wider block mb-2">
                {t('splitPayment.quickAdd', 'Quick Tender')}
              </span>
              <div className="grid grid-cols-3 gap-1.5 mb-3">
                {QUICK_AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleQuickAdd(amt)}
                    className="py-1.5 px-2 rounded-lg bg-surface hover:bg-ink-500/10 border border-line text-xs font-bold text-ink-800 transition-colors"
                  >
                    +{amt}
                  </button>
                ))}
                {remaining > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (activeSplitId) handleFillRemaining(activeSplitId);
                    }}
                    className="py-1.5 px-2 rounded-lg bg-brand-50 hover:bg-brand-100 border border-brand-200 text-xs font-bold text-brand-700 transition-colors"
                  >
                    Exact
                  </button>
                )}
              </div>

              {/* On-Screen Touch Numpad */}
              <div className="grid grid-cols-3 gap-1.5">
                {NUMPAD_KEYS.map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleNumpadPress(key)}
                    className="py-3 rounded-xl border border-line bg-surface hover:bg-ink-500/10 font-bold text-base text-ink-900 flex items-center justify-center transition-colors shadow-2xs"
                  >
                    {key === 'DEL' ? <Delete size={18} /> : key}
                  </button>
                ))}
              </div>
            </div>

            {/* Validation alert */}
            {!isSatisfied && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-800 text-xs font-medium">
                <AlertCircle size={16} className="shrink-0 text-amber-600" />
                <span>
                  {t('splitPayment.insufficient', 'Total tendered must equal or exceed total invoice.')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-surface border-t border-line flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-line text-sm font-semibold text-ink-700 hover:bg-card transition-colors"
          >
            {t('common.cancel', 'Cancel')}
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isSatisfied || isProcessing}
            className="flex-1 py-3 px-5 rounded-xl font-bold text-sm bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white shadow-xs transition-all flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <span>{t('pos.processing', 'Processing...')}</span>
            ) : (
              <>
                <CheckCircle2 size={18} />
                <span>{t('splitPayment.confirmAndComplete', 'Complete Split Sale')}</span>
                <span className="font-mono text-xs opacity-70">
                  (Rs. {grandTotal.toFixed(2)})
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
