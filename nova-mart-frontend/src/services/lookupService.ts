import apiClient from '../api/client';
import type { Category, Brand } from '../types/lookup';

export const lookupService = {
  getCategories: async (): Promise<Category[]> => {
    const res = await apiClient.get<Category[]>('/Categories');
    return res.data;
  },
  getBrands: async (): Promise<Brand[]> => {
    const res = await apiClient.get<Brand[]>('/Brands');
    return res.data;
  },
};