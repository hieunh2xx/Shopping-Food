import { httpClient } from './base/HttpClient';
import { API_ENDPOINTS } from '../config/endpoints';
import type { IApiResponse, INotificationDto } from '../interfaces';

/**
 * Dịch vụ Quản lý Thông báo RESTful (NotificationService).
 * Cung cấp các thao tác lấy danh sách thông báo và đánh dấu đã đọc.
 */
class NotificationService {
  /**
   * Lấy danh sách toàn bộ các thông báo của người dùng hiện tại.
   */
  async getAll(): Promise<IApiResponse<INotificationDto[]>> {
    return httpClient.get<IApiResponse<INotificationDto[]>>(API_ENDPOINTS.NOTIFICATION.GET_ALL);
  }

  /**
   * Đánh dấu đã đọc cho một thông báo cụ thể theo ID.
   * @param id - Mã thông báo
   */
  async markAsRead(id: string): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.NOTIFICATION.READ(id));
  }

  /**
   * Đánh dấu đã đọc cho tất cả thông báo của người dùng.
   */
  async markAllAsRead(): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.NOTIFICATION.READ_ALL);
  }
}

// Khởi tạo và xuất thể hiện duy nhất của NotificationService
export const notificationService = new NotificationService();
