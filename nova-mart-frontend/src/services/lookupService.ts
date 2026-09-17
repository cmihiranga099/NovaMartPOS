import apiClient from '../api/client';
import type { Category, Brand, CreateLookupRequest, UpdateLookupRequest } from '../types/lookup';

export const lookupService = {
  getCategories: async (): Promise<Category[]> => {
    const res = await apiClient.get<Category[]>('/Categories');
    return res.data;
  },
  createCategory: async (data: CreateLookupRequest): Promise<Category> => {
    const res = await apiClient.post<Category>('/Categories', data);
    return res.data;
  },
  updateCategory: async (id: number, data: UpdateLookupRequest): Promise<void> => {
    await apiClient.put(`/Categories/${id}`, data);
  },
  deleteCategory: async (id: number): Promise<void> => {
    await apiClient.delete(`/Categories/${id}`);
  },

  getBrands: async (): Promise<Brand[]> => {
    const res = await apiClient.get<Brand[]>('/Brands');
    return res.data;
  },
  createBrand: async (data: CreateLookupRequest): Promise<Brand> => {
    const res = await apiClient.post<Brand>('/Brands', data);
    return res.data;
  },
  updateBrand: async (id: number, data: UpdateLookupRequest): Promise<void> => {
    await apiClient.put(`/Brands/${id}`, data);
  },
  deleteBrand: async (id: number): Promise<void> => {
    await apiClient.delete(`/Brands/${id}`);
  },
};