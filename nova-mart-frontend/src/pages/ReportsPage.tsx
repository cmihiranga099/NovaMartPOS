import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileDown, FileSpreadsheet, TrendingUp, Percent, Receipt as ReceiptIcon, Package } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { saleService } from '../services/saleService';
import { productService } from '../services/productService';
import { shopInfo } from '../config/shopInfo';
import { exportPnLToPdf, exportDailyBreakdownToExcel, type DailyPnLRow } from '../utils/exportUtils';

function monthStartISO() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
}
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function StatCard({ icon: Icon, label, value }: { icon: typeof TrendingUp; label: string; value: string }) {
  return (
    <div className="bg-white rounded-lg border border-line shadow p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-ink-500">{label}</p>
        <p className="text-lg font-bold truncate">{value}</p>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const { t } = useTranslation();
  const [fromDate, setFromDate] = useState(monthStartISO());
  const [toDate, setToDate] = useState(todayISO());

  const { data: sales = [] } = useQuery({ queryKey: ['sales'], queryFn: saleService.getAll });
  const { data: products = [] } = useQuery({ queryKey: ['products'], queryFn: productService.getAll });

  const purchasePriceById = useMemo(() => {
    const map = new Map<number, number>();
    products.forEach((p) => map.set(p.id, p.purchasePrice));
    return map;
  }, [products]);

  const filteredSales = useMemo(
    () => sales.filter((s) => {
      const day = s.createdAt.slice(0, 10);
      return day >= fromDate && day <= toDate;
    }),
    [sales, fromDate, toDate]
  );

  const { summary, dailyRows } = useMemo(() => {
    let netSales = 0;
    let discountsGiven = 0;
    let taxCollected = 0;
    let cogs = 0;

    const dayBuckets = new Map<string, { transactions: number; revenue: number; cogs: number }>();

    for (const sale of filteredSales) {
      const saleNet = sale.subtotal - sale.discount - sale.promoDiscount;
      netSales += saleNet;
      discountsGiven += sale.discount + sale.promoDiscount;
      taxCollected += sale.tax;

      let saleCogs = 0;
      for (const item of sale.items) {
        const unitCost = purchasePriceById.get(item.productId) ?? 0;
        saleCogs += unitCost * item.quantity;
      }
      cogs += saleCogs;

      const day = sale.createdAt.slice(0, 10);
      const bucket = dayBuckets.get(day) ?? { transactions: 0, revenue: 0, cogs: 0 };
      bucket.transactions += 1;
      bucket.revenue += saleNet;
      bucket.cogs += saleCogs;
      dayBuckets.set(day, bucket);
    }

    const rows: DailyPnLRow[] = Array.from(dayBuckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, b]) => ({
        date,
        transactions: b.transactions,
        revenue: b.revenue,
        cogs: b.cogs,
        profit: b.revenue - b.cogs,
      }));

    return {
      summary: {
        netSales,
        discountsGiven,
        taxCollected,
        cogs,
        grossProfit: netSales - cogs,
        transactionCount: filteredSales.length,
      },
      dailyRows: rows,
    };
  }, [filteredSales, purchasePriceById]);

  const handleExportPdf = () => {
    exportPnLToPdf(shopInfo, fromDate, toDate, summary, dailyRows);
  };

  const handleExportExcel = () => {
    exportDailyBreakdownToExcel(dailyRows);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">{t('reports.title')}</h1>
          <p className="text-sm text-ink-500 mt-0.5">{t('reports.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportExcel}
            disabled={dailyRows.length === 0}
            className="flex items-center gap-2 px-3 py-2 border border-line bg-white rounded-lg hover:bg-surface disabled:opacity-50 font-medium text-sm"
          >
            <FileSpreadsheet size={16} /> {t('reports.exportExcel')}
          </button>
          <button
            onClick={handleExportPdf}
            disabled={dailyRows.length === 0}
            className="flex items-center gap-2 px-3 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 font-medium text-sm"
          >
            <FileDown size={16} /> {t('reports.exportPdf')}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3 mt-5 mb-5">
        <div>
          <label className="block text-xs font-medium text-ink-700 mb-1">{t('common.from')}</label>
          <input
            type="date"
            value={fromDate}
            max={toDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="px-3 py-2 border border-ink-500/20 rounded-lg text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-ink-700 mb-1">{t('common.to')}</label>
          <input
            type="date"
            value={toDate}
            min={fromDate}
            max={todayISO()}
            onChange={(e) => setToDate(e.target.value)}
            className="px-3 py-2 border border-ink-500/20 rounded-lg text-sm"
          />
        </div>
      </div>

      {dailyRows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-line text-center">
          <p className="font-medium text-ink-900">{t('reports.noData')}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <StatCard icon={TrendingUp} label={t('reports.netSalesRevenue')} value={`Rs. ${summary.netSales.toFixed(2)}`} />
            <StatCard icon={Package} label={t('reports.cogs')} value={`Rs. ${summary.cogs.toFixed(2)}`} />
            <StatCard icon={TrendingUp} label={t('reports.grossProfit')} value={`Rs. ${summary.grossProfit.toFixed(2)}`} />
            <StatCard icon={Percent} label={t('reports.discountsGiven')} value={`Rs. ${summary.discountsGiven.toFixed(2)}`} />
            <StatCard icon={Percent} label={t('reports.taxCollected')} value={`Rs. ${summary.taxCollected.toFixed(2)}`} />
            <StatCard icon={ReceiptIcon} label={t('reports.transactions')} value={String(summary.transactionCount)} />
          </div>

          <div className="bg-white rounded-lg border border-line shadow overflow-hidden">
            <div className="px-4 py-3 border-b border-line font-bold text-sm">{t('reports.dailyBreakdown')}</div>
            <table className="w-full text-sm">
              <thead className="bg-surface text-left text-ink-500">
                <tr>
                  <th className="px-4 py-2">{t('common.date')}</th>
                  <th className="px-4 py-2 text-right">{t('reports.transactions')}</th>
                  <th className="px-4 py-2 text-right">{t('reports.netSalesRevenue')}</th>
                  <th className="px-4 py-2 text-right">{t('reports.cogs')}</th>
                  <th className="px-4 py-2 text-right">{t('reports.grossProfit')}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {dailyRows.map((row) => (
                  <tr key={row.date}>
                    <td className="px-4 py-2">{row.date}</td>
                    <td className="px-4 py-2 text-right">{row.transactions}</td>
                    <td className="px-4 py-2 text-right">Rs. {row.revenue.toFixed(2)}</td>
                    <td className="px-4 py-2 text-right">Rs. {row.cogs.toFixed(2)}</td>
                    <td className="px-4 py-2 text-right font-medium">Rs. {row.profit.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}