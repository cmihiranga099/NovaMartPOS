import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Tag } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { promotionService } from '../services/promotionService';
import PromotionFormModal, { type PromotionFormValues } from '../features/promotions/PromotionFormModal';
import type { Promotion } from '../types/promotion';
import { useAuth } from '../store/AuthContext';

export default function PromotionsPage() {
  const { t } = useTranslation();
  const { hasRole } = useAuth();
  const canManage = hasRole('Administrator', 'Manager');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Promotion | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: promotions = [], isLoading } = useQuery({ queryKey: ['promotions'], queryFn: promotionService.getAll });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['promotions'] });

  const createMutation = useMutation({
    mutationFn: promotionService.create,
    onSuccess: () => { invalidate(); closeModal(); },
    onError: (err: unknown) => setServerError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed.'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: PromotionFormValues & { isActive: boolean } }) =>
      promotionService.update(id, {
        ...data,
        maxDiscountAmount: data.maxDiscountAmount === '' ? null : Number(data.maxDiscountAmount),
        expiresAt: data.expiresAt || null,
      }),
    onSuccess: () => { invalidate(); closeModal(); },
    onError: (err: unknown) => setServerError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed.'),
  });

  const deleteMutation = useMutation({
    mutationFn: promotionService.delete,
    onSuccess: invalidate,
    onError: (err: unknown) => alert((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Could not delete.'),
  });

  const openAdd = () => { setEditing(null); setServerError(null); setModalOpen(true); };
  const openEdit = (p: Promotion) => { setEditing(p); setServerError(null); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditing(null); setServerError(null); };

  const handleSubmit = (data: PromotionFormValues) => {
    setServerError(null);
    const payload = {
      ...data,
      maxDiscountAmount: data.maxDiscountAmount === '' ? null : Number(data.maxDiscountAmount),
      expiresAt: data.expiresAt || null,
    };
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: { ...data, isActive: editing.isActive } });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isExpired = (p: Promotion) => p.expiresAt && new Date(p.expiresAt) < new Date();

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">{t('promotions.title')}</h1>
        {canManage && (
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-medium">
            <Plus size={18} /> {t('promotions.addPromotion')}
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left text-ink-500">
            <tr>
              <th className="px-4 py-3">{t('promotions.code')}</th>
              <th className="px-4 py-3">{t('common.discount')}</th>
              <th className="px-4 py-3">Min Purchase</th>
              <th className="px-4 py-3">{t('promotions.expiresAt')}</th>
              <th className="px-4 py-3">{t('common.status')}</th>
              <th className="px-4 py-3 text-right">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading && <tr><td colSpan={6} className="px-4 py-6 text-center text-ink-500">{t('common.loading')}</td></tr>}
            {!isLoading && promotions.length === 0 && <tr><td colSpan={6} className="px-4 py-6 text-center text-ink-500">{t('common.noResults')}</td></tr>}
            {promotions.map((p) => (
              <tr key={p.id} className="hover:bg-surface">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 font-medium">
                    <Tag size={14} className="text-brand-600" /> {p.code}
                  </div>
                  {p.description && <div className="text-xs text-ink-500">{p.description}</div>}
                </td>
                <td className="px-4 py-3">
                  {p.type === 'Percentage' ? `${p.value}%` : `Rs. ${p.value.toFixed(2)}`}
                  {p.maxDiscountAmount && <span className="text-xs text-ink-500"> (max Rs. {p.maxDiscountAmount.toFixed(2)})</span>}
                </td>
                <td className="px-4 py-3">Rs. {p.minPurchaseAmount.toFixed(2)}</td>
                <td className="px-4 py-3 text-ink-500">
                  {p.expiresAt ? new Date(p.expiresAt).toLocaleDateString('en-LK') : 'Never'}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      !p.isActive
                        ? 'bg-ink-500/10 text-ink-500'
                        : isExpired(p)
                        ? 'bg-red-50 text-red-600'
                        : 'bg-brand-50 text-brand-600'
                    }`}
                  >
                    {!p.isActive ? t('common.inactive') : isExpired(p) ? 'Expired' : t('common.active')}
                  </span>
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  {canManage && (
                    <>
                      <button onClick={() => openEdit(p)} className="text-brand-600 hover:text-brand-700"><Pencil size={16} className="inline" /></button>
                      <button onClick={() => { if (confirm(t('common.confirmDelete', { name: p.code }))) deleteMutation.mutate(p.id); }} className="text-red-600 hover:text-red-800"><Trash2 size={16} className="inline" /></button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <PromotionFormModal
          promotion={editing}
          onClose={closeModal}
          onSubmit={handleSubmit}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
          serverError={serverError}
        />
      )}
    </div>
  );
}