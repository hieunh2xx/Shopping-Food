export type ChatSessionStatus = 'Open' | 'Closed';
export type ChatTopic = 'OrderIssue' | 'OrderCancellation' | 'SystemIssue' | 'General';
export type UserRole = 'Customer' | 'Seller' | 'Shipper' | 'Admin' | 'Coordinator' | 'Mall';

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

export interface ISellerOrderChatSummary {
  id: string;
  userId: string;
  customerName?: string;
  orderId?: string;
  relatedOrderIds?: string[];
  restaurantId?: string;
  topic: string;
  status: string;
  createdAt: string;
  lastMessage?: string;
  lastMessageAt?: string;
}

export interface ICustomerChatSummary {
  id: string;
  userId: string;
  orderId?: string;
  relatedOrderIds?: string[];
  relatedSessionIds?: string[];
  restaurantId?: string;
  restaurantName?: string;
  topic: string;
  status: string;
  createdAt: string;
  lastMessage?: string;
  lastMessageAt?: string;
  lastSenderRole?: string;
}
