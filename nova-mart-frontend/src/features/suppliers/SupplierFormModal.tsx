import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Image as ImageIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const schema = z.object({
  name: z.string().min(1, 'Required'),
  phone: z.string().optional().or(z.literal('')),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  logoUrl: z.string().optional().or(z.literal('')),
});

export type SupplierFormValues = z.infer<typeof schema>;

interface Props {
  title: string;
  initial?: {
    name: string;
    phone: string | null;
    email: string | null;
    address: string | null;
    logoUrl?: string | null;
  } | null;
  onClose: () => void;
  onSubmit: (data: SupplierFormValues) => void;
  isSubmitting: boolean;
  serverError?: string | null;
}

export default function SupplierFormModal({ title, initial, onClose, onSubmit, isSubmitting, serverError }: Props) {
  const { t } = useTranslation();
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<SupplierFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', phone: '', email: '', address: '', logoUrl: '' },
  });

  const [previewError, setPreviewError] = useState(false);
  const watchLogo = watch('logoUrl');

  useEffect(() => {
    setPreviewError(false);
  }, [watchLogo]);

  useEffect(() => {
    if (initial) {
      reset({
        name: initial.name,
        phone: initial.phone ?? '',
        email: initial.email ?? '',
        address: initial.address ?? '',
        logoUrl: initial.logoUrl ?? '',
      });
    }
  }, [initial, reset]);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl shadow-xl w-full max-w-md border border-line overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-line">
          <h2 className="text-lg font-semibold text-ink-900">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-lg text-ink-500 hover:text-ink-900 hover:bg-surface transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          {serverError && <p className="text-red-600 text-sm bg-red-50 dark:bg-red-950/30 p-2.5 rounded-xl border border-red-200 dark:border-red-800">{serverError}</p>}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink-500 mb-1.5">{t('common.name')}</label>
            <input
              {...register('name')}
              placeholder="e.g. Nestlé Lanka PLC"
              className="w-full px-3.5 py-2.5 border border-line rounded-xl text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
              autoFocus
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink-500 mb-1.5">
              {t('suppliers.logoUrl', 'Logo URL (SVG / PNG / Web)')}
            </label>
            <div className="flex items-center gap-3">
              <input
                {...register('logoUrl')}
                placeholder="/suppliers/nestle.svg or https://..."
                className="flex-1 px-3.5 py-2.5 border border-line rounded-xl text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all font-mono text-xs"
              />
              <div className="w-11 h-11 shrink-0 rounded-xl border border-line bg-card p-1.5 flex items-center justify-center overflow-hidden shadow-sm">
                {watchLogo && !previewError ? (
                  <img
                    src={watchLogo}
                    alt="Logo Preview"
                    className="w-full h-full object-contain"
                    onError={() => setPreviewError(true)}
                  />
                ) : (
                  <ImageIcon size={18} className="text-ink-500 opacity-40" />
                )}
              </div>
            </div>
            <p className="text-[11px] text-ink-500 mt-1">
              Relative path in <code className="px-1 py-0.5 rounded bg-surface border border-line font-mono">/suppliers/brand.svg</code> or external web URL.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-500 mb-1.5">{t('common.phone')}</label>
              <input
                {...register('phone')}
                placeholder="011-2699991"
                className="w-full px-3.5 py-2.5 border border-line rounded-xl text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-500 mb-1.5">{t('common.email')}</label>
              <input
                {...register('email')}
                type="email"
                placeholder="info@supplier.lk"
                className="w-full px-3.5 py-2.5 border border-line rounded-xl text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink-500 mb-1.5">{t('common.address')}</label>
            <textarea
              {...register('address')}
              rows={2}
              placeholder="Head office / distribution facility address"
              className="w-full px-3.5 py-2 border border-line rounded-xl text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all resize-none"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-line">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-ink-700 hover:bg-surface rounded-xl font-medium transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm bg-brand-600 text-white rounded-xl hover:bg-brand-700 disabled:opacity-50 font-medium shadow-sm shadow-brand-600/20 transition-all"
            >
              {isSubmitting ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
