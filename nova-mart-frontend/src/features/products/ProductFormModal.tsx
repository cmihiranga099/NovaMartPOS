import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { Scale, X, Image as ImageIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { lookupService } from '../../services/lookupService';
import type { Product } from '../../types/product';

const schema = z.object({
  productCode: z.string().min(1, 'Required'),
  barcode: z.string().min(1, 'Required'),
  name: z.string().min(1, 'Required'),
  imageUrl: z.string().optional().or(z.literal('')),
  purchasePrice: z.coerce.number().min(0, 'Cannot be negative'),
  sellingPrice: z.coerce.number().min(0, 'Cannot be negative'),
  taxRate: z.coerce.number().min(0, 'Cannot be negative'),
  stockQuantity: z.coerce.number().min(0, 'Cannot be negative'),
  minimumStockLevel: z.coerce.number().min(0, 'Cannot be negative'),
  isWeighable: z.boolean().default(false),
  unitOfMeasure: z.string().default('pcs'),
  categoryId: z.coerce.number().min(1, 'Select a category'),
  brandId: z.coerce.number().min(1, 'Select a brand'),
  expiryDate: z.string().optional().or(z.literal('')),
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
  const { t } = useTranslation();
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: lookupService.getCategories });
  const { data: brands = [] } = useQuery({ queryKey: ['brands'], queryFn: lookupService.getBrands });

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<z.input<typeof schema>, unknown, z.output<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      productCode: '',
      barcode: '',
      name: '',
      imageUrl: '',
      purchasePrice: 0,
      sellingPrice: 0,
      taxRate: 0,
      stockQuantity: 0,
      minimumStockLevel: 0,
      isWeighable: false,
      unitOfMeasure: 'pcs',
      categoryId: 0,
      brandId: 0,
      expiryDate: '',
    },
  });

  const isWeighable = watch('isWeighable');
  const imageUrlValue = watch('imageUrl');

  useEffect(() => {
    if (product) {
      reset({
        productCode: product.productCode,
        barcode: product.barcode,
        name: product.name,
        imageUrl: product.imageUrl || '',
        purchasePrice: product.purchasePrice,
        sellingPrice: product.sellingPrice,
        taxRate: product.taxRate,
        stockQuantity: product.stockQuantity,
        minimumStockLevel: product.minimumStockLevel,
        isWeighable: product.isWeighable ?? false,
        unitOfMeasure: product.unitOfMeasure || (product.isWeighable ? 'kg' : 'pcs'),
        categoryId: product.categoryId,
        brandId: product.brandId,
        expiryDate: product.expiryDate ? product.expiryDate.slice(0, 10) : '',
      });
    }
  }, [product, reset]);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">{product ? t('products.editProduct') : t('products.addProduct')}</h2>
          <button onClick={onClose} className="text-ink-500 hover:text-ink-900">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-3">
          {serverError && <p className="text-red-600 text-sm bg-red-50 p-2 rounded">{serverError}</p>}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">{t('products.productCode')}</label>
              <input {...register('productCode')} className="w-full px-3 py-2 border border-ink-500/20 rounded-lg" />
              {errors.productCode && <p className="text-red-500 text-xs mt-1">{errors.productCode.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('products.barcode')}</label>
              <input
                {...register('barcode')}
                onFocus={(e) => e.target.select()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    (e.currentTarget.form?.elements.namedItem('name') as HTMLInputElement | null)?.focus();
                  }
                }}
                className="w-full px-3 py-2 border border-ink-500/20 rounded-lg"
              />
              {errors.barcode && <p className="text-red-500 text-xs mt-1">{errors.barcode.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('common.name')}</label>
            <input {...register('name')} className="w-full px-3 py-2 border border-ink-500/20 rounded-lg" />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {t('products.imageUrl', 'Product Image URL')}
            </label>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg border border-line bg-surface overflow-hidden flex items-center justify-center shrink-0">
                {imageUrlValue ? (
                  <img
                    src={imageUrlValue}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <ImageIcon size={18} className="text-ink-400" />
                )}
              </div>
              <input
                {...register('imageUrl')}
                placeholder="https://images.unsplash.com/photo-..."
                className="flex-1 px-3 py-2 border border-ink-500/20 rounded-lg text-sm"
              />
            </div>
            {errors.imageUrl && <p className="text-red-500 text-xs mt-1">{errors.imageUrl.message}</p>}
          </div>

          {/* Weighed Produce / Bulk Goods Setting */}
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm font-medium text-emerald-300 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('isWeighable')}
                  onChange={(e) => {
                    setValue('isWeighable', e.target.checked);
                    if (e.target.checked && watch('unitOfMeasure') === 'pcs') {
                      setValue('unitOfMeasure', 'kg');
                    }
                  }}
                  className="rounded text-brand-600 focus:ring-brand-500 h-4 w-4"
                />
                <Scale size={16} className="text-emerald-400" />
                <span>{t('products.isWeighable', 'Weighed Goods (Sold by weight on scale)')}</span>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-medium text-emerald-300 mb-1">
                  {t('products.unitOfMeasure', 'Unit of Measure')}
                </label>
                <select
                  {...register('unitOfMeasure')}
                  className="w-full px-2.5 py-1.5 text-sm bg-card text-ink-900 border border-emerald-500/30 rounded-md focus:ring-emerald-500"
                >
                  <option value="pcs">Pieces (pcs)</option>
                  <option value="kg">Kilogram (kg)</option>
                  <option value="g">Gram (g)</option>
                  <option value="pack">Pack (pk)</option>
                  <option value="l">Liter (L)</option>
                  <option value="ml">Milliliter (ml)</option>
                </select>
              </div>
              <div className="text-xs text-emerald-400/90 flex items-center leading-relaxed">
                {isWeighable
                  ? 'Cashier will be prompted with the scale weight modal or scale barcode parser.'
                  : 'Sold as standard single integer quantity.'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">{t('products.category')}</label>
              <select {...register('categoryId')} className="w-full px-3 py-2 border border-ink-500/20 rounded-lg">
                <option value={0}>{t('common.search')}...</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {errors.categoryId && <p className="text-red-500 text-xs mt-1">{errors.categoryId.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('products.brand')}</label>
              <select {...register('brandId')} className="w-full px-3 py-2 border border-ink-500/20 rounded-lg">
                <option value={0}>{t('common.search')}...</option>
                {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              {errors.brandId && <p className="text-red-500 text-xs mt-1">{errors.brandId.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">{t('products.purchasePrice')}</label>
              <input type="number" step="0.01" {...register('purchasePrice')} className="w-full px-3 py-2 border border-ink-500/20 rounded-lg" />
              {errors.purchasePrice && <p className="text-red-500 text-xs mt-1">{errors.purchasePrice.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('products.sellingPrice')}</label>
              <input type="number" step="0.01" {...register('sellingPrice')} className="w-full px-3 py-2 border border-ink-500/20 rounded-lg" />
              {errors.sellingPrice && <p className="text-red-500 text-xs mt-1">{errors.sellingPrice.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Tax Rate (%)</label>
              <input type="number" step="0.01" {...register('taxRate')} className="w-full px-3 py-2 border border-ink-500/20 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('products.stockQuantity')}</label>
              <input
                type="number"
                step="0.001"
                {...register('stockQuantity')}
                className="w-full px-3 py-2 border border-ink-500/20 rounded-lg"
              />
              {errors.stockQuantity && <p className="text-red-500 text-xs mt-1">{errors.stockQuantity.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Min Stock</label>
              <input
                type="number"
                step="0.001"
                {...register('minimumStockLevel')}
                className="w-full px-3 py-2 border border-ink-500/20 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('products.expiryDate')}</label>
            <input type="date" {...register('expiryDate')} className="w-full px-3 py-2 border border-ink-500/20 rounded-lg" />
            <p className="text-xs text-ink-500 mt-1">{t('products.expiryDateHint')}</p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-ink-700 hover:bg-surface rounded-lg">
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-medium transition-colors disabled:opacity-50"
            >
              {isSubmitting ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
