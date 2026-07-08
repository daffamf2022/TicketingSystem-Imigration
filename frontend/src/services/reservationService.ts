import axios from 'axios';
import apiClient from './api';

export interface Quota {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  remaining_quota: number;
  max_quota: number;
}

export interface QuotaListResponse {
  status: string;
  data: Quota[];
}

export interface CompanionResponse {
  companion_name: string | null;
  companion_nik: string | null;
  disability_type: string;
}

export interface DocumentResponse {
  id: string;
  document_type: string;
  file_name: string;
}

export interface ReservationData {
  reservation_id: string;
  queue_number: string;
  status: string;
  companion: CompanionResponse | null;
  documents: DocumentResponse[];
}

export interface SingleReservationData {
  id: string;
  queueNumber: string;
  status: string;
  quota: {
    date: string;
    startTime: string;
    endTime: string;
  };
  user: {
    name: string;
    nik: string;
  };
  companion: {
    companionName: string | null;
    companionNik: string | null;
    disabilityType: string;
    needsDisabilityFacility: boolean;
  } | null;
  documents: {
    id: string;
    documentType: string;
    filePath: string;
  }[];
}

export interface SingleReservationResponse {
  status: string;
  data: SingleReservationData;
}

export interface ReservationResponse {
  status: string;
  message: string;
  data: ReservationData;
}

export const reservationService = {
  async getQuotas(): Promise<QuotaListResponse> {
    try {
      const response = await apiClient.get<QuotaListResponse>('/quotas');
      return response.data;
    } catch (error: unknown) {
      let msg = 'Gagal memuat jadwal kuota.';
      if (axios.isAxiosError(error)) {
        msg = error.response?.data?.message || msg;
      }
      throw new Error(msg, { cause: error });
    }
  },

  async createReservation(formData: FormData, token: string): Promise<ReservationResponse> {
    try {
      const response = await apiClient.post<ReservationResponse>('/reservations', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: unknown) {
      let msg = 'Gagal membuat reservasi antrean.';
      if (axios.isAxiosError(error)) {
        msg = error.response?.data?.message || msg;
      }
      throw new Error(msg, { cause: error });
    }
  },

  async getReservationDetails(id: string, token: string): Promise<SingleReservationResponse> {
    try {
      const response = await apiClient.get<SingleReservationResponse>(`/reservations/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error: unknown) {
      let msg = 'Gagal mengambil detail tiket antrean.';
      if (axios.isAxiosError(error)) {
        msg = error.response?.data?.message || msg;
      }
      throw new Error(msg, { cause: error });
    }
  },

  async getAllReservations(token: string): Promise<{ status: string; data: SingleReservationData[] }> {
    try {
      const response = await apiClient.get<{ status: string; data: SingleReservationData[] }>('/reservations', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error: unknown) {
      let msg = 'Gagal mengambil seluruh data tiket antrean.';
      if (axios.isAxiosError(error)) {
        msg = error.response?.data?.message || msg;
      }
      throw new Error(msg, { cause: error });
    }
  },

  async updateReservationStatus(id: string, status: string, token: string): Promise<SingleReservationResponse> {
    try {
      const response = await apiClient.patch<SingleReservationResponse>(`/reservations/${id}/status`, { status }, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error: unknown) {
      let msg = 'Gagal memperbarui status tiket.';
      if (axios.isAxiosError(error)) {
        msg = error.response?.data?.message || msg;
      }
      throw new Error(msg, { cause: error });
    }
  },
};

export default reservationService;
