import axios, { AxiosError } from 'axios';
import type { ApiResponse } from '../types/common';
import type { AuthResponseDto } from '../types/auth';
import { clearSession, getStoredSession, saveSession } from './authStorage';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const session = getStoredSession();
  if (session?.accessToken) config.headers.Authorization = `Bearer ${session.accessToken}`;
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
    delete config.headers['content-type'];
  }
  return config;
});

let refreshPromise: Promise<string> | null = null;
api.interceptors.response.use(undefined, async (error: AxiosError) => {
  const original = error.config as (typeof error.config & { _retry?: boolean });
  const session = getStoredSession();
  if (error.response?.status !== 401 || !original || original._retry || !session?.refreshToken) {
    return Promise.reject(error);
  }

  original._retry = true;
  refreshPromise ??= axios.post<ApiResponse<AuthResponseDto>>(
    `${API_BASE_URL}/auth/refresh`,
    { refreshToken: session.refreshToken }
  ).then((response) => {
    saveSession(response.data.data);
    return response.data.data.accessToken;
  }).catch((refreshError) => {
    clearSession();
    throw refreshError;
  }).finally(() => {
    refreshPromise = null;
  });

  const token = await refreshPromise;
  original.headers = original.headers ?? {};
  original.headers.Authorization = `Bearer ${token}`;
  return api(original);
});

export function getApiErrorMessage(error: unknown): string {
  const axiosError = error as AxiosError<{ message?: string }>;
  if (axiosError.response?.status === 401) {
    return 'Phiên đăng nhập đã hết hạn hoặc tài khoản không có quyền truy cập. Vui lòng đăng nhập lại.';
  }
  if (axiosError.message === 'Network Error') {
    return 'Không kết nối được đến backend. Hãy kiểm tra API http://localhost:5050 đang chạy và cấu hình VITE_API_BASE_URL.';
  }
  return axiosError.response?.data?.message ?? axiosError.message ?? 'Request failed.';
}

export default api;

