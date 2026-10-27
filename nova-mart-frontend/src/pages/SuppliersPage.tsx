import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Search, Truck, Phone, Mail, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supplierService } from '../services/supplierService';
import SupplierFormModal, { type SupplierFormValues } from '../features/suppliers/SupplierFormModal';
import type { Supplier, UpdateSupplierRequest } from '../types/supplier';

const AVATAR_PALETTE = [
  'bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400',
  'bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400',
  'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400',
  'bg-violet-100 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400',
  'bg-pink-100 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400',
  'bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400',
];

const avatarColor = (name: string) => {
  const idx = name.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % AVATAR_PALETTE.length;
  return AVATAR_PALETTE[idx];
};

function SupplierLogo({ name, logoUrl }: { name: string; logoUrl?: string | null }) {
  const [hasError, setHasError] = useState(false);

  if (logoUrl && !hasError) {
    return (
      <div className="w-13 h-13 shrink-0 rounded-2xl border border-line bg-white p-2 flex items-center justify-center overflow-hidden shadow-xs">
        <img
          src={logoUrl}
          alt={name}
          className="w-full h-full object-contain"
          onError={() => setHasError(true)}
        />
      </div>
    );
  }

  return (
    <div className={`w-13 h-13 shrink-0 rounded-2xl flex items-center justify-center font-bold text-lg shadow-xs ${avatarColor(name)}`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

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
    const payload = {
      name: data.name,
      phone: data.phone || null,
      email: data.email || null,
      address: data.address || null,
      logoUrl: data.logoUrl || null,
    };
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
      (s.phone ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (s.address ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-1">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">{t('suppliers.title')}</h1>
          <p className="text-sm text-ink-500 mt-0.5">{t('suppliers.subtitle')}</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white rounded-xl hover:bg-brand-700 font-medium shadow-sm shadow-brand-600/20 transition-all self-start sm:self-auto"
        >
          <Plus size={18} /> {t('suppliers.addSupplier')}
        </button>
      </div>

      <div className="relative mt-5 mb-5 max-w-sm">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-500" />
        <input
          type="text"
          placeholder={t('suppliers.searchPlaceholder', 'Search by name, phone, email, city...')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-3.5 py-2.5 border border-line rounded-xl text-sm bg-card focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
        />
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-card border border-line animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 bg-card rounded-2xl border border-dashed border-line text-center">
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
              className="group relative bg-card rounded-2xl border border-line p-4.5 hover:shadow-md hover:border-brand-300 dark:hover:border-brand-600 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start gap-3.5">
                  <SupplierLogo name={s.name} logoUrl={s.logoUrl} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-ink-900 truncate text-[15px]">{s.name}</p>
                      {!s.isActive && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400 shrink-0">
                          {t('common.inactive')}
                        </span>
                      )}
                    </div>
                    <div className="mt-1.5 space-y-1">
                      {s.phone && (
                        <p className="text-xs text-ink-600 dark:text-ink-400 flex items-center gap-1.5 truncate">
                          <Phone size={12} className="text-brand-500 shrink-0" />
                          <span>{s.phone}</span>
                        </p>
                      )}
                      {s.email && (
                        <p className="text-xs text-ink-600 dark:text-ink-400 flex items-center gap-1.5 truncate">
                          <Mail size={12} className="text-brand-500 shrink-0" />
                          <span className="truncate">{s.email}</span>
                        </p>
                      )}
                      {s.address && (
                        <p className="text-xs text-ink-500 flex items-center gap-1.5 truncate">
                          <MapPin size={12} className="text-ink-400 shrink-0" />
                          <span className="truncate">{s.address}</span>
                        </p>
                      )}
                      {!s.phone && !s.email && !s.address && (
                        <p className="text-xs text-ink-400 italic">{t('suppliers.noContactInfo')}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-1.5 mt-3 pt-3 border-t border-line/70 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => openEdit(s)}
                  className="p-1.5 rounded-xl text-ink-500 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/40 transition-colors"
                  title={t('common.edit')}
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => { if (confirm(t('common.confirmDelete', { name: s.name }))) deleteMutation.mutate(s.id); }}
                  className="p-1.5 rounded-xl text-ink-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
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
