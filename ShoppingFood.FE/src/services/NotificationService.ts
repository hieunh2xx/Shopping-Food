import { httpClient } from './base/HttpClient';
import { API_ENDPOINTS } from '../config/endpoints';
import type { IApiResponse } from '../interfaces';

export interface INotificationDto {
  id: string;
  userId: string;
  title: string;
  message: string;
  notificationType: string;
  isRead: boolean;
  createAt: string;
}

class NotificationService {
  async getAll(): Promise<IApiResponse<INotificationDto[]>> {
    return httpClient.get<IApiResponse<INotificationDto[]>>(API_ENDPOINTS.NOTIFICATION.GET_ALL);
  }

  async markAsRead(id: string): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.NOTIFICATION.READ(id));
  }

  async markAllAsRead(): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.NOTIFICATION.READ_ALL);
  }
}

export const notificationService = new NotificationService();
