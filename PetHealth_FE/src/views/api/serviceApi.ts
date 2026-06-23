import api from './api';
import type { ApiResponse } from '../types/common';
import type { DichVuDto } from '../types/service';

export async function getServices(): Promise<DichVuDto[]> {
  const response = await api.get<ApiResponse<DichVuDto[]>>('/dichvu');
  return response.data.data;
}
