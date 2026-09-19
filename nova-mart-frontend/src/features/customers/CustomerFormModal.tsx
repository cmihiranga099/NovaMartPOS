import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Customer } from '../../types/customer';

const schema = z.object({
  name: z.string().min(1, 'Required'),
  phone: z.string().optional().or(z.literal('')),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
});

export type CustomerFormValues = z.infer<typeof schema>;

interface Props {
  customer?: Customer | null;
  onClose: () => void;
  onSubmit: (data: CustomerFormValues) => void;
  isSubmitting: boolean;
  serverError?: string | null;
}

export default function CustomerFormModal({ customer, onClose, onSubmit, isSubmitting, serverError }: Props) {
  const { t } = useTranslation();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CustomerFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', phone: '', email: '' },
  });

  useEffect(() => {
    if (customer) {
      reset({
        name: customer.name,
        phone: customer.phone ?? '',
        email: customer.email ?? '',
      });
    }
  }, [customer, reset]);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">{customer ? t('customers.editCustomer') : t('customers.addCustomer')}</h2>
          <button onClick={onClose} className="text-ink-500 hover:text-ink-900">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-3">
          {serverError && <p className="text-red-600 text-sm bg-red-50 p-2 rounded">{serverError}</p>}

          <div>
            <label className="block text-sm font-medium mb-1">{t('common.name')}</label>
            <input {...register('name')} className="w-full px-3 py-2 border border-ink-500/20 rounded-lg" autoFocus />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('common.phone')}</label>
            <input {...register('phone')} className="w-full px-3 py-2 border border-ink-500/20 rounded-lg" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('common.email')}</label>
            <input {...register('email')} className="w-full px-3 py-2 border border-ink-500/20 rounded-lg" />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
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