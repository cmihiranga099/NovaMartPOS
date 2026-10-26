import { useState } from 'react';
import { X, Printer, CheckCircle2, AlertTriangle, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ShiftSummary } from '../../types/shift';
import ZReportReceipt from './ZReportReceipt';

interface ZReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: ShiftSummary;
  onConfirmClose: (countedCash: number, notes?: string) => Promise<ShiftSummary>;
  isProcessing?: boolean;
}

export default function ZReportModal({
  isOpen,
  onClose,
  summary,
  onConfirmClose,
  isProcessing = false,
}: ZReportModalProps) {
  const { t } = useTranslation();
  const [countedCash, setCountedCash] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [closedSummary, setClosedSummary] = useState<ShiftSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const countedNum = countedCash !== '' ? Number(countedCash) : null;
  const currentSummary = closedSummary || summary;
  const variance = countedNum !== null ? countedNum - currentSummary.expectedCash : null;

  const handleCloseShift = async () => {
    if (countedNum === null || isNaN(countedNum) || countedNum < 0) {
      setError(t('shift.enterCountedCash', 'Please count and enter the actual physical cash in the drawer.'));
      return;
    }

    try {
      setError(null);
      const res = await onConfirmClose(countedNum, notes.trim() || undefined);
      setClosedSummary(res);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || t('shift.closeError', 'Failed to close shift.'));
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-line rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-line bg-surface/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-600 flex items-center justify-center font-bold">
              <DollarSign size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-ink-900">
                {closedSummary
                  ? t('shift.zReportCompleted', 'Z-Report (Shift Closed)')
                  : t('shift.zReportTitle', 'End of Shift & Z-Report Reconciliation')}
              </h2>
              <p className="text-xs text-ink-500">
                {closedSummary
                  ? t('shift.zReportClosedDesc', 'Shift has been locked and reconciled. Print record for filing.')
                  : t('shift.zReportSubtitle', 'Count cash drawer and verify drawer balance before closing.')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-ink-500 hover:text-ink-900 hover:bg-surface transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Key Metric Highlights */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-surface rounded-xl p-3 border border-line">
              <span className="text-[11px] font-bold text-ink-500 uppercase tracking-wider block">
                {t('shift.startingFloat', 'Opening Float')}
              </span>
              <span className="text-lg font-black text-ink-900">
                Rs. {currentSummary.startingCash.toFixed(2)}
              </span>
            </div>

            <div className="bg-surface rounded-xl p-3 border border-line">
              <span className="text-[11px] font-bold text-ink-500 uppercase tracking-wider block">
                {t('shift.totalSalesRevenue', 'Total Sales Revenue')}
              </span>
              <span className="text-lg font-black text-brand-600">
                Rs. {currentSummary.totalSales.toFixed(2)}
              </span>
              <span className="text-[10px] text-ink-500 block">
                {currentSummary.totalTransactions} transactions
              </span>
            </div>

            <div className="bg-surface rounded-xl p-3 border border-line">
              <span className="text-[11px] font-bold text-ink-500 uppercase tracking-wider block">
                {t('shift.expectedCashDrawer', 'Expected Cash in Drawer')}
              </span>
              <span className="text-lg font-black text-ink-900">
                Rs. {currentSummary.expectedCash.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Breakdown Section */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            {/* Sales Tender Breakdown */}
            <div className="p-3.5 bg-surface rounded-xl border border-line space-y-2">
              <span className="font-bold text-ink-700 uppercase tracking-wider block text-[11px]">
                {t('shift.revenueByTender', 'Revenue by Tender')}
              </span>
              <div className="flex justify-between py-1 border-b border-line/60">
                <span className="text-ink-600">{t('pos.cash', 'Cash Sales')}:</span>
                <span className="font-bold">Rs. {currentSummary.cashSales.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-line/60">
                <span className="text-ink-600">{t('pos.card', 'Card Sales')}:</span>
                <span className="font-bold">Rs. {currentSummary.cardSales.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-line/60">
                <span className="text-ink-600">{t('pos.bankTransfer', 'Bank Transfer')}:</span>
                <span className="font-bold">Rs. {currentSummary.bankSales.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 font-bold text-ink-900">
                <span>{t('common.total', 'Gross Total')}:</span>
                <span>Rs. {currentSummary.totalSales.toFixed(2)}</span>
              </div>
            </div>

            {/* Petty Cash & Drawer Movements */}
            <div className="p-3.5 bg-surface rounded-xl border border-line space-y-2">
              <span className="font-bold text-ink-700 uppercase tracking-wider block text-[11px]">
                {t('shift.drawerAdjustments', 'Drawer Cash Adjustments')}
              </span>
              <div className="flex justify-between py-1 border-b border-line/60">
                <span className="text-ink-600">{t('shift.cashIn', '(+) Cash In / Floats')}:</span>
                <span className="font-bold text-emerald-600">+Rs. {currentSummary.cashIn.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-line/60">
                <span className="text-ink-600">{t('shift.cashOut', '(-) Cash Out / Drops')}:</span>
                <span className="font-bold text-rose-600">-Rs. {currentSummary.cashOut.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-line/60">
                <span className="text-ink-600">{t('shift.refunds', '(-) Customer Refunds')}:</span>
                <span className="font-bold text-rose-600">-Rs. {currentSummary.totalRefunds.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 font-bold text-ink-900">
                <span>{t('shift.netCashFlow', 'Net Cash Added')}:</span>
                <span>
                  Rs. {(currentSummary.cashSales + currentSummary.cashIn - currentSummary.cashOut - currentSummary.totalRefunds).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Blind Count Entry & Variance calculation */}
          {!closedSummary ? (
            <div className="p-4 rounded-xl border border-line bg-brand-500/5 space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                  {t('shift.blindCashCount', 'Actual Counted Cash in Drawer (Rs.)')} *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-ink-400">
                    Rs.
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={countedCash}
                    onChange={(e) => setCountedCash(e.target.value)}
                    placeholder="Enter physical cash counted in drawer..."
                    className="w-full pl-12 pr-4 py-2.5 bg-card border border-line rounded-xl text-lg font-bold text-right text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    autoFocus
                  />
                </div>
              </div>

              {/* Live Variance preview */}
              {variance !== null && (
                <div
                  className={`p-3 rounded-lg border flex items-center justify-between text-xs font-bold ${
                    Math.abs(variance) < 0.01
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800'
                      : variance > 0
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-800'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {Math.abs(variance) < 0.01 ? (
                      <CheckCircle2 size={16} className="text-emerald-600" />
                    ) : variance > 0 ? (
                      <TrendingUp size={16} className="text-amber-600" />
                    ) : (
                      <TrendingDown size={16} className="text-rose-600" />
                    )}
                    <span>
                      {Math.abs(variance) < 0.01
                        ? t('shift.balanced', 'DRAWER BALANCED PERFECTLY')
                        : variance > 0
                        ? t('shift.overage', 'DRAWER OVERAGE (EXCESS CASH)')
                        : t('shift.shortage', 'DRAWER SHORTAGE (DEFICIT CASH)')}
                    </span>
                  </div>
                  <span className="text-sm">
                    {variance > 0 ? `+Rs. ${variance.toFixed(2)}` : `Rs. ${variance.toFixed(2)}`}
                  </span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                  {t('shift.closingNotes', 'Shift Closing Notes (Optional)')}
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Reason for variance or handover notes..."
                  className="w-full px-3 py-2 bg-card border border-line rounded-lg text-xs text-ink-900 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>
          ) : (
            /* Closed State Banner */
            <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={24} className="text-emerald-600" />
                <div>
                  <h3 className="text-sm font-bold text-emerald-900">
                    {t('shift.closedSuccess', 'Shift Successfully Closed & Logged')}
                  </h3>
                  <p className="text-xs text-emerald-700">
                    Ending Cash: Rs. {closedSummary.countedCash?.toFixed(2)} · Variance:{' '}
                    {(closedSummary.variance ?? 0) >= 0
                      ? `+Rs. ${(closedSummary.variance ?? 0).toFixed(2)}`
                      : `Rs. ${(closedSummary.variance ?? 0).toFixed(2)}`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              <AlertTriangle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-line bg-surface/50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-line text-sm font-semibold text-ink-700 hover:bg-card transition-colors"
          >
            {closedSummary ? t('common.done', 'Done') : t('common.cancel', 'Cancel')}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="py-2.5 px-4 rounded-xl font-bold text-xs border border-line bg-card hover:bg-surface text-ink-900 flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Printer size={16} />
              <span>{t('shift.printZReport', 'Print Z-Report Slip')}</span>
            </button>

            {!closedSummary && (
              <button
                type="button"
                onClick={handleCloseShift}
                disabled={isProcessing || countedCash === ''}
                className="py-2.5 px-5 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white transition-all flex items-center gap-2 shadow-xs"
              >
                <CheckCircle2 size={16} />
                <span>{isProcessing ? t('pos.processing', 'Closing...') : t('shift.closeAndLock', 'Lock & Close Shift')}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Hidden printable thermal slip for standard 80mm roll */}
      <ZReportReceipt summary={currentSummary} />
    </div>
  );
}
