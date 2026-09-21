import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, ChevronDown, ChevronUp, Printer, FileSpreadsheet } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { saleService } from '../services/saleService';
import Receipt from '../features/pos/Receipt';
import { exportSalesToExcel } from '../utils/exportUtils';

export default function SalesHistoryPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const { data: sales = [], isLoading } = useQuery({ queryKey: ['sales'], queryFn: saleService.getAll });
  const [printSale, setPrintSale] = useState<typeof sales[number] | null>(null);

  const filtered = useMemo(() => {
    return sales.filter((s) => {
      const matchesSearch =
        s.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
        s.customerName.toLowerCase().includes(search.toLowerCase());
      const saleDay = s.createdAt.slice(0, 10);
      const matchesFrom = !fromDate || saleDay >= fromDate;
      const matchesTo = !toDate || saleDay <= toDate;
      return matchesSearch && matchesFrom && matchesTo;
    });
  }, [sales, search, fromDate, toDate]);

  const toggleExpand = (id: number) => setExpandedId((prev) => (prev === id ? null : id));

  const handleExport = () => {
    exportSalesToExcel(filtered);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h1 className="text-2xl font-bold">{t('salesHistory.title')}</h1>
        <button
          onClick={handleExport}
          disabled={filtered.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 font-medium text-sm"
        >
          <FileSpreadsheet size={16} /> {t('salesHistory.exportExcel')}
        </button>
      </div>

      <div className="flex flex-wrap items-end gap-3 mb-4">
        <div className="relative max-w-sm flex-1 min-w-[200px]">
          <Search size={18} className="absolute left-3 top-2.5 text-ink-500" />
          <input
            type="text"
            placeholder={t('salesHistory.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-ink-500/20 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-ink-700 mb-1">{t('common.from')}</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="px-3 py-2 border border-ink-500/20 rounded-lg text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-ink-700 mb-1">{t('common.to')}</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="px-3 py-2 border border-ink-500/20 rounded-lg text-sm"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-line shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left text-ink-500">
            <tr>
              <th className="px-4 py-3">{t('salesHistory.invoice')}</th>
              <th className="px-4 py-3">{t('salesHistory.customer')}</th>
              <th className="px-4 py-3">{t('salesHistory.cashier')}</th>
              <th className="px-4 py-3">{t('common.date')}</th>
              <th className="px-4 py-3 text-right">{t('common.total')}</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading && <tr><td colSpan={6} className="px-4 py-6 text-center text-ink-500">{t('common.loading')}</td></tr>}
            {!isLoading && filtered.length === 0 && <tr><td colSpan={6} className="px-4 py-6 text-center text-ink-500">{t('salesHistory.noSalesFound')}</td></tr>}
            {filtered.map((sale) => (
              <>
                <tr
                  key={sale.id}
                  onClick={() => toggleExpand(sale.id)}
                  className="hover:bg-surface cursor-pointer"
                >
                  <td className="px-4 py-3 font-medium">{sale.invoiceNumber}</td>
                  <td className="px-4 py-3">{sale.customerName}</td>
                  <td className="px-4 py-3">{sale.cashierName}</td>
                  <td className="px-4 py-3 text-ink-500">
                    {new Date(sale.createdAt).toLocaleString('en-LK', { dateStyle: 'medium', timeStyle: 'short' })}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">Rs. {sale.grandTotal.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-ink-500">
                    {expandedId === sale.id ? <ChevronUp size={16} className="inline" /> : <ChevronDown size={16} className="inline" />}
                  </td>
                </tr>
                {expandedId === sale.id && (
                  <tr>
                    <td colSpan={6} className="px-4 py-4 bg-surface">
                      <div className="space-y-2 mb-3">
                        {sale.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span>{item.productName} × {item.quantity}</span>
                            <span>Rs. {item.total.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="border-t border-ink-500/10 pt-2 text-sm space-y-1 max-w-xs ml-auto">
                        <div className="flex justify-between"><span className="text-ink-500">{t('common.subtotal')}</span><span>Rs. {sale.subtotal.toFixed(2)}</span></div>
                        <div className="flex justify-between"><span className="text-ink-500">{t('common.discount')}</span><span>Rs. {sale.discount.toFixed(2)}</span></div>
                        <div className="flex justify-between"><span className="text-ink-500">{t('common.tax')}</span><span>Rs. {sale.tax.toFixed(2)}</span></div>
                        <div className="flex justify-between font-bold"><span>{t('common.total')}</span><span>Rs. {sale.grandTotal.toFixed(2)}</span></div>
                        <div className="flex justify-between text-ink-500"><span>{t('pos.paid')} ({sale.paymentMethod})</span><span>Rs. {sale.amountPaid.toFixed(2)}</span></div>
                        <div className="flex justify-between text-ink-500"><span>{t('pos.change')}</span><span>Rs. {sale.change.toFixed(2)}</span></div>
                      </div>
                      <button
                        onClick={() => { setPrintSale(sale); setTimeout(() => window.print(), 50); }}
                        className="flex items-center gap-2 mt-3 px-3 py-1.5 bg-brand-600 text-white text-xs rounded-lg hover:bg-brand-700"
                      >
                        <Printer size={14} /> {t('salesHistory.printReceipt')}
                      </button>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {printSale && <Receipt sale={printSale} />}
    </div>
  );
}