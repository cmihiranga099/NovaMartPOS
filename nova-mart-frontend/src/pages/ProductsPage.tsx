import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { productService } from '../services/productService';
import ProductFormModal, { type ProductFormValues } from '../features/products/ProductFormModal';
import type { Product } from '../types/product';

export default function ProductsPage() {
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
    mutationFn: ({ id, data }: { id: number; data: ProductFormValues & { isActive: boolean } }) =>
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
    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data: { ...data, isActive: editingProduct.isActive } });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (product: Product) => {
    if (confirm(`Deactivate "${product.name}"?`)) {
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
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Products</h1>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-medium transition-colors"        >
          <Plus size={18} /> Add Product
        </button>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name, code, or barcode..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-3 py-2 border rounded-md"
        />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Brand</th>
              <th className="px-4 py-3 text-right">Price</th>
              <th className="px-4 py-3 text-right">Stock</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400">Loading...</td></tr>
            )}
            {!isLoading && filtered.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400">No products found.</td></tr>
            )}
            {filtered.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-medium">{product.name}</div>
                  <div className="text-xs text-gray-400">{product.productCode} · {product.barcode}</div>
                </td>
                <td className="px-4 py-3">{product.categoryName}</td>
                <td className="px-4 py-3">{product.brandName}</td>
                <td className="px-4 py-3 text-right">Rs. {product.sellingPrice.toFixed(2)}</td>
                <td className="px-4 py-3 text-right">
                  <span className={product.stockQuantity <= product.minimumStockLevel ? 'text-red-600 font-medium' : ''}>
                    {product.stockQuantity}
                  </span>
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button onClick={() => openEditModal(product)} className="text-brand-600 hover:text-brand-700">
                    <Pencil size={16} className="inline" />
                  </button>
                  <button onClick={() => handleDelete(product)} className="text-red-600 hover:text-red-800">
                    <Trash2 size={16} className="inline" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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