import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, AlertTriangle, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { reportService } from '../services/reportService';
import { subscribeToDashboardHub } from '../services/dashboardHub';
import type { Product } from '../types/product';

const POLL_INTERVAL_MS = 60_000; // safety-net refresh even without a live sale event
const TOAST_DURATION_MS = 6_000;

interface Toast {
  id: string;
  product: Product;
}

export default function LowStockAlert() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);
  const knownLowStockIds = useRef<Set<number> | null>(null);

  const { data: lowStock = [] } = useQuery({
    queryKey: ['low-stock'],
    queryFn: reportService.getLowStock,
    refetchInterval: POLL_INTERVAL_MS,
  });

  // Re-check for low stock the instant a sale completes anywhere in the app.
  useEffect(() => {
    const unsubscribe = subscribeToDashboardHub({
      onSaleCompleted: () => {
        queryClient.invalidateQueries({ queryKey: ['low-stock'] });
      },
    });
    return unsubscribe;
  }, [queryClient]);

  // Whenever the low-stock list changes, pop a toast for any product that
  // has newly dropped to/below its minimum level since we last checked.
  useEffect(() => {
    const currentIds = new Set(lowStock.map((p) => p.id));

    if (knownLowStockIds.current === null) {
      // First load: don't toast for items that were already low before the
      // app opened, just remember them.
      knownLowStockIds.current = currentIds;
      return;
    }

    const newlyLow = lowStock.filter((p) => !knownLowStockIds.current!.has(p.id));
    if (newlyLow.length > 0) {
      setToasts((prev) => [
        ...prev,
        ...newlyLow.map((product) => ({ id: `${product.id}-${Date.now()}`, product })),
      ]);
    }

    knownLowStockIds.current = currentIds;
  }, [lowStock]);

  // Auto-dismiss toasts.
  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setTimeout(() => {
      setToasts((prev) => prev.slice(1));
    }, TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [toasts]);

  // Close the dropdown when clicking outside it.
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

  const dismissToast = (id: string) => setToasts((prev) => prev.filter((toast) => toast.id !== id));

  return (
    <>
      <div className="relative" ref={panelRef}>
        <button
          onClick={() => setOpen((v) => !v)}
          className="relative flex items-center justify-center w-9 h-9 rounded-lg text-ink-700 hover:bg-brand-50 transition-colors"
          title={t('lowStockAlert.title')}
        >
          <Bell size={18} />
          {lowStock.length > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
              {lowStock.length > 99 ? '99+' : lowStock.length}
            </span>
          )}
        </button>

        {open && (
          <div className="absolute left-0 top-11 z-50 w-80 bg-white rounded-lg border border-line shadow-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-line flex items-center justify-between">
              <h3 className="font-bold text-sm text-ink-900">{t('lowStockAlert.title')}</h3>
              {lowStock.length > 0 && (
                <span className="text-xs font-semibold text-red-600">
                  {t('lowStockAlert.count', { count: lowStock.length })}
                </span>
              )}
            </div>

            <div className="max-h-72 overflow-y-auto">
              {lowStock.length === 0 ? (
                <p className="px-4 py-6 text-sm text-ink-500 text-center">{t('dashboard.allStocked')}</p>
              ) : (
                lowStock.map((p) => (
                  <div key={p.id} className="px-4 py-2.5 border-b border-line last:border-b-0 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink-900 truncate">{p.name}</p>
                      <p className="text-xs text-ink-500">{t('lowStockAlert.minimum', { count: p.minimumStockLevel })}</p>
                    </div>
                    <span className="shrink-0 text-sm font-bold text-red-600">
                      {t('dashboard.leftInStock', { count: p.stockQuantity })}
                    </span>
                  </div>
                ))
              )}
            </div>

            {lowStock.length > 0 && (
              <Link
                to="/products"
                onClick={() => setOpen(false)}
                className="block px-4 py-2.5 text-center text-sm font-semibold text-brand-600 hover:bg-brand-50 border-t border-line"
              >
                {t('lowStockAlert.viewAll')}
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Toasts: fixed to the viewport so they show up no matter which page is open */}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 w-80">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="bg-white border border-red-200 shadow-lg rounded-lg p-3.5 flex items-start gap-3 animate-[fadeIn_0.2s_ease-out]"
          >
            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
              <AlertTriangle size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink-900">{t('lowStockAlert.toastTitle')}</p>
              <p className="text-xs text-ink-500 truncate">
                {t('lowStockAlert.toastBody', { name: toast.product.name, count: toast.product.stockQuantity })}
              </p>
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="text-ink-400 hover:text-ink-700 shrink-0"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </>
  );
}