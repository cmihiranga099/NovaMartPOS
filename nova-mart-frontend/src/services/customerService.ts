import apiClient from '../api/client';
import type { Customer, CreateCustomerRequest, UpdateCustomerRequest } from '../types/customer';

export const customerService = {
  getAll: async (): Promise<Customer[]> => {
    const res = await apiClient.get<Customer[]>('/Customers');
    return res.data;
  },
  create: async (data: CreateCustomerRequest): Promise<Customer> => {
    const res = await apiClient.post<Customer>('/Customers', data);
    return res.data;
  },
  update: async (id: number, data: UpdateCustomerRequest): Promise<void> => {
    await apiClient.put(`/Customers/${id}`, data);
  },
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/Customers/${id}`);
  },
};