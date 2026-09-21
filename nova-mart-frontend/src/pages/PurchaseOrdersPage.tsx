import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, ChevronDown, ChevronUp, PackageCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supplierService } from '../services/supplierService';
import { productService } from '../services/productService';
import { purchaseOrderService } from '../services/purchaseOrderService';

interface DraftLine {
  productId: number;
  quantity: number;
  unitCost: number;
}

export default function PurchaseOrdersPage() {
  const { t } = useTranslation();
  const [supplierId, setSupplierId] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [productPick, setProductPick] = useState<number | ''>('');
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const { data: suppliers = [] } = useQuery({ queryKey: ['suppliers'], queryFn: supplierService.getAll });
  const { data: products = [] } = useQuery({ queryKey: ['products'], queryFn: productService.getAll });
  const { data: orders = [], isLoading } = useQuery({ queryKey: ['purchase-orders'], queryFn: purchaseOrderService.getAll });

  const activeSuppliers = suppliers.filter((s) => s.isActive);
  const activeProducts = products.filter((p) => p.isActive);

  const receiveMutation = useMutation({
    mutationFn: purchaseOrderService.receive,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['low-stock'] });
      setSupplierId('');
      setNotes('');
      setLines([]);
      setError(null);
    },
    onError: (err: unknown) => {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(message || 'Failed to receive purchase order.');
    },
  });

  const addLine = () => {
    if (productPick === '') return;
    const product = activeProducts.find((p) => p.id === productPick);
    if (!product) return;
    if (lines.some((l) => l.productId === product.id)) {
      setProductPick('');
      return;
    }
    setLines((prev) => [...prev, { productId: product.id, quantity: 1, unitCost: product.purchasePrice }]);
    setProductPick('');
  };

  const updateLine = (productId: number, patch: Partial<DraftLine>) => {
    setLines((prev) => prev.map((l) => (l.productId === productId ? { ...l, ...patch } : l)));
  };

  const removeLine = (productId: number) => {
    setLines((prev) => prev.filter((l) => l.productId !== productId));
  };

  const total = lines.reduce((sum, l) => sum + l.quantity * l.unitCost, 0);

  const handleReceive = () => {
    setError(null);
    if (supplierId === '') {
      setError('Select a supplier.');
      return;
    }
    if (lines.length === 0) {
      setError('Add at least one item.');
      return;
    }
    if (lines.some((l) => l.quantity <= 0 || l.unitCost < 0)) {
      setError('Quantity must be greater than zero and unit cost cannot be negative.');
      return;
    }

    receiveMutation.mutate({
      supplierId: supplierId as number,
      items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity, unitCost: l.unitCost })),
      notes: notes || null,
    });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">{t('purchaseOrders.title')}</h1>
      <p className="text-ink-500 mb-6">{t('purchaseOrders.subtitle')}</p>

      {/* New purchase order form */}
      <div className="bg-white rounded-lg border border-line shadow p-5 mb-8">
        <h2 className="font-bold mb-4">{t('purchaseOrders.newOrder')}</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-xs font-medium text-ink-700 mb-1">{t('purchaseOrders.supplier')}</label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-3 py-2 border border-ink-500/20 rounded-lg text-sm"
            >
              <option value="">{t('purchaseOrders.supplier')}...</option>
              {activeSuppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-700 mb-1">{t('purchaseOrders.notesOptional')}</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Weekly restock"
              className="w-full px-3 py-2 border border-ink-500/20 rounded-lg text-sm"
            />
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <select
            value={productPick}
            onChange={(e) => setProductPick(e.target.value ? Number(e.target.value) : '')}
            className="flex-1 px-3 py-2 border border-ink-500/20 rounded-lg text-sm"
          >
            <option value="">{t('purchaseOrders.addProduct')}</option>
            {activeProducts
              .filter((p) => !lines.some((l) => l.productId === p.id))
              .map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.productCode})</option>
              ))}
          </select>
          <button
            onClick={addLine}
            disabled={productPick === ''}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-50 text-brand-600 rounded-lg text-sm font-medium hover:bg-brand-100 disabled:opacity-50"
          >
            <Plus size={16} /> {t('common.add')}
          </button>
        </div>

        {lines.length > 0 && (
          <div className="border border-line rounded-lg overflow-hidden mb-4">
            <table className="w-full text-sm">
              <thead className="bg-surface text-left text-ink-500">
                <tr>
                  <th className="px-3 py-2">{t('products.title')}</th>
                  <th className="px-3 py-2 w-28">{t('purchaseOrders.quantity')}</th>
                  <th className="px-3 py-2 w-32">{t('purchaseOrders.unitCost')}</th>
                  <th className="px-3 py-2 w-28 text-right">{t('purchaseOrders.lineTotal')}</th>
                  <th className="px-3 py-2 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {lines.map((line) => {
                  const product = activeProducts.find((p) => p.id === line.productId);
                  return (
                    <tr key={line.productId}>
                      <td className="px-3 py-2 font-medium">{product?.name ?? '—'}</td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min={1}
                          value={line.quantity}
                          onChange={(e) => updateLine(line.productId, { quantity: Number(e.target.value) })}
                          className="w-full px-2 py-1 border border-ink-500/20 rounded text-sm"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={line.unitCost}
                          onChange={(e) => updateLine(line.productId, { unitCost: Number(e.target.value) })}
                          className="w-full px-2 py-1 border border-ink-500/20 rounded text-sm"
                        />
                      </td>
                      <td className="px-3 py-2 text-right font-medium">Rs. {(line.quantity * line.unitCost).toFixed(2)}</td>
                      <td className="px-3 py-2 text-right">
                        <button onClick={() => removeLine(line.productId)} className="text-red-600 hover:text-red-800">
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-sm text-ink-500">
            {lines.length === 0 ? t('purchaseOrders.noItemsYet') : t('purchaseOrders.itemCount', { count: lines.length })}
          </span>
          <span className="font-bold text-lg">{t('common.total')}: Rs. {total.toFixed(2)}</span>
        </div>

        {error && <p className="text-red-600 text-sm bg-red-50 p-2 rounded mt-3">{error}</p>}

        <button
          onClick={handleReceive}
          disabled={receiveMutation.isPending}
          className="w-full mt-4 flex items-center justify-center gap-2 py-3 bg-brand-600 text-white font-bold rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors"
        >
          <PackageCheck size={18} />
          {receiveMutation.isPending ? t('purchaseOrders.receiving') : t('purchaseOrders.receiveOrder')}
        </button>
      </div>

      {/* History */}
      <h2 className="font-bold text-lg mb-3">{t('purchaseOrders.purchaseHistory')}</h2>
      <div className="bg-white rounded-lg border border-line shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left text-ink-500">
            <tr>
              <th className="px-4 py-3">{t('purchaseOrders.poNumber')}</th>
              <th className="px-4 py-3">{t('purchaseOrders.supplier')}</th>
              <th className="px-4 py-3">{t('purchaseOrders.receivedBy')}</th>
              <th className="px-4 py-3">{t('common.date')}</th>
              <th className="px-4 py-3 text-right">{t('purchaseOrders.totalCost')}</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading && <tr><td colSpan={6} className="px-4 py-6 text-center text-ink-500">{t('common.loading')}</td></tr>}
            {!isLoading && orders.length === 0 && <tr><td colSpan={6} className="px-4 py-6 text-center text-ink-500">{t('purchaseOrders.noOrdersYet')}</td></tr>}
            {orders.map((po) => (
              <>
                <tr
                  key={po.id}
                  onClick={() => setExpandedId((prev) => (prev === po.id ? null : po.id))}
                  className="hover:bg-surface cursor-pointer"
                >
                  <td className="px-4 py-3 font-medium">{po.poNumber}</td>
                  <td className="px-4 py-3">{po.supplierName}</td>
                  <td className="px-4 py-3">{po.receivedByName}</td>
                  <td className="px-4 py-3 text-ink-500">
                    {new Date(po.createdAt).toLocaleString('en-LK', { dateStyle: 'medium', timeStyle: 'short' })}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">Rs. {po.totalCost.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-ink-500">
                    {expandedId === po.id ? <ChevronUp size={16} className="inline" /> : <ChevronDown size={16} className="inline" />}
                  </td>
                </tr>
                {expandedId === po.id && (
                  <tr>
                    <td colSpan={6} className="px-4 py-4 bg-surface">
                      <div className="space-y-2 mb-3">
                        {po.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span>{item.productName} × {item.quantity} @ Rs. {item.unitCost.toFixed(2)}</span>
                            <span>Rs. {item.total.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                      {po.notes && <p className="text-xs text-ink-500 mb-2">{t('common.notes')}: {po.notes}</p>}
                      <div className="border-t border-ink-500/10 pt-2 text-sm font-bold flex justify-between max-w-xs ml-auto">
                        <span>{t('common.total')}</span><span>Rs. {po.totalCost.toFixed(2)}</span>
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