import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { lookupService } from '../services/lookupService';
import LookupFormModal, { type LookupFormValues } from '../features/lookup/LookupFormModal';
import type { Brand } from '../types/lookup';
import { useAuth } from '../store/AuthContext';

export default function BrandsPage() {
  const { t } = useTranslation();
  const { hasRole } = useAuth();
  const canManage = hasRole('Administrator', 'Manager');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Brand | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: brands = [], isLoading } = useQuery({ queryKey: ['brands'], queryFn: lookupService.getBrands });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['brands'] });

  const createMutation = useMutation({
    mutationFn: lookupService.createBrand,
    onSuccess: () => { invalidate(); closeModal(); },
    onError: (err: unknown) => setServerError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed.'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: LookupFormValues & { isActive: boolean } }) =>
      lookupService.updateBrand(id, data),
    onSuccess: () => { invalidate(); closeModal(); },
    onError: (err: unknown) => setServerError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed.'),
  });

  const deleteMutation = useMutation({
    mutationFn: lookupService.deleteBrand,
    onSuccess: invalidate,
    onError: (err: unknown) => alert((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Could not delete.'),
  });

  const openAdd = () => { setEditing(null); setServerError(null); setModalOpen(true); };
  const openEdit = (b: Brand) => { setEditing(b); setServerError(null); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditing(null); setServerError(null); };

  const handleSubmit = (data: LookupFormValues) => {
    setServerError(null);
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: { ...data, isActive: editing.isActive } });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">{t('brands.title')}</h1>
        {canManage && (
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-medium">
          <Plus size={18} /> {t('brands.addBrand')}
        </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left text-ink-500">
            <tr>
              <th className="px-4 py-3">{t('common.name')}</th>
              <th className="px-4 py-3">{t('common.description')}</th>
              <th className="px-4 py-3 text-right">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading && <tr><td colSpan={3} className="px-4 py-6 text-center text-ink-500">{t('common.loading')}</td></tr>}
            {!isLoading && brands.length === 0 && <tr><td colSpan={3} className="px-4 py-6 text-center text-ink-500">{t('common.noResults')}</td></tr>}
            {brands.map((b) => (
              <tr key={b.id} className="hover:bg-surface">
                <td className="px-4 py-3 font-medium">{b.name}</td>
                <td className="px-4 py-3 text-ink-500">{b.description || '—'}</td>
                <td className="px-4 py-3 text-right space-x-2">
                  {canManage && (
                  <>
                  <button onClick={() => openEdit(b)} className="text-brand-600 hover:text-brand-700"><Pencil size={16} className="inline" /></button>
                  <button onClick={() => { if (confirm(t('common.confirmDelete', { name: b.name }))) deleteMutation.mutate(b.id); }} className="text-red-600 hover:text-red-800"><Trash2 size={16} className="inline" /></button>
                  </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <LookupFormModal
          title={editing ? t('brands.editBrand') : t('brands.addBrand')}
          initial={editing}
          onClose={closeModal}
          onSubmit={handleSubmit}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
          serverError={serverError}
        />
      )}
    </div>
  );
}