import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Search, Barcode, Scale } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { productService } from '../services/productService';
import ProductFormModal, { type ProductFormValues } from '../features/products/ProductFormModal';
import type { Product } from '../types/product';
import { useAuth } from '../store/AuthContext';

export default function ProductsPage() {
  const { t } = useTranslation();
  const { hasRole } = useAuth();
  const canManage = hasRole('Administrator', 'Manager');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: productService.getAll,
  });

  const createMutation = useMutation({
    mutationFn: productService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      closeModal();
    },
    onError: (err: unknown) => {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setServerError(message || 'Something went wrong.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof productService.update>[1] }) =>
      productService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      closeModal();
    },
    onError: (err: unknown) => {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setServerError(message || 'Something went wrong.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: productService.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });

  const openAddModal = () => {
    setEditingProduct(null);
    setServerError(null);
    setModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setServerError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingProduct(null);
    setServerError(null);
  };

  const handleSubmit = (data: ProductFormValues) => {
    setServerError(null);
    const payload = { ...data, expiryDate: data.expiryDate || null };
    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data: { ...payload, isActive: editingProduct.isActive } });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (product: Product) => {
    if (confirm(t('common.confirmDelete', { name: product.name }))) {
      deleteMutation.mutate(product.id);
    }
  };

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode.includes(search) ||
      p.productCode.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h1 className="text-2xl font-bold text-ink-900">{t('products.title')}</h1>
        <div className="flex items-center gap-2.5">
          <Link
            to="/barcode-generator"
            className="flex items-center gap-2 px-3.5 py-2 bg-surface border border-line text-ink-800 rounded-lg hover:bg-card font-medium transition-colors text-sm shadow-2xs"
          >
            <Barcode size={17} className="text-brand-600" />
            <span>{t('barcode.batchPrintTags', 'Shelf Tags & Barcodes')}</span>
          </Link>
          {canManage && (
            <button
              onClick={openAddModal}
              className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-medium transition-colors text-sm shadow-2xs"
            >
              <Plus size={18} /> {t('products.addProduct')}
            </button>
          )}
        </div>
      </div>

      <div className="relative mb-4">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
        <input
          type="text"
          placeholder={t('products.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-ink-500/20 rounded-lg bg-card"
        />
      </div>

      <div className="bg-card rounded-lg border border-line overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="border-b border-line text-left text-ink-500">
              <th className="px-4 py-3 font-medium">{t('products.tableHeader')}</th>
              <th className="px-4 py-3 font-medium">{t('products.category')}</th>
              <th className="px-4 py-3 font-medium">{t('products.brand')}</th>
              <th className="px-4 py-3 font-medium text-right">{t('products.totalPrice')}</th>
              <th className="px-4 py-3 font-medium text-right">{t('products.stock')}</th>
              <th className="px-4 py-3 font-medium text-right">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {isLoading && Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                {Array.from({ length: 6 }).map((_, j) => (
                  <td key={j} className="px-4 py-3">
                    <div
                      className="h-4 rounded bg-ink-100 animate-pulse"
                      style={{ width: j >= 3 ? '3rem' : '70%', marginLeft: j >= 3 ? 'auto' : 0 }}
                    />
                  </td>
                ))}
              </tr>
            ))}
            {!isLoading && filtered.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-ink-500">{t('common.noResults')}</td></tr>
            )}
            {filtered.map((product) => (
              <tr key={product.id} className="hover:bg-surface">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-surface border border-line flex items-center justify-center overflow-hidden shrink-0">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <span className="font-bold text-ink-500 text-xs">
                          {product.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="font-medium flex items-center gap-1.5">
                        <span>{product.name}</span>
                        {product.isWeighable && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200" title="Weighed produce item">
                            <Scale size={11} />
                            {product.unitOfMeasure || 'kg'}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-ink-500">{product.productCode} · {product.barcode}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">{product.categoryName}</td>
                <td className="px-4 py-3">{product.brandName}</td>
                <td className="px-4 py-3 text-right">
                  Rs. {product.sellingPrice.toFixed(2)}
                  <span className="text-[11px] text-ink-500">/{product.unitOfMeasure || 'pcs'}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className={product.stockQuantity <= product.minimumStockLevel ? 'text-red-600 font-medium' : ''}>
                    {product.isWeighable ? Number(product.stockQuantity).toFixed(3) : product.stockQuantity} {product.unitOfMeasure || 'pcs'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  {canManage && (
                    <>
                      <button
                        onClick={() => openEditModal(product)}
                        className="text-brand-600 hover:text-brand-700"
                        title={t('common.edit')}
                      >
                        <Pencil size={16} className="inline" />
                      </button>
                      <button
                        onClick={() => handleDelete(product)}
                        className="text-red-600 hover:text-red-800"
                        title={t('common.delete')}
                      >
                        <Trash2 size={16} className="inline" />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>

      {modalOpen && (
        <ProductFormModal
          product={editingProduct}
          onClose={closeModal}
          onSubmit={handleSubmit}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
          serverError={serverError}
        />
      )}
    </div>
  );
}
