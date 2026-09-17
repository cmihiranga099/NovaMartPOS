import apiClient from '../api/client';
import type { DailySalesReport, TopProduct } from '../types/report';
import type { Product } from '../types/product';

export const reportService = {
  getDailySales: async (): Promise<DailySalesReport> => {
    const res = await apiClient.get<DailySalesReport>('/Reports/daily-sales');
    return res.data;
  },
  getTopProducts: async (from: string, to: string): Promise<TopProduct[]> => {
    const res = await apiClient.get<TopProduct[]>('/Reports/top-products', { params: { from, to } });
    return res.data;
  },
  getLowStock: async (): Promise<Product[]> => {
    const res = await apiClient.get<Product[]>('/Inventory/low-stock');
    return res.data;
  },
};