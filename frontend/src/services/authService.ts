import axios from 'axios';
import apiClient from './api';

export interface User {
  id: string;
  name: string;
  nik: string;
  email: string;
  role: string;
  nip?: string | null;
}

export interface AuthResponse {
  status: string;
  message: string;
  data: {
    token: string;
    user: User;
  };
}

export interface RegisterResponse {
  status: string;
  message: string;
  data?: {
    user: User;
  };
}

export const authService = {
  getToken(): string | null {
    return localStorage.getItem('token');
  },

  getUser(): User | null {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  },

  setSession(token: string, user: User): void {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    // Emit auth-change event to update listening components in real-time
    window.dispatchEvent(new Event('auth-change'));
  },

  clearSession(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Emit auth-change event to update listening components in real-time
    window.dispatchEvent(new Event('auth-change'));
  },

  async login(identifier: string, password: string): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/login', { identifier, password });
      return response.data;
    } catch (error: unknown) {
      let msg = 'Login gagal. Silakan periksa kembali kredensial Anda.';
      if (axios.isAxiosError(error)) {
        msg = error.response?.data?.message || msg;
      }
      throw new Error(msg, { cause: error });
    }
  },

  async register(data: Record<string, unknown>): Promise<RegisterResponse> {
    try {
      const response = await apiClient.post<RegisterResponse>('/auth/register', data);
      return response.data;
    } catch (error: unknown) {
      let msg = 'Registrasi gagal.';
      if (axios.isAxiosError(error)) {
        msg = error.response?.data?.message || msg;
      }
      throw new Error(msg, { cause: error });
    }
  },
};

export default authService;
