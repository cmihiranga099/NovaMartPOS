import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { lookupService } from '../../services/lookupService';
import type { Product } from '../../types/product';

const schema = z.object({
  productCode: z.string().min(1, 'Required'),
  barcode: z.string().min(1, 'Required'),
  name: z.string().min(1, 'Required'),
  purchasePrice: z.coerce.number().min(0, 'Cannot be negative'),
  sellingPrice: z.coerce.number().min(0, 'Cannot be negative'),
  taxRate: z.coerce.number().min(0, 'Cannot be negative'),
  stockQuantity: z.coerce.number().int().min(0, 'Cannot be negative'),
  minimumStockLevel: z.coerce.number().int().min(0, 'Cannot be negative'),
  categoryId: z.coerce.number().min(1, 'Select a category'),
  brandId: z.coerce.number().min(1, 'Select a brand'),
});

export type ProductFormValues = z.infer<typeof schema>;

interface Props {
  product?: Product | null;
  onClose: () => void;
  onSubmit: (data: ProductFormValues) => void;
  isSubmitting: boolean;
  serverError?: string | null;
}

export default function ProductFormModal({ product, onClose, onSubmit, isSubmitting, serverError }: Props) {
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: lookupService.getCategories });
  const { data: brands = [] } = useQuery({ queryKey: ['brands'], queryFn: lookupService.getBrands });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<z.input<typeof schema>, unknown, z.output<typeof schema>>({    resolver: zodResolver(schema),
    defaultValues: {
      productCode: '',
      barcode: '',
      name: '',
      purchasePrice: 0,
      sellingPrice: 0,
      taxRate: 0,
      stockQuantity: 0,
      minimumStockLevel: 0,
      categoryId: 0,
      brandId: 0,
    },
  });

  useEffect(() => {
    if (product) {
      reset({
        productCode: product.productCode,
        barcode: product.barcode,
        name: product.name,
        purchasePrice: product.purchasePrice,
        sellingPrice: product.sellingPrice,
        taxRate: product.taxRate,
        stockQuantity: product.stockQuantity,
        minimumStockLevel: product.minimumStockLevel,
        categoryId: product.categoryId,
        brandId: product.brandId,
      });
    }
  }, [product, reset]);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">{product ? 'Edit Product' : 'Add Product'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-3">
          {serverError && <p className="text-red-600 text-sm bg-red-50 p-2 rounded">{serverError}</p>}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Product Code</label>
              <input {...register('productCode')} className="w-full px-3 py-2 border rounded-md" />
              {errors.productCode && <p className="text-red-500 text-xs mt-1">{errors.productCode.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Barcode</label>
              <input {...register('barcode')} className="w-full px-3 py-2 border rounded-md" />
              {errors.barcode && <p className="text-red-500 text-xs mt-1">{errors.barcode.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input {...register('name')} className="w-full px-3 py-2 border rounded-md" />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select {...register('categoryId')} className="w-full px-3 py-2 border rounded-md">
                <option value={0}>Select...</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {errors.categoryId && <p className="text-red-500 text-xs mt-1">{errors.categoryId.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Brand</label>
              <select {...register('brandId')} className="w-full px-3 py-2 border rounded-md">
                <option value={0}>Select...</option>
                {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              {errors.brandId && <p className="text-red-500 text-xs mt-1">{errors.brandId.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Purchase Price</label>
              <input type="number" step="0.01" {...register('purchasePrice')} className="w-full px-3 py-2 border rounded-md" />
              {errors.purchasePrice && <p className="text-red-500 text-xs mt-1">{errors.purchasePrice.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Selling Price</label>
              <input type="number" step="0.01" {...register('sellingPrice')} className="w-full px-3 py-2 border rounded-md" />
              {errors.sellingPrice && <p className="text-red-500 text-xs mt-1">{errors.sellingPrice.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Tax Rate (%)</label>
              <input type="number" step="0.01" {...register('taxRate')} className="w-full px-3 py-2 border rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Stock Qty</label>
              <input type="number" {...register('stockQuantity')} className="w-full px-3 py-2 border rounded-md" />
              {errors.stockQuantity && <p className="text-red-500 text-xs mt-1">{errors.stockQuantity.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Min Stock</label>
              <input type="number" {...register('minimumStockLevel')} className="w-full px-3 py-2 border rounded-md" />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}