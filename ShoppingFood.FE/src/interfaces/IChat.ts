export type ChatSessionStatus = 'Open' | 'Closed';
export type ChatTopic = 'OrderIssue' | 'OrderCancellation' | 'SystemIssue' | 'General';
export type UserRole = 'Customer' | 'Seller' | 'Shipper' | 'Admin' | 'Coordinator';

export interface IChatSession {
  id: string;
  userId: string;
  supportId?: string;
  orderId?: string;
  restaurantId?: string;
  topic: ChatTopic;
  status: ChatSessionStatus;
  createdAt: string;
  closedAt?: string;
  messages: IChatMessage[];
}

export interface IChatMessage {
  id: string;
  sessionId: string;
  senderId: string;
  senderRole: UserRole;
  content: string;
  createdAt: string;
}

export interface ICreateChatSessionRequest {
  topic: ChatTopic;
}
