import apiClient from '../api/client';
import type {
  Promotion,
  CreatePromotionRequest,
  UpdatePromotionRequest,
  PromoValidationResult,
} from '../types/promotion';

export const promotionService = {
  getAll: async (): Promise<Promotion[]> => {
    const res = await apiClient.get<Promotion[]>('/Promotions');
    return res.data;
  },
  create: async (data: CreatePromotionRequest): Promise<Promotion> => {
    const res = await apiClient.post<Promotion>('/Promotions', data);
    return res.data;
  },
  update: async (id: number, data: UpdatePromotionRequest): Promise<void> => {
    await apiClient.put(`/Promotions/${id}`, data);
  },
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/Promotions/${id}`);
  },
  validate: async (code: string, subtotal: number): Promise<PromoValidationResult> => {
    const res = await apiClient.post<PromoValidationResult>('/Promotions/validate', { code, subtotal });
    return res.data;
  },
};