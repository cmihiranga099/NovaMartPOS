import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const schema = z.object({
  name: z.string().min(1, 'Required'),
  phone: z.string().optional().or(z.literal('')),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
});

export type SupplierFormValues = z.infer<typeof schema>;

interface Props {
  title: string;
  initial?: { name: string; phone: string | null; email: string | null; address: string | null } | null;
  onClose: () => void;
  onSubmit: (data: SupplierFormValues) => void;
  isSubmitting: boolean;
  serverError?: string | null;
}

export default function SupplierFormModal({ title, initial, onClose, onSubmit, isSubmitting, serverError }: Props) {
  const { t } = useTranslation();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<SupplierFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', phone: '', email: '', address: '' },
  });

  useEffect(() => {
    if (initial) {
      reset({
        name: initial.name,
        phone: initial.phone ?? '',
        email: initial.email ?? '',
        address: initial.address ?? '',
      });
    }
  }, [initial, reset]);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-lg w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">{title}</h2>
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">{t('common.phone')}</label>
              <input {...register('phone')} className="w-full px-3 py-2 border border-ink-500/20 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('common.email')}</label>
              <input {...register('email')} type="email" className="w-full px-3 py-2 border border-ink-500/20 rounded-lg" />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('common.address')}</label>
            <textarea {...register('address')} rows={2} className="w-full px-3 py-2 border border-ink-500/20 rounded-lg" />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-ink-700 hover:bg-surface rounded-lg">
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 font-medium"
            >
              {isSubmitting ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}