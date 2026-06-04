import api from './api';
import type { ApiResponse } from '../models/common';
import type { DichVuDto } from '../models/service';

export async function getServices(): Promise<DichVuDto[]> {
  const response = await api.get<ApiResponse<DichVuDto[]>>('/dichvu');
  return response.data.data;
}
