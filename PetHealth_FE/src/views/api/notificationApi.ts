import api from './api';
import type { ApiResponse } from '../types/common';
import type { NotificationDto } from '../types/notification';

export async function getNotifications(): Promise<NotificationDto[]> {
  const response = await api.get<ApiResponse<NotificationDto[]>>('/notifications');
  return response.data.data;
}
export async function markNotificationRead(id: number): Promise<void> {
  await api.patch(`/notifications/${id}/read`);
}
export async function markAllNotificationsRead(): Promise<void> {
  await api.patch('/notifications/read-all');
}
