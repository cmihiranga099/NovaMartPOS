import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import type { Promotion } from '../../types/promotion';

const schema = z.object({
  code: z.string().min(1, 'Required').toUpperCase(),
  description: z.string().optional().or(z.literal('')),
  type: z.enum(['Percentage', 'FixedAmount']),
  value: z.coerce.number().min(0, 'Cannot be negative'),
  minPurchaseAmount: z.coerce.number().min(0, 'Cannot be negative'),
  maxDiscountAmount: z.coerce.number().min(0).optional().or(z.literal('')),
  expiresAt: z.string().optional().or(z.literal('')),
});

export type PromotionFormValues = z.infer<typeof schema>;

interface Props {
  promotion?: Promotion | null;
  onClose: () => void;
  onSubmit: (data: PromotionFormValues) => void;
  isSubmitting: boolean;
  serverError?: string | null;
}

export default function PromotionFormModal({ promotion, onClose, onSubmit, isSubmitting, serverError }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<z.input<typeof schema>, unknown, z.output<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      code: '',
      description: '',
      type: 'Percentage',
      value: 0,
      minPurchaseAmount: 0,
      maxDiscountAmount: '',
      expiresAt: '',
    },
  });

  useEffect(() => {
    if (promotion) {
      reset({
        code: promotion.code,
        description: promotion.description ?? '',
        type: promotion.type,
        value: promotion.value,
        minPurchaseAmount: promotion.minPurchaseAmount,
        maxDiscountAmount: promotion.maxDiscountAmount ?? '',
        expiresAt: promotion.expiresAt ? promotion.expiresAt.slice(0, 10) : '',
      });
    }
  }, [promotion, reset]);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">{promotion ? 'Edit Promotion' : 'Add Promotion'}</h2>
          <button onClick={onClose} className="text-ink-500 hover:text-ink-900">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-3">
          {serverError && <p className="text-red-600 text-sm bg-red-50 p-2 rounded">{serverError}</p>}

          <div>
            <label className="block text-sm font-medium mb-1">Promo Code</label>
            <input {...register('code')} className="w-full px-3 py-2 border border-ink-500/20 rounded-lg uppercase" autoFocus />
            {errors.code && <p className="text-red-500 text-xs mt-1">{errors.code.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <input {...register('description')} className="w-full px-3 py-2 border border-ink-500/20 rounded-lg" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select {...register('type')} className="w-full px-3 py-2 border border-ink-500/20 rounded-lg">
                <option value="Percentage">Percentage (%)</option>
                <option value="FixedAmount">Fixed Amount (Rs.)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Value</label>
              <input type="number" step="0.01" {...register('value')} className="w-full px-3 py-2 border border-ink-500/20 rounded-lg" />
              {errors.value && <p className="text-red-500 text-xs mt-1">{errors.value.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Min Purchase (Rs.)</label>
              <input type="number" step="0.01" {...register('minPurchaseAmount')} className="w-full px-3 py-2 border border-ink-500/20 rounded-lg" />
              {errors.minPurchaseAmount && <p className="text-red-500 text-xs mt-1">{errors.minPurchaseAmount.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Max Discount (Rs.)</label>
              <input type="number" step="0.01" {...register('maxDiscountAmount')} placeholder="No limit" className="w-full px-3 py-2 border border-ink-500/20 rounded-lg" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Expires On</label>
            <input type="date" {...register('expiresAt')} className="w-full px-3 py-2 border border-ink-500/20 rounded-lg" />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-ink-700 hover:bg-surface rounded-lg">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 font-medium"
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}