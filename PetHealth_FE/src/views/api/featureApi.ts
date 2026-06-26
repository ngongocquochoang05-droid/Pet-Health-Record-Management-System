import api from './api';
import type { ApiResponse } from '../types/common';
import type {
  CaLamViecDto,
  CreateReminderDto,
  CustomerUsageDto,
  HoaDonDto,
  PetHistoryDto,
  PetQrDto,
  ReminderDto,
  UpsertCaLamViecDto,
  UpsertHoaDonDto
} from '../types/features';
import type { StaffUpsertDto } from '../types/management';

export async function getInvoices(): Promise<HoaDonDto[]> {
  const response = await api.get<ApiResponse<HoaDonDto[]>>('/hoadon');
  return response.data.data;
}

export async function upsertInvoice(payload: UpsertHoaDonDto): Promise<void> {
  await api.post('/hoadon', payload);
}

export async function getShifts(maNhanVien?: string): Promise<CaLamViecDto[]> {
  const response = await api.get<ApiResponse<CaLamViecDto[]>>('/calam', {
    params: maNhanVien ? { maNhanVien } : undefined
  });
  return response.data.data;
}

export async function createShift(payload: UpsertCaLamViecDto): Promise<void> {
  await api.post('/calam', payload);
}

export async function updateShift(maCaLam: number, payload: UpsertCaLamViecDto): Promise<void> {
  await api.put(`/calam/${maCaLam}`, payload);
}

export async function deleteShift(maCaLam: number): Promise<void> {
  await api.delete(`/calam/${maCaLam}`);
}

export async function createStaff(payload: StaffUpsertDto): Promise<void> {
  await api.post('/admin/staff', payload);
}

export async function updateStaff(maNhanVien: string, payload: StaffUpsertDto): Promise<void> {
  await api.put(`/admin/staff/${maNhanVien}`, payload);
}

export async function deleteStaff(maNhanVien: string): Promise<void> {
  await api.delete(`/admin/staff/${maNhanVien}`);
}

export async function getCustomerUsage(): Promise<CustomerUsageDto[]> {
  const response = await api.get<ApiResponse<CustomerUsageDto[]>>('/advanced/customers/usage');
  return response.data.data;
}

export async function issuePetQr(maThuCung: number): Promise<PetQrDto> {
  const response = await api.post<ApiResponse<PetQrDto>>(`/advanced/pets/${maThuCung}/qr`);
  return response.data.data;
}

export async function getPetHistory(params: { maThuCung?: number; maQr?: string }): Promise<PetHistoryDto[]> {
  const response = await api.get<ApiResponse<PetHistoryDto[]>>('/advanced/pets/history', { params });
  return response.data.data;
}

export async function getReminders(): Promise<ReminderDto[]> {
  const response = await api.get<ApiResponse<ReminderDto[]>>('/advanced/reminders');
  return response.data.data;
}

export async function createReminder(payload: CreateReminderDto): Promise<void> {
  await api.post('/advanced/reminders', payload);
}
