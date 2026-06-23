import api from './api';
import type { ApiResponse } from '../types/common';
import type { MedicalRecordDto, UpsertMedicalRecordDto } from '../types/clinical';

export async function getMedicalRecords(maThuCung?: number): Promise<MedicalRecordDto[]> {
  const response = await api.get<ApiResponse<MedicalRecordDto[]>>('/clinical/records', {
    params: maThuCung ? { maThuCung } : undefined
  });
  return response.data.data;
}

export async function saveMedicalRecord(payload: UpsertMedicalRecordDto): Promise<void> {
  await api.post('/clinical/records', payload);
}
