import api from './api';
import { API_BASE_URL } from './api';
import type { ApiResponse } from '../models/common';
import type {
  AuthResponseDto,
  EmailRequestDto,
  LoginRequestDto,
  RegisterRequestDto,
  ResetPasswordRequestDto,
  TokenRequestDto
} from '../models/auth';
import type { NguoiDungDto, UpdateNguoiDungDto } from '../models/user';

export async function login(payload: LoginRequestDto): Promise<AuthResponseDto> {
  const response = await api.post<ApiResponse<AuthResponseDto>>('/auth/login', payload);
  return response.data.data;
}

export async function register(payload: RegisterRequestDto): Promise<void> {
  await api.post('/auth/register', payload);
}

export async function forgotPassword(payload: EmailRequestDto): Promise<void> {
  await api.post('/auth/forgot-password', payload);
}

export async function resetPassword(payload: ResetPasswordRequestDto): Promise<void> {
  await api.post('/auth/reset-password', payload);
}

export async function verifyEmail(payload: TokenRequestDto): Promise<void> {
  await api.post('/auth/verify-email', payload);
}

export async function resendVerification(payload: EmailRequestDto): Promise<void> {
  await api.post('/auth/resend-verification', payload);
}

export async function getCurrentUser(): Promise<NguoiDungDto> {
  const response = await api.get<ApiResponse<NguoiDungDto>>('/nguoidung/me');
  return response.data.data;
}

export async function updateCurrentUser(payload: UpdateNguoiDungDto): Promise<NguoiDungDto> {
  const response = await api.put<ApiResponse<NguoiDungDto>>('/nguoidung/me', payload);
  return response.data.data;
}

export function beginGoogleLogin(): void {
  window.location.href = `${API_BASE_URL.replace(/\/$/, '')}/auth/google-login`;
}
