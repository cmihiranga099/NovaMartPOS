import apiClient from '../api/client';
import type {
  ShiftSummary,
  OpenShiftRequest,
  CloseShiftRequest,
  CashMovementRequest,
  CashMovement,
} from '../types/shift';

export const shiftService = {
  getActive: async (): Promise<ShiftSummary | null> => {
    const res = await apiClient.get<ShiftSummary | null>('/shifts/active');
    return res.data;
  },

  openShift: async (data: OpenShiftRequest): Promise<ShiftSummary> => {
    const res = await apiClient.post<ShiftSummary>('/shifts/open', data);
    return res.data;
  },

  closeShift: async (id: number, data: CloseShiftRequest): Promise<ShiftSummary> => {
    const res = await apiClient.post<ShiftSummary>(`/shifts/${id}/close`, data);
    return res.data;
  },

  addCashMovement: async (id: number, data: CashMovementRequest): Promise<CashMovement> => {
    const res = await apiClient.post<CashMovement>(`/shifts/${id}/cash-movement`, data);
    return res.data;
  },

  getSummary: async (id: number): Promise<ShiftSummary> => {
    const res = await apiClient.get<ShiftSummary>(`/shifts/${id}/summary`);
    return res.data;
  },

  getAll: async (from?: string, to?: string): Promise<ShiftSummary[]> => {
    const params: Record<string, string> = {};
    if (from) params.from = from;
    if (to) params.to = to;
    const res = await apiClient.get<ShiftSummary[]>('/shifts', { params });
    return res.data;
  },
};
