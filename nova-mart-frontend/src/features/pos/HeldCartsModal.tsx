import { useState } from 'react';
import { ShoppingBag, Clock, Trash2, ArrowRight, X, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { CartLine } from './CartItem';

export interface HeldCart {
  id: string;
  createdAt: string;
  note: string;
  items: CartLine[];
  customerId: number;
  customerName?: string;
  appliedPromo?: { code: string; discount: number } | null;
  discountApprovedPin?: string | null;
  discountApprovedBy?: string | null;
  total: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  heldCarts: HeldCart[];
  onRecall: (cart: HeldCart, mode: 'replace' | 'merge') => void;
  onDiscard: (id: string) => void;
  isCurrentCartEmpty: boolean;
}

export default function HeldCartsModal({
  isOpen,
  onClose,
  heldCarts,
  onRecall,
  onDiscard,
  isCurrentCartEmpty,
}: Props) {
  const { t } = useTranslation();
  const [pendingRecallCart, setPendingRecallCart] = useState<HeldCart | null>(null);

  if (!isOpen) return null;

  const handleRecallClick = (cart: HeldCart) => {
    if (isCurrentCartEmpty) {
      onRecall(cart, 'replace');
      onClose();
    } else {
      // Current cart has items, prompt for replace or merge
      setPendingRecallCart(cart);
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const getRelativeMinutes = (isoString: string) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const mins = Math.max(0, Math.floor(diffMs / 60000));
      if (mins === 0) return 'Just now';
      if (mins === 1) return '1 min ago';
      return `${mins} mins ago`;
    } catch {
      return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-line rounded-2xl shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-line bg-surface/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <ShoppingBag size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-ink-900">{t('pos.heldCarts')}</h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                  {heldCarts.length}
                </span>
              </div>
              <p className="text-xs text-ink-500">Parked customer orders waiting to be resumed</p>
            </div>
          </div>
          <button
            onClick={() => {
              setPendingRecallCart(null);
              onClose();
            }}
            className="p-1.5 rounded-lg text-ink-500 hover:text-ink-900 hover:bg-surface transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Conflict prompt if current cart is not empty */}
        {pendingRecallCart && (
          <div className="p-4 bg-amber-50 border-b border-amber-200 text-amber-900 animate-in fade-in duration-150">
            <div className="flex items-start gap-2.5 mb-3">
              <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-xs sm:text-sm">{t('pos.activeCartNotEmpty')}</p>
                <p className="text-xs text-amber-800 mt-0.5">
                  Choose how to handle the items currently on the checkout counter.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 justify-end">
              <button
                type="button"
                onClick={() => setPendingRecallCart(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-amber-300 hover:bg-amber-100 text-amber-900"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={() => {
                  onRecall(pendingRecallCart, 'merge');
                  setPendingRecallCart(null);
                  onClose();
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface border border-line hover:bg-ink-500/10 text-ink-800"
              >
                {t('pos.mergeCart')}
              </button>
              <button
                type="button"
                onClick={() => {
                  onRecall(pendingRecallCart, 'replace');
                  setPendingRecallCart(null);
                  onClose();
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
              >
                {t('pos.holdCurrentAndResume')}
              </button>
            </div>
          </div>
        )}

        {/* List of Held Carts */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1 min-h-[160px]">
          {heldCarts.length === 0 ? (
            <div className="text-center py-12 text-ink-500">
              <ShoppingBag size={40} className="mx-auto text-ink-300 mb-2" />
              <p className="text-sm font-medium">{t('pos.noHeldCarts')}</p>
              <p className="text-xs text-ink-400 mt-1">Press F5 or click "Hold Cart" to park an active customer cart.</p>
            </div>
          ) : (
            heldCarts.map((cart) => {
              const totalItems = cart.items.reduce((sum, i) => sum + i.quantity, 0);
              return (
                <div
                  key={cart.id}
                  className="p-3.5 rounded-xl border border-line bg-surface/40 hover:bg-surface/80 transition-all flex flex-col gap-2.5 shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-ink-900">{cart.note || 'Held Cart'}</span>
                        <span className="text-[11px] font-mono text-ink-500 bg-card px-1.5 py-0.5 rounded border border-line">
                          {cart.customerName || `Customer #${cart.customerId}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-ink-500">
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {formatTime(cart.createdAt)} ({getRelativeMinutes(cart.createdAt)})
                        </span>
                        <span>•</span>
                        <span>{totalItems} item{totalItems === 1 ? '' : 's'}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-brand-600">Rs. {cart.total.toFixed(2)}</p>
                      {cart.appliedPromo && (
                        <p className="text-[10px] text-emerald-600 font-medium">Promo: {cart.appliedPromo.code}</p>
                      )}
                    </div>
                  </div>

                  {/* Quick line item summary */}
                  <div className="text-xs text-ink-600 bg-card/60 p-2 rounded-lg border border-line/60 line-clamp-2">
                    {cart.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => onDiscard(cart.id)}
                      className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded-lg transition-colors"
                    >
                      <Trash2 size={13} />
                      <span>{t('pos.discardCart')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRecallClick(cart)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                    >
                      <span>{t('pos.resumeCart')}</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-line bg-surface/40 flex justify-between items-center text-xs text-ink-500">
          <span>Tip: Press <kbd className="px-1.5 py-0.5 rounded bg-card border border-line font-mono font-bold text-ink-700">F5</kbd> to hold · <kbd className="px-1.5 py-0.5 rounded bg-card border border-line font-mono font-bold text-ink-700">F6</kbd> to view</span>
          <button
            onClick={() => {
              setPendingRecallCart(null);
              onClose();
            }}
            className="px-3 py-1.5 rounded-lg border border-line hover:bg-surface font-medium text-ink-700"
          >
            {t('common.cancel')} (Esc)
          </button>
        </div>
      </div>
    </div>
  );
}
