export interface INotificationDto {
  id: string;
  userId: string;
  title: string;
  message: string;
  notificationType: string;
  isRead: boolean;
  createAt: string;
  targetId?: string;
}
