import apiClient from '../api/client';
import type { LoginRequest, LoginResponse } from '../types/auth';

export const authService = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/Auth/login', credentials);
    return response.data;
  },
};