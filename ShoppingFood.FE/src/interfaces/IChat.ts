export type ChatSessionStatus = 'Open' | 'Closed';
export type ChatTopic = 'OrderIssue' | 'SystemIssue' | 'General';
export type UserRole = 'Customer' | 'Seller' | 'Shipper' | 'Admin' | 'Coordinator';

export interface IChatSession {
  id: string;
  userId: string;
  supportId?: string;
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
