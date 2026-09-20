import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Search, Truck, Phone, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supplierService } from '../services/supplierService';
import SupplierFormModal, { type SupplierFormValues } from '../features/suppliers/SupplierFormModal';
import type { Supplier, UpdateSupplierRequest } from '../types/supplier';

const AVATAR_PALETTE = [
  'bg-orange-100 text-orange-600',
  'bg-blue-100 text-blue-600',
  'bg-emerald-100 text-emerald-600',
  'bg-violet-100 text-violet-600',
  'bg-pink-100 text-pink-600',
  'bg-amber-100 text-amber-600',
];

const avatarColor = (name: string) => {
  const idx = name.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % AVATAR_PALETTE.length;
  return AVATAR_PALETTE[idx];
};

export default function SuppliersPage() {
  const { t } = useTranslation();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data: suppliers = [], isLoading } = useQuery({ queryKey: ['suppliers'], queryFn: supplierService.getAll });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['suppliers'] });

  const createMutation = useMutation({
    mutationFn: supplierService.create,
    onSuccess: () => { invalidate(); closeModal(); },
    onError: (err: unknown) => setServerError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed.'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateSupplierRequest }) =>
      supplierService.update(id, data),
    onSuccess: () => { invalidate(); closeModal(); },
    onError: (err: unknown) => setServerError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed.'),
  });

  const deleteMutation = useMutation({
    mutationFn: supplierService.delete,
    onSuccess: invalidate,
    onError: (err: unknown) => alert((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Could not delete.'),
  });

  const openAdd = () => { setEditing(null); setServerError(null); setModalOpen(true); };
  const openEdit = (s: Supplier) => { setEditing(s); setServerError(null); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditing(null); setServerError(null); };

  const handleSubmit = (data: SupplierFormValues) => {
    setServerError(null);
    const payload = { name: data.name, phone: data.phone || null, email: data.email || null, address: data.address || null };
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: { ...payload, isActive: editing.isActive } });
    } else {
      createMutation.mutate(payload);
    }
  };

  const filtered = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.email ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (s.phone ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">{t('suppliers.title')}</h1>
          <p className="text-sm text-ink-500 mt-0.5">{t('suppliers.subtitle')}</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white rounded-xl hover:bg-brand-700 font-medium shadow-sm shadow-brand-600/20 transition-colors"
        >
          <Plus size={18} /> {t('suppliers.addSupplier')}
        </button>
      </div>

      <div className="relative mt-5 mb-5 max-w-xs">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
        <input
          type="text"
          placeholder={t('suppliers.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 border border-line rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-white border border-line animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-line text-center">
          <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center mb-3">
            <Truck size={22} className="text-ink-500" />
          </div>
          <p className="font-medium text-ink-900">{t('suppliers.noneFound')}</p>
          <p className="text-sm text-ink-500 mt-1">
            {search ? t('common.tryDifferentSearch') : t('suppliers.getStarted')}
          </p>
        </div>
      )}

      {!isLoading && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((s) => (
            <div
              key={s.id}
              className="group relative bg-white rounded-2xl border border-line p-4 hover:shadow-md hover:border-brand-200 transition-all"
            >
              <div className="flex items-start gap-3">
                <div className={`w-11 h-11 shrink-0 rounded-xl flex items-center justify-center font-bold text-lg ${avatarColor(s.name)}`}>
                  {s.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-ink-900 truncate">{s.name}</p>
                    {!s.isActive && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 shrink-0">
                        {t('common.inactive')}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 space-y-0.5">
                    {s.phone && (
                      <p className="text-xs text-ink-500 flex items-center gap-1.5"><Phone size={11} /> {s.phone}</p>
                    )}
                    {s.email && (
                      <p className="text-xs text-ink-500 flex items-center gap-1.5"><Mail size={11} /> {s.email}</p>
                    )}
                    {!s.phone && !s.email && <p className="text-xs text-ink-500">{t('suppliers.noContactInfo')}</p>}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-1 mt-3 pt-3 border-t border-line opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => openEdit(s)}
                  className="p-1.5 rounded-lg text-ink-500 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                  title={t('common.edit')}
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => { if (confirm(t('common.confirmDelete', { name: s.name }))) deleteMutation.mutate(s.id); }}
                  className="p-1.5 rounded-lg text-ink-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title={t('common.delete')}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <SupplierFormModal
          title={editing ? t('suppliers.editSupplier') : t('suppliers.addSupplier')}
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