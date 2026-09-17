import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';
import { saleService } from '../services/saleService';

export default function SalesHistoryPage() {
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data: sales = [], isLoading } = useQuery({ queryKey: ['sales'], queryFn: saleService.getAll });

  const filtered = sales.filter(
    (s) =>
      s.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      s.customerName.toLowerCase().includes(search.toLowerCase())
  );

  const toggleExpand = (id: number) => setExpandedId((prev) => (prev === id ? null : id));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Sales History</h1>

      <div className="relative mb-4 max-w-sm">
        <Search size={18} className="absolute left-3 top-2.5 text-ink-500" />
        <input
          type="text"
          placeholder="Search by invoice or customer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-3 py-2 border border-ink-500/20 rounded-lg"
        />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left text-ink-500">
            <tr>
              <th className="px-4 py-3">Invoice</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Cashier</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading && <tr><td colSpan={6} className="px-4 py-6 text-center text-ink-500">Loading...</td></tr>}
            {!isLoading && filtered.length === 0 && <tr><td colSpan={6} className="px-4 py-6 text-center text-ink-500">No sales found.</td></tr>}
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
                        <div className="flex justify-between"><span className="text-ink-500">Subtotal</span><span>Rs. {sale.subtotal.toFixed(2)}</span></div>
                        <div className="flex justify-between"><span className="text-ink-500">Discount</span><span>Rs. {sale.discount.toFixed(2)}</span></div>
                        <div className="flex justify-between"><span className="text-ink-500">Tax</span><span>Rs. {sale.tax.toFixed(2)}</span></div>
                        <div className="flex justify-between font-bold"><span>Total</span><span>Rs. {sale.grandTotal.toFixed(2)}</span></div>
                        <div className="flex justify-between text-ink-500"><span>Paid ({sale.paymentMethod})</span><span>Rs. {sale.amountPaid.toFixed(2)}</span></div>
                        <div className="flex justify-between text-ink-500"><span>Change</span><span>Rs. {sale.change.toFixed(2)}</span></div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}