import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { ENV } from '../config/env';
import type { INotificationDto } from '../interfaces';

/**
 * Dịch vụ Thông báo Thời gian thực qua SignalR (NotificationRealtimeService).
 * Kết nối tới `/hubs/notifications` để lắng nghe các thông báo đẩy realtime cho từng tài khoản (đơn hàng mới, trạng thái giao hàng, khuyến mãi).
 */
class NotificationRealtimeService {
  private hubConnection: HubConnection | null = null;
  private callbacks = new Set<(notification: INotificationDto) => void>();

  /**
   * Lấy đường dẫn gốc của API server để kết nối SignalR Hub.
   */
  private getHubBaseUrl(): string {
    return ENV.API_BASE_URL.replace(/\/api\/?$/i, '');
  }

  /**
   * Khởi tạo kết nối SignalR nhận thông báo và tham gia vào nhóm riêng của người dùng (JoinUser).
   * @param token - JWT access token
   * @param userId - Mã người dùng
   */
  async startConnection(token: string, userId: string): Promise<void> {
    if (this.hubConnection?.state === 'Connected' || this.hubConnection?.state === 'Connecting') return;

    if (!this.hubConnection) {
        this.hubConnection = new HubConnectionBuilder()
        .withUrl(`${this.getHubBaseUrl()}/hubs/notifications`, { accessTokenFactory: () => token })
        .configureLogging(import.meta.env.DEV ? LogLevel.Information : LogLevel.Warning)
        .withAutomaticReconnect()
        .build();

        this.hubConnection.on('NotificationReceived', (raw: Record<string, unknown>) => {
        const notification: INotificationDto = {
            id: String(raw.id ?? ''),
            userId: String(raw.userId ?? ''),
            title: String(raw.title ?? ''),
            message: String(raw.message ?? ''),
            notificationType: String(raw.notificationType ?? 'System'),
            isRead: Boolean(raw.isRead ?? false),
            createAt: String(raw.createAt ?? new Date().toISOString()),
            targetId: raw.targetId ? String(raw.targetId) : undefined,
        };
        this.callbacks.forEach(cb => cb(notification));
        });
    }

    try {
        if (this.hubConnection.state === 'Disconnected') {
            await this.hubConnection.start();
        }
        if (this.hubConnection.state === 'Connected') {
            await this.hubConnection.invoke('JoinUser', userId);
        }
    } catch {
        // Bỏ qua lỗi kết nối tạm thời
    }
  }

  /**
   * Ngắt kết nối SignalR thông báo và dọn dẹp kết nối.
   */
  async stopConnection(): Promise<void> {
    const connectionToStop = this.hubConnection;
    this.hubConnection = null;
    
    if (connectionToStop && connectionToStop.state !== 'Disconnected') {
        await connectionToStop.stop().catch(() => undefined);
    }
  }

  /**
   * Đăng ký callback lắng nghe khi có thông báo mới được gửi tới.
   * @param callback - Hàm xử lý khi nhận thông báo
   */
  onNotification(callback: (notification: INotificationDto) => void): void {
    this.callbacks.add(callback);
  }

  /**
   * Hủy đăng ký callback lắng nghe thông báo.
   * @param callback - Hàm callback cần hủy
   */
  offNotification(callback: (notification: INotificationDto) => void): void {
    this.callbacks.delete(callback);
  }
}

// Khởi tạo và xuất thể hiện duy nhất của NotificationRealtimeService
export const notificationRealtimeService = new NotificationRealtimeService();
