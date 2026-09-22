import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { customerService } from '../services/customerService';
import CustomerFormModal, { type CustomerFormValues } from '../features/customers/CustomerFormModal';
import type { Customer } from '../types/customer';
import { useAuth } from '../store/AuthContext';

export default function CustomersPage() {
  const { t } = useTranslation();
  const { hasRole } = useAuth();
  const canManage = hasRole('Administrator', 'Manager');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: customerService.getAll,
  });

  const createMutation = useMutation({
    mutationFn: customerService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      closeModal();
    },
    onError: (err: unknown) => {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setServerError(message || 'Something went wrong.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CustomerFormValues & { isActive: boolean } }) =>
      customerService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      closeModal();
    },
    onError: (err: unknown) => {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setServerError(message || 'Something went wrong.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: customerService.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customers'] }),
    onError: (err: unknown) => {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      alert(message || 'Could not delete customer.');
    },
  });

  const openAddModal = () => {
    setEditingCustomer(null);
    setServerError(null);
    setModalOpen(true);
  };

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setServerError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingCustomer(null);
    setServerError(null);
  };

  const handleSubmit = (data: CustomerFormValues) => {
    setServerError(null);
    if (editingCustomer) {
      updateMutation.mutate({ id: editingCustomer.id, data: { ...data, isActive: editingCustomer.isActive } });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (customer: Customer) => {
    if (confirm(t('common.confirmDelete', { name: customer.name }))) {
      deleteMutation.mutate(customer.id);
    }
  };

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone ?? '').includes(search)
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">{t('customers.title')}</h1>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-medium transition-colors"
        >
          <Plus size={18} /> {t('customers.addCustomer')}
        </button>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search size={18} className="absolute left-3 top-2.5 text-ink-500" />
        <input
          type="text"
          placeholder={t('customers.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-3 py-2 border border-ink-500/20 rounded-lg"
        />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left text-ink-500">
            <tr>
              <th className="px-4 py-3">{t('common.name')}</th>
              <th className="px-4 py-3">{t('common.phone')}</th>
              <th className="px-4 py-3">{t('common.email')}</th>
              <th className="px-4 py-3 text-right">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading && (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-ink-500">{t('common.loading')}</td></tr>
            )}
            {!isLoading && filtered.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-ink-500">{t('common.noResults')}</td></tr>
            )}
            {filtered.map((customer) => (
              <tr key={customer.id} className="hover:bg-surface">
                <td className="px-4 py-3 font-medium">{customer.name}</td>
                <td className="px-4 py-3">{customer.phone || '—'}</td>
                <td className="px-4 py-3">{customer.email || '—'}</td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button onClick={() => openEditModal(customer)} className="text-brand-600 hover:text-brand-700">
                    <Pencil size={16} className="inline" />
                  </button>
                  {canManage && (
                    <button onClick={() => handleDelete(customer)} className="text-red-600 hover:text-red-800">
                      <Trash2 size={16} className="inline" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <CustomerFormModal
          customer={editingCustomer}
          onClose={closeModal}
          onSubmit={handleSubmit}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
          serverError={serverError}
        />
      )}
    </div>
  );
}