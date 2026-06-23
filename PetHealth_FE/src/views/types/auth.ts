import type { NguoiDungDto } from './user';

export interface RegisterRequestDto {
  hoVaTen: string;
  email: string;
  matKhau: string;
  soDienThoai?: string | null;
}

export interface LoginRequestDto {
  email: string;
  matKhau: string;
}

export interface EmailRequestDto {
  email: string;
}

export interface TokenRequestDto {
  token: string;
}

export interface ResetPasswordRequestDto {
  token: string;
  matKhauMoi: string;
}

export interface AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: NguoiDungDto;
}
