import api from './api';
import type { ApiResponse } from '../types/common';
import type { BookingAvailabilityDto, CreateLichHenDto, LichHenDto, UpdateLichHenDto, UpdateLichHenStatusDto } from '../types/booking';

export async function getBookings(maNguoiDung?: string): Promise<LichHenDto[]> {
  const response = await api.get<ApiResponse<LichHenDto[]>>('/lichhen', {
    params: maNguoiDung ? { maNguoiDung } : undefined
  });
  return response.data.data;
}

export async function createBooking(payload: CreateLichHenDto): Promise<LichHenDto> {
  const response = await api.post<ApiResponse<LichHenDto>>('/lichhen', payload);
  return response.data.data;
}

export async function getBookingAvailability(ngayHen: string, gioHen: string): Promise<BookingAvailabilityDto> {
  const response = await api.get<ApiResponse<BookingAvailabilityDto>>('/lichhen/availability', {
    params: { ngayHen, gioHen }
  });
  return response.data.data;
}

export async function updateBookingStatus(maLichHen: number, payload: UpdateLichHenStatusDto): Promise<void> {
  await api.patch(`/lichhen/${maLichHen}/status`, payload);
}

export async function updateBooking(maLichHen: number, payload: UpdateLichHenDto): Promise<LichHenDto> {
  const response = await api.put<ApiResponse<LichHenDto>>(`/lichhen/${maLichHen}`, payload);
  return response.data.data;
}
