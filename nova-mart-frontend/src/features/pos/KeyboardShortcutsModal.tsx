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
    { keys: ['F5'], description: t('keyboardShortcuts.holdCart') },
    { keys: ['F6'], description: t('keyboardShortcuts.recallCart') },
  ];

  const paymentShortcuts: ShortcutItem[] = [
    { keys: ['F7'], description: t('keyboardShortcuts.exactAmount') },
    { keys: ['F8'], description: t('keyboardShortcuts.payCash') },
    { keys: ['F9'], description: t('keyboardShortcuts.payCard') },
    { keys: ['F10'], description: t('keyboardShortcuts.payBank') },
    { keys: ['F11'], description: t('keyboardShortcuts.splitPayment', 'Split Payment (Multi-Tender)') },
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
            className="p-2 rounded-lg text-ink-500 hover:text-ink-900 hover:bg-surface transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Scanner Highlight Box */}
          <div className="p-4 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-start gap-3.5">
            <div className="p-2 bg-brand-600 text-white rounded-lg">
              <Barcode size={22} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-brand-900">{t('keyboardShortcuts.scannerTitle')}</h3>
              <p className="text-xs text-brand-700 mt-0.5 leading-relaxed">
                {t('keyboardShortcuts.scannerDesc')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Items & Cart */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-ink-500 uppercase tracking-wider">
                <ShoppingCart size={14} />
                <span>{t('keyboardShortcuts.cartGroup')}</span>
              </div>
              <div className="space-y-2">
                {productShortcuts.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-1.5 border-b border-line/60">
                    <span className="text-sm text-ink-700">{item.description}</span>
                    <div className="flex items-center gap-1">
                      {item.keys.map((k) => (
                        <kbd
                          key={k}
                          className="px-2 py-1 text-xs font-mono font-bold rounded-md bg-surface border border-line text-ink-900 shadow-2xs"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Controls */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-ink-500 uppercase tracking-wider">
                <Sparkles size={14} />
                <span>{t('keyboardShortcuts.orderGroup')}</span>
              </div>
              <div className="space-y-2">
                {orderShortcuts.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-1.5 border-b border-line/60">
                    <span className="text-sm text-ink-700">{item.description}</span>
                    <div className="flex items-center gap-1">
                      {item.keys.map((k) => (
                        <kbd
                          key={k}
                          className="px-2 py-1 text-xs font-mono font-bold rounded-md bg-surface border border-line text-ink-900 shadow-2xs"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment & Tender */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-ink-500 uppercase tracking-wider">
                <CreditCard size={14} />
                <span>{t('keyboardShortcuts.paymentGroup')}</span>
              </div>
              <div className="space-y-2">
                {paymentShortcuts.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-1.5 border-b border-line/60">
                    <span className="text-sm text-ink-700">{item.description}</span>
                    <div className="flex items-center gap-1">
                      {item.keys.map((k) => (
                        <kbd
                          key={k}
                          className="px-2 py-1 text-xs font-mono font-bold rounded-md bg-surface border border-line text-ink-900 shadow-2xs"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* General Navigation */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-ink-500 uppercase tracking-wider">
                <Keyboard size={14} />
                <span>{t('keyboardShortcuts.generalGroup')}</span>
              </div>
              <div className="space-y-2">
                {navigationShortcuts.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-1.5 border-b border-line/60">
                    <span className="text-sm text-ink-700">{item.description}</span>
                    <div className="flex items-center gap-1">
                      {item.keys.map((k) => (
                        <kbd
                          key={k}
                          className="px-2 py-1 text-xs font-mono font-bold rounded-md bg-surface border border-line text-ink-900 shadow-2xs"
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

        {/* Footer */}
        <div className="p-4 border-t border-line bg-surface/50 flex justify-between items-center text-xs text-ink-500">
          <span>{t('keyboardShortcuts.hint')}</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-medium transition-colors"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
