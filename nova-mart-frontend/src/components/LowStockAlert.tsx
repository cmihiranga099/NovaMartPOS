import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, AlertTriangle, CalendarClock, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { reportService } from '../services/reportService';
import { subscribeToDashboardHub } from '../services/dashboardHub';
import type { Product } from '../types/product';

const POLL_INTERVAL_MS = 60_000; // safety-net refresh even without a live sale event
const TOAST_DURATION_MS = 6_000;
const EXPIRY_WINDOW_DAYS = 30;

type ToastKind = 'low-stock' | 'expiring';

interface Toast {
  id: string;
  kind: ToastKind;
  product: Product;
}

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export default function LowStockAlert() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);
  const knownLowStockIds = useRef<Set<number> | null>(null);
  const knownExpiringIds = useRef<Set<number> | null>(null);

  const { data: lowStock = [] } = useQuery({
    queryKey: ['low-stock'],
    queryFn: reportService.getLowStock,
    refetchInterval: POLL_INTERVAL_MS,
  });

  const { data: expiring = [] } = useQuery({
    queryKey: ['expiring-products'],
    queryFn: () => reportService.getExpiringProducts(EXPIRY_WINDOW_DAYS),
    refetchInterval: POLL_INTERVAL_MS,
  });

  const totalCount = lowStock.length + expiring.length;

  // Re-check both lists the instant a sale completes anywhere in the app.
  useEffect(() => {
    const unsubscribe = subscribeToDashboardHub({
      onSaleCompleted: () => {
        queryClient.invalidateQueries({ queryKey: ['low-stock'] });
        queryClient.invalidateQueries({ queryKey: ['expiring-products'] });
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
        ...newlyLow.map((product) => ({ id: `ls-${product.id}-${Date.now()}`, kind: 'low-stock' as ToastKind, product })),
      ]);
    }

    knownLowStockIds.current = currentIds;
  }, [lowStock]);

  // Same idea for newly-expiring products.
  useEffect(() => {
    const currentIds = new Set(expiring.map((p) => p.id));

    if (knownExpiringIds.current === null) {
      knownExpiringIds.current = currentIds;
      return;
    }

    const newlyExpiring = expiring.filter((p) => !knownExpiringIds.current!.has(p.id));
    if (newlyExpiring.length > 0) {
      setToasts((prev) => [
        ...prev,
        ...newlyExpiring.map((product) => ({ id: `exp-${product.id}-${Date.now()}`, kind: 'expiring' as ToastKind, product })),
      ]);
    }

    knownExpiringIds.current = currentIds;
  }, [expiring]);

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
      <div className="relative shrink-0" ref={panelRef}>
        <button
          onClick={() => setOpen((v) => !v)}
          className="relative flex items-center justify-center py-1.5 px-2.5 rounded-lg border border-line text-ink-700 hover:bg-surface transition-colors"
          title={t('lowStockAlert.bellTitle')}
        >
          <Bell size={15} className={totalCount > 0 ? 'text-red-600' : ''} />
          {totalCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-[16px] px-1 rounded-full bg-red-600 text-white text-[9px] font-bold flex items-center justify-center">
              {totalCount > 99 ? '99+' : totalCount}
            </span>
          )}
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-2 z-50 w-80 bg-card rounded-lg border border-line shadow-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-line flex items-center justify-between">
              <h3 className="font-bold text-sm text-ink-900">{t('lowStockAlert.title')}</h3>
              {lowStock.length > 0 && (
                <span className="text-xs font-semibold text-red-600">
                  {t('lowStockAlert.count', { count: lowStock.length })}
                </span>
              )}
            </div>
            <div className="max-h-52 overflow-y-auto">
              {lowStock.length === 0 ? (
                <p className="px-4 py-5 text-sm text-ink-500 text-center">{t('dashboard.allStocked')}</p>
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

            <div className="px-4 py-3 border-b border-t border-line flex items-center justify-between">
              <h3 className="font-bold text-sm text-ink-900">{t('lowStockAlert.expiringTitle')}</h3>
              {expiring.length > 0 && (
                <span className="text-xs font-semibold text-red-600">
                  {t('lowStockAlert.count', { count: expiring.length })}
                </span>
              )}
            </div>
            <div className="max-h-52 overflow-y-auto">
              {expiring.length === 0 ? (
                <p className="px-4 py-5 text-sm text-ink-500 text-center">{t('lowStockAlert.noneExpiring')}</p>
              ) : (
                expiring.map((p) => {
                  const days = p.expiryDate ? daysUntil(p.expiryDate) : 0;
                  const label =
                    days < 0
                      ? t('lowStockAlert.expiredDaysAgo', { count: Math.abs(days) })
                      : days === 0
                        ? t('lowStockAlert.expiresToday')
                        : t('lowStockAlert.expiresInDays', { count: days });
                  return (
                    <div key={p.id} className="px-4 py-2.5 border-b border-line last:border-b-0 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink-900 truncate">{p.name}</p>
                        <p className="text-xs text-ink-500">{p.expiryDate?.slice(0, 10)}</p>
                      </div>
                      <span className="shrink-0 text-sm font-bold text-red-600">{label}</span>
                    </div>
                  );
                })
              )}
            </div>

            {totalCount > 0 && (
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
            className="bg-card border border-red-200 shadow-lg rounded-lg p-3.5 flex items-start gap-3 animate-[fadeIn_0.2s_ease-out]"
          >
            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
              {toast.kind === 'low-stock' ? <AlertTriangle size={16} /> : <CalendarClock size={16} />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink-900">
                {toast.kind === 'low-stock' ? t('lowStockAlert.toastTitle') : t('lowStockAlert.expiringToastTitle')}
              </p>
              <p className="text-xs text-ink-500 truncate">
                {toast.kind === 'low-stock'
                  ? t('lowStockAlert.toastBody', { name: toast.product.name, count: toast.product.stockQuantity })
                  : t('lowStockAlert.expiringToastBody', { name: toast.product.name, date: toast.product.expiryDate?.slice(0, 10) })}
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