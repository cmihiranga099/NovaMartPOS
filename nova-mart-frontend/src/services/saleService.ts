import apiClient from '../api/client';
import type { Product } from '../types/product';
import type { CreateSaleRequest, SaleResult } from '../types/sale';

export const saleService = {
  checkout: async (data: CreateSaleRequest): Promise<SaleResult> => {
    const res = await apiClient.post<SaleResult>('/Sales', data);
    return res.data;
  },
  getAll: async (): Promise<SaleResult[]> => {
    const res = await apiClient.get<SaleResult[]>('/Sales');
    return res.data;
  },
  searchByBarcode: async (barcode: string): Promise<Product> => {
    const res = await apiClient.get<Product>(`/Products/barcode/${barcode}`);
    return res.data;
  },
};