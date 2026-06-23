import api from './api';
import type { ApiResponse } from '../types/common';
import type { LichHenDto, UpdateLichHenStatusDto } from '../types/booking';
import type { DichVuDto } from '../types/service';
import type { ReportSummaryDto, ServiceUpsertDto, StaffDto, UpdateUserRoleDto } from '../types/management';
import type { NguoiDungDto } from '../types/user';

export async function getAdminUsers(vaiTro?: string): Promise<NguoiDungDto[]> {
  const response = await api.get<ApiResponse<NguoiDungDto[]>>('/admin/users', {
    params: vaiTro ? { vaiTro } : undefined
  });
  return response.data.data;
}

export async function getAdminStaff(): Promise<StaffDto[]> {
  const response = await api.get<ApiResponse<StaffDto[]>>('/admin/staff');
  return response.data.data;
}

export async function getAdminServices(): Promise<DichVuDto[]> {
  const response = await api.get<ApiResponse<DichVuDto[]>>('/admin/services');
  return response.data.data;
}

export async function updateUserRole(maNguoiDung: string, payload: UpdateUserRoleDto): Promise<void> {
  await api.patch(`/admin/users/${maNguoiDung}/role`, payload);
}

export async function getAdminAppointments(): Promise<LichHenDto[]> {
  const response = await api.get<ApiResponse<LichHenDto[]>>('/admin/appointments');
  return response.data.data;
}

export async function updateAdminAppointmentStatus(maLichHen: number, payload: UpdateLichHenStatusDto): Promise<void> {
  await api.patch(`/admin/appointments/${maLichHen}/status`, payload);
}

export async function assignAdminAppointmentStaff(maLichHen: number, maNhanVien: string): Promise<void> {
  await api.patch(`/admin/appointments/${maLichHen}/assign`, { maNhanVien });
}

export async function createAdminService(payload: ServiceUpsertDto): Promise<void> {
  await api.post('/admin/services', payload);
}

export async function uploadAdminServiceImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post<ApiResponse<{ anhDichVuUrl: string }>>('/admin/services/image', formData);
  return response.data.data.anhDichVuUrl;
}

export async function updateAdminService(maDichVu: number, payload: ServiceUpsertDto): Promise<void> {
  await api.put(`/admin/services/${maDichVu}`, payload);
}

export async function deleteAdminService(maDichVu: number): Promise<void> {
  await api.delete(`/admin/services/${maDichVu}`);
}

export async function getAdminReports(): Promise<ReportSummaryDto> {
  const response = await api.get<ApiResponse<ReportSummaryDto>>('/admin/reports');
  return response.data.data;
}

export async function downloadAdminReportCsv(): Promise<Blob> {
  const response = await api.get('/admin/reports/export.csv', {
    responseType: 'blob'
  });
  return response.data;
}

export async function getStaffAppointments(maNhanVien: string): Promise<LichHenDto[]> {
  const response = await api.get<ApiResponse<LichHenDto[]>>('/staff/appointments', {
    params: { maNhanVien }
  });
  return response.data.data;
}

export async function updateStaffAppointmentStatus(maLichHen: number, payload: UpdateLichHenStatusDto): Promise<void> {
  await api.patch(`/staff/appointments/${maLichHen}/status`, payload);
}

export function toServiceUpsert(service: DichVuDto): ServiceUpsertDto {
  return {
    tenDichVu: service.tenDichVu,
    moTa: service.moTa,
    giaTien: service.giaTien,
    thoiGianThucHien: service.thoiGianThucHien,
    anhDichVuUrl: service.anhDichVuUrl,
    loaiThuCung: service.loaiThuCung,
    trangThaiHoatDong: service.trangThaiHoatDong
  };
}
