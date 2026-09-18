import apiClient from '../api/client';
import type { CreatePurchaseOrderRequest, PurchaseOrderResult } from '../types/purchaseOrder';

export const purchaseOrderService = {
  receive: async (data: CreatePurchaseOrderRequest): Promise<PurchaseOrderResult> => {
    const res = await apiClient.post<PurchaseOrderResult>('/PurchaseOrders', data);
    return res.data;
  },
  getAll: async (): Promise<PurchaseOrderResult[]> => {
    const res = await apiClient.get<PurchaseOrderResult[]>('/PurchaseOrders');
    return res.data;
  },
};