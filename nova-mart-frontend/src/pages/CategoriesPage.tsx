import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { lookupService } from '../services/lookupService';
import LookupFormModal, { type LookupFormValues } from '../features/lookup/LookupFormModal';
import type { Category } from '../types/lookup';

export default function CategoriesPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading } = useQuery({ queryKey: ['categories'], queryFn: lookupService.getCategories });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['categories'] });

  const createMutation = useMutation({
    mutationFn: lookupService.createCategory,
    onSuccess: () => { invalidate(); closeModal(); },
    onError: (err: unknown) => setServerError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed.'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: LookupFormValues & { isActive: boolean } }) =>
      lookupService.updateCategory(id, data),
    onSuccess: () => { invalidate(); closeModal(); },
    onError: (err: unknown) => setServerError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed.'),
  });

  const deleteMutation = useMutation({
    mutationFn: lookupService.deleteCategory,
    onSuccess: invalidate,
    onError: (err: unknown) => alert((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Could not delete.'),
  });

  const openAdd = () => { setEditing(null); setServerError(null); setModalOpen(true); };
  const openEdit = (c: Category) => { setEditing(c); setServerError(null); setModalOpen(true); };
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
        <h1 className="text-2xl font-bold">Categories</h1>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-medium">
          <Plus size={18} /> Add Category
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left text-ink-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading && <tr><td colSpan={3} className="px-4 py-6 text-center text-ink-500">Loading...</td></tr>}
            {!isLoading && categories.length === 0 && <tr><td colSpan={3} className="px-4 py-6 text-center text-ink-500">No categories yet.</td></tr>}
            {categories.map((c) => (
              <tr key={c.id} className="hover:bg-surface">
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3 text-ink-500">{c.description || '—'}</td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button onClick={() => openEdit(c)} className="text-brand-600 hover:text-brand-700"><Pencil size={16} className="inline" /></button>
                  <button onClick={() => { if (confirm(`Delete "${c.name}"?`)) deleteMutation.mutate(c.id); }} className="text-red-600 hover:text-red-800"><Trash2 size={16} className="inline" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <LookupFormModal
          title={editing ? 'Edit Category' : 'Add Category'}
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