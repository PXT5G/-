import { apiRequest } from '@/utils/api';
import type { User, AuthTokens, LoginRequest, RegisterRequest, ApiResponse } from '@/types';

interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export const authService = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await apiRequest<ApiResponse<AuthResponse>>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data!;
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await apiRequest<ApiResponse<AuthResponse>>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data!;
  },

  async refresh(refreshToken: string): Promise<{ accessToken: string; expiresIn: number }> {
    const response = await apiRequest<ApiResponse<{ accessToken: string; expiresIn: number }>>(
      '/api/auth/refresh',
      { method: 'POST', body: JSON.stringify({ refreshToken }) }
    );
    return response.data!;
  },

  async logout(refreshToken: string, token: string): Promise<void> {
    await apiRequest('/api/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
      token,
    });
  },

  async getProfile(token: string): Promise<User> {
    const response = await apiRequest<ApiResponse<User>>('/api/auth/profile', { token });
    return response.data!;
  },

  async setPin(pin: string, token: string): Promise<void> {
    await apiRequest('/api/auth/pin', {
      method: 'POST',
      body: JSON.stringify({ pin }),
      token,
    });
  },

  async verifyPin(pin: string, token: string): Promise<boolean> {
    try {
      await apiRequest('/api/auth/pin/verify', {
        method: 'POST',
        body: JSON.stringify({ pin }),
        token,
      });
      return true;
    } catch {
      return false;
    }
  },
};
