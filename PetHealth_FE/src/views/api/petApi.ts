import api from './api';
import type { ApiResponse } from '../types/common';
import type { CreateThuCungDto, ThuCungDto, UpdateThuCungDto } from '../types/pet';

export async function getPets(maNguoiDung?: string): Promise<ThuCungDto[]> {
  const response = await api.get<ApiResponse<ThuCungDto[]>>('/thucung', {
    params: maNguoiDung ? { maNguoiDung } : undefined
  });
  return response.data.data;
}

export async function createPet(payload: CreateThuCungDto): Promise<ThuCungDto> {
  const response = await api.post<ApiResponse<ThuCungDto>>('/thucung', payload);
  return response.data.data;
}

export async function updatePet(maThuCung: number, payload: UpdateThuCungDto): Promise<ThuCungDto> {
  const response = await api.put<ApiResponse<ThuCungDto>>(`/thucung/${maThuCung}`, payload);
  return response.data.data;
}

export async function deletePet(maThuCung: number): Promise<void> {
  await api.delete(`/thucung/${maThuCung}`);
}
