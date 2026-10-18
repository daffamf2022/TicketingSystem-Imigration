import axios from 'axios';
import apiClient from './api';

export interface User {
  id: string;
  username?: string;
  name: string;
  nik: string;
  email: string;
  role: string;
  nip?: string | null;
  createdAt?: string;
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
    // Emit an event so connected components can update the current session.
    window.dispatchEvent(new Event('auth-change'));
  },

  clearSession(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Emit an event so connected components can update the current session.
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

  async getUsers(token: string): Promise<{ status: string; data: User[] }> {
    try {
      const response = await apiClient.get<{ status: string; data: User[] }>('/auth/users', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error: unknown) {
      let msg = 'Gagal mengambil daftar akun pengguna.';
      if (axios.isAxiosError(error)) {
        msg = error.response?.data?.message || msg;
      }
      throw new Error(msg, { cause: error });
    }
  },

  async sendPasswordResetLink(userId: string, token: string): Promise<{ status: string; message: string }> {
    try {
      const response = await apiClient.post<{ status: string; message: string }>(`/auth/users/${userId}/password-reset-link`, undefined, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error: unknown) {
      let msg = 'Gagal mengirim tautan atur ulang kata sandi.';
      if (axios.isAxiosError(error)) {
        msg = error.response?.data?.message || msg;
      }
      throw new Error(msg, { cause: error });
    }
  },

  async resetPassword(token: string, newPassword: string): Promise<{ status: string; message: string }> {
    try {
      const response = await apiClient.post<{ status: string; message: string }>('/auth/reset-password', {
        token,
        newPassword,
      });
      return response.data;
    } catch (error: unknown) {
      let msg = 'Gagal mengatur ulang kata sandi.';
      if (axios.isAxiosError(error)) {
        msg = error.response?.data?.message || msg;
      }
      throw new Error(msg, { cause: error });
    }
  },

  async requestPasswordReset(email: string): Promise<{ status: string; message: string }> {
    try {
      const response = await apiClient.post<{ status: string; message: string }>('/auth/password-reset-link', { email });
      return response.data;
    } catch (error: unknown) {
      let msg = 'Gagal meminta tautan atur ulang kata sandi.';
      if (axios.isAxiosError(error)) {
        msg = error.response?.data?.message || msg;
      }
      throw new Error(msg, { cause: error });
    }
  },

};

export default authService;
