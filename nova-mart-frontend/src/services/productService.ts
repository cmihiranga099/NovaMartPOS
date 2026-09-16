import apiClient from '../api/client';
import type { Product, CreateProductRequest, UpdateProductRequest } from '../types/product';

export const productService = {
  getAll: async (): Promise<Product[]> => {
    const res = await apiClient.get<Product[]>('/Products');
    return res.data;
  },
  create: async (data: CreateProductRequest): Promise<Product> => {
    const res = await apiClient.post<Product>('/Products', data);
    return res.data;
  },
  update: async (id: number, data: UpdateProductRequest): Promise<void> => {
    await apiClient.put(`/Products/${id}`, data);
  },
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/Products/${id}`);
  },
};