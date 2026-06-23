import api from './api';
import type { ApiResponse } from '../types/common';
import type {
  CaLamViecDto,
  BankTransferDepositResponseDto,
  ChuongTrinhUuDaiDto,
  CreateDepositDto,
  CreateDanhGiaDto,
  CreatePetVisitImageDto,
  CreateReminderDto,
  CustomerUsageDto,
  DanhGiaDto,
  DepositDto,
  HoaDonDto,
  IssueUuDaiDto,
  PetHistoryDto,
  PetQrDto,
  PetVisitImageDto,
  PhieuUuDaiDto,
  ReminderDto,
  UpsertCaLamViecDto,
  UpsertHoaDonDto,
  UpsertUuDaiDto
} from '../types/features';
import type { StaffUpsertDto } from '../types/management';

export async function getReviews(maDichVu?: number): Promise<DanhGiaDto[]> {
  const response = await api.get<ApiResponse<DanhGiaDto[]>>('/danhgia', {
    params: maDichVu ? { maDichVu } : undefined
  });
  return response.data.data;
}

export async function createReview(payload: CreateDanhGiaDto): Promise<void> {
  await api.post('/danhgia', payload);
}

export async function getInvoices(): Promise<HoaDonDto[]> {
  const response = await api.get<ApiResponse<HoaDonDto[]>>('/hoadon');
  return response.data.data;
}

export async function upsertInvoice(payload: UpsertHoaDonDto): Promise<void> {
  await api.post('/hoadon', payload);
}

export async function getPromotions(): Promise<ChuongTrinhUuDaiDto[]> {
  const response = await api.get<ApiResponse<ChuongTrinhUuDaiDto[]>>('/uudai');
  return response.data.data;
}

export async function createPromotion(payload: UpsertUuDaiDto): Promise<void> {
  await api.post('/uudai', payload);
}

export async function updatePromotion(maUuDai: number, payload: UpsertUuDaiDto): Promise<void> {
  await api.put(`/uudai/${maUuDai}`, payload);
}

export async function issueVoucher(payload: IssueUuDaiDto): Promise<void> {
  await api.post('/uudai/issue', payload);
}

export async function getMyVouchers(): Promise<PhieuUuDaiDto[]> {
  const response = await api.get<ApiResponse<PhieuUuDaiDto[]>>('/uudai/my-vouchers');
  return response.data.data;
}

export async function getAvailableVouchers(maLichHen: number): Promise<PhieuUuDaiDto[]> {
  const response = await api.get<ApiResponse<PhieuUuDaiDto[]>>('/uudai/available', {
    params: { maLichHen }
  });
  return response.data.data;
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

export async function getVisitImages(params: { maLichHen?: number; maThuCung?: number }): Promise<PetVisitImageDto[]> {
  const response = await api.get<ApiResponse<PetVisitImageDto[]>>('/advanced/visit-images', { params });
  return response.data.data;
}

export async function addVisitImage(payload: CreatePetVisitImageDto): Promise<void> {
  await api.post('/advanced/visit-images', payload);
}

export async function uploadVisitImage(payload: {
  maLichHen: number;
  maThuCung: number;
  loaiAnh: 'Before' | 'After';
  ghiChu?: string;
  file: File;
}): Promise<void> {
  const formData = new FormData();
  formData.append('maLichHen', String(payload.maLichHen));
  formData.append('maThuCung', String(payload.maThuCung));
  formData.append('loaiAnh', payload.loaiAnh);
  formData.append('ghiChu', payload.ghiChu ?? '');
  formData.append('file', payload.file);
  await api.post('/advanced/visit-images/upload', formData);
}

export async function deleteVisitImage(maAnh: number): Promise<void> {
  await api.delete(`/advanced/visit-images/${maAnh}`);
}

export async function getDeposits(): Promise<DepositDto[]> {
  const response = await api.get<ApiResponse<DepositDto[]>>('/advanced/deposits');
  return response.data.data;
}

export async function createBankTransferDeposit(payload: CreateDepositDto): Promise<BankTransferDepositResponseDto> {
  const response = await api.post<ApiResponse<BankTransferDepositResponseDto>>('/advanced/deposits/bank-transfer', payload);
  return response.data.data;
}

export async function uploadDepositReceipt(maDatCoc: number, file: File, ghiChu?: string): Promise<void> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('ghiChu', ghiChu ?? '');
  await api.post(`/advanced/deposits/${maDatCoc}/receipt`, formData);
}

export async function reviewDeposit(maDatCoc: number, chapNhan: boolean, lyDoTuChoi?: string): Promise<void> {
  await api.patch(`/advanced/deposits/${maDatCoc}/review`, { chapNhan, lyDoTuChoi });
}

export async function getReminders(): Promise<ReminderDto[]> {
  const response = await api.get<ApiResponse<ReminderDto[]>>('/advanced/reminders');
  return response.data.data;
}

export async function createReminder(payload: CreateReminderDto): Promise<void> {
  await api.post('/advanced/reminders', payload);
}

export async function claimLoyaltyVoucher(): Promise<void> {
  await api.post('/advanced/loyalty/claim');
}
