import apiClient from '../api/client';
import type { LoginRequest, LoginResponse } from '../types/auth';

export interface VerifyPinResponse {
  approved: boolean;
  approvedBy?: string;
}

export const authService = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/Auth/login', credentials);
    return response.data;
  },
  verifyPin: async (pin: string): Promise<VerifyPinResponse> => {
    const response = await apiClient.post<VerifyPinResponse>('/Auth/verify-pin', { pin });
    return response.data;
  },
};