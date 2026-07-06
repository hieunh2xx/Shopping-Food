import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { ENV } from '../config/env';
import type { INotificationDto } from '../interfaces';

class NotificationRealtimeService {
  private hubConnection: HubConnection | null = null;
  private callbacks = new Set<(notification: INotificationDto) => void>();

  private getHubBaseUrl(): string {
    return ENV.API_BASE_URL.replace(/\/api\/?$/i, '');
  }

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
        // Ignore
    }
  }

  async stopConnection(): Promise<void> {
    const connectionToStop = this.hubConnection;
    this.hubConnection = null; // Clear synchronously to avoid React strict mode race conditions
    
    if (connectionToStop && connectionToStop.state !== 'Disconnected') {
        await connectionToStop.stop().catch(() => undefined);
    }
  }

  onNotification(callback: (notification: INotificationDto) => void): void {
    this.callbacks.add(callback);
  }

  offNotification(callback: (notification: INotificationDto) => void): void {
    this.callbacks.delete(callback);
  }
}

export const notificationRealtimeService = new NotificationRealtimeService();
