import apiClient from '../api/client';
import type { Supplier, CreateSupplierRequest, UpdateSupplierRequest } from '../types/supplier';

export const supplierService = {
  getAll: async (): Promise<Supplier[]> => {
    const res = await apiClient.get<Supplier[]>('/Suppliers');
    return res.data;
  },
  create: async (data: CreateSupplierRequest): Promise<Supplier> => {
    const res = await apiClient.post<Supplier>('/Suppliers', data);
    return res.data;
  },
  update: async (id: number, data: UpdateSupplierRequest): Promise<void> => {
    await apiClient.put(`/Suppliers/${id}`, data);
  },
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/Suppliers/${id}`);
  },
};