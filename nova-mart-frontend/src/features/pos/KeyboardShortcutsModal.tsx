import { Keyboard, X, Barcode, ShoppingCart, CreditCard, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  keys: string[];
  description: string;
}

export default function KeyboardShortcutsModal({ isOpen, onClose }: Props) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  const productShortcuts: ShortcutItem[] = [
    { keys: ['F1'], description: t('keyboardShortcuts.search') },
    { keys: ['Scanner'], description: t('keyboardShortcuts.scannerAutoCaptureDesc') },
    { keys: ['+'], description: t('keyboardShortcuts.increaseQty') },
    { keys: ['-'], description: t('keyboardShortcuts.decreaseQty') },
    { keys: ['Del'], description: t('keyboardShortcuts.removeLast') },
  ];

  const orderShortcuts: ShortcutItem[] = [
    { keys: ['F2'], description: t('keyboardShortcuts.customer') },
    { keys: ['F3'], description: t('keyboardShortcuts.discount') },
    { keys: ['F4'], description: t('keyboardShortcuts.promo') },
  ];

  const paymentShortcuts: ShortcutItem[] = [
    { keys: ['F7'], description: t('keyboardShortcuts.exactAmount') },
    { keys: ['F8'], description: t('keyboardShortcuts.payCash') },
    { keys: ['F9'], description: t('keyboardShortcuts.payCard') },
    { keys: ['F10'], description: t('keyboardShortcuts.payBank') },
    { keys: ['F12', 'Ctrl+Enter'], description: t('keyboardShortcuts.checkout') },
  ];

  const navigationShortcuts: ShortcutItem[] = [
    { keys: ['Esc'], description: t('keyboardShortcuts.cancelClose') },
    { keys: ['?'], description: t('keyboardShortcuts.showShortcuts') },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-line rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-line bg-surface/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
              <Keyboard size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-ink-900">{t('keyboardShortcuts.title')}</h2>
              <p className="text-xs text-ink-500">{t('keyboardShortcuts.subtitle')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-ink-500 hover:text-ink-900 hover:bg-surface transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          {/* Hardware Barcode Scanner Note */}
          <div className="flex items-start gap-3 p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-emerald-900 text-xs">
            <Barcode size={22} className="shrink-0 text-emerald-600 mt-0.5" />
            <div>
              <p className="font-semibold text-emerald-800">{t('keyboardShortcuts.scannerAutoCapture')}</p>
              <p className="text-emerald-700 mt-0.5">{t('keyboardShortcuts.scannerAutoCaptureDesc')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Column 1: Products & Scanning */}
            <div className="space-y-4">
              <div>
                <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink-500 mb-2">
                  <ShoppingCart size={14} className="text-brand-600" />
                  Cart & Products
                </h3>
                <div className="space-y-2">
                  {productShortcuts.map((sc, idx) => (
                    <div key={idx} className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-surface/60 border border-line/60">
                      <span className="text-xs text-ink-700">{sc.description}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        {sc.keys.map((k, kIdx) => (
                          <kbd
                            key={kIdx}
                            className="px-2 py-0.5 text-xs font-mono font-semibold rounded-md border border-line bg-card shadow-xs text-ink-800"
                          >
                            {k}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink-500 mb-2">
                  <Sparkles size={14} className="text-brand-600" />
                  Discounts & Customer
                </h3>
                <div className="space-y-2">
                  {orderShortcuts.map((sc, idx) => (
                    <div key={idx} className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-surface/60 border border-line/60">
                      <span className="text-xs text-ink-700">{sc.description}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        {sc.keys.map((k, kIdx) => (
                          <kbd
                            key={kIdx}
                            className="px-2 py-0.5 text-xs font-mono font-semibold rounded-md border border-line bg-card shadow-xs text-ink-800"
                          >
                            {k}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Column 2: Payment & Checkout */}
            <div className="space-y-4">
              <div>
                <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink-500 mb-2">
                  <CreditCard size={14} className="text-brand-600" />
                  Payment & Checkout
                </h3>
                <div className="space-y-2">
                  {paymentShortcuts.map((sc, idx) => (
                    <div key={idx} className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-surface/60 border border-line/60">
                      <span className="text-xs text-ink-700">{sc.description}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        {sc.keys.map((k, kIdx) => (
                          <kbd
                            key={kIdx}
                            className="px-2 py-0.5 text-xs font-mono font-semibold rounded-md border border-line bg-card shadow-xs text-ink-800"
                          >
                            {k}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink-500 mb-2">
                  <Keyboard size={14} className="text-brand-600" />
                  Navigation
                </h3>
                <div className="space-y-2">
                  {navigationShortcuts.map((sc, idx) => (
                    <div key={idx} className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-surface/60 border border-line/60">
                      <span className="text-xs text-ink-700">{sc.description}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        {sc.keys.map((k, kIdx) => (
                          <kbd
                            key={kIdx}
                            className="px-2 py-0.5 text-xs font-mono font-semibold rounded-md border border-line bg-card shadow-xs text-ink-800"
                          >
                            {k}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-line bg-surface/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors"
          >
            Got it (Esc)
          </button>
        </div>
      </div>
    </div>
  );
}
