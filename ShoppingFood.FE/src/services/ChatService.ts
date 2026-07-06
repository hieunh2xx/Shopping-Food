import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { httpClient } from './base/HttpClient';
import { ENV } from '../config/env';
import type { IApiResponse, IChatSession, IChatMessage, ICreateChatSessionRequest } from '../interfaces';

function normalizeMessage(raw: Record<string, unknown>): IChatMessage {
  return {
    id: String(raw.id ?? raw.Id ?? ''),
    sessionId: String(raw.sessionId ?? raw.SessionId ?? ''),
    senderId: String(raw.senderId ?? raw.SenderId ?? ''),
    senderRole: (raw.senderRole ?? raw.SenderRole ?? 'Customer') as IChatMessage['senderRole'],
    content: String(raw.content ?? raw.Content ?? ''),
    createdAt: String(raw.createdAt ?? raw.CreatedAt ?? new Date().toISOString()),
  };
}

function normalizeSession(raw: Record<string, unknown>): IChatSession {
  const messages = (raw.messages ?? raw.Messages ?? []) as Record<string, unknown>[];
  return {
    id: String(raw.id ?? raw.Id ?? ''),
    userId: String(raw.userId ?? raw.UserId ?? ''),
    supportId: raw.supportId != null || raw.SupportId != null
      ? String(raw.supportId ?? raw.SupportId)
      : undefined,
    orderId: raw.orderId != null || raw.OrderId != null
      ? String(raw.orderId ?? raw.OrderId)
      : undefined,
    restaurantId: raw.restaurantId != null || raw.RestaurantId != null
      ? String(raw.restaurantId ?? raw.RestaurantId)
      : undefined,
    topic: (raw.topic ?? raw.Topic ?? 'General') as IChatSession['topic'],
    status: (raw.status ?? raw.Status ?? 'Open') as IChatSession['status'],
    createdAt: String(raw.createdAt ?? raw.CreatedAt ?? new Date().toISOString()),
    closedAt: raw.closedAt != null || raw.ClosedAt != null
      ? String(raw.closedAt ?? raw.ClosedAt)
      : undefined,
    messages: Array.isArray(messages) ? messages.map(m => normalizeMessage(m)) : [],
  };
}

class ChatService {
  private hubConnection: HubConnection | null = null;
  private handlersRegistered = false;
  private endpoint = '/Chat';
  private messageCallbacks = new Set<(message: IChatMessage) => void>();
  private newSessionCallbacks = new Set<(session: IChatSession) => void>();
  private supportJoinedCallbacks = new Set<(sessionId: string, supportId: string) => void>();
  private sessionClosedCallbacks = new Set<(sessionId: string) => void>();
  private orderChatCallbacks = new Set<(message: IChatMessage) => void>();

  private getHubBaseUrl(): string {
    return ENV.API_BASE_URL.replace(/\/api\/?$/i, '');
  }

  async createSession(data: ICreateChatSessionRequest): Promise<IApiResponse<IChatSession>> {
    const res = await httpClient.post<IApiResponse<IChatSession>>(`${this.endpoint}/sessions`, data);
    if (res.data) {
      res.data = normalizeSession(res.data as unknown as Record<string, unknown>);
    }
    return res;
  }

  async getHistory(sessionId: string): Promise<IApiResponse<IChatMessage[]>> {
    const res = await httpClient.get<IApiResponse<IChatMessage[]>>(`${this.endpoint}/sessions/${sessionId}/messages`);
    if (res.data) {
      res.data = res.data.map(m => normalizeMessage(m as unknown as Record<string, unknown>));
    }
    return res;
  }

  async getOpenSessions(): Promise<IApiResponse<IChatSession[]>> {
    const res = await httpClient.get<IApiResponse<IChatSession[]>>(`${this.endpoint}/sessions`);
    if (res.data) {
      res.data = res.data.map(s => normalizeSession(s as unknown as Record<string, unknown>));
    }
    return res;
  }

  async getCurrentSession(): Promise<IApiResponse<IChatSession | null>> {
    const res = await httpClient.get<IApiResponse<IChatSession | null>>(`${this.endpoint}/sessions/current`);
    if (res.data) {
      res.data = normalizeSession(res.data as unknown as Record<string, unknown>);
    }
    return res;
  }

  async createOrderSession(orderId: string): Promise<IApiResponse<IChatSession>> {
    const res = await httpClient.post<IApiResponse<IChatSession>>(`${this.endpoint}/sessions/order/${orderId}`, {});
    if (res.data) {
      res.data = normalizeSession(res.data as unknown as Record<string, unknown>);
    }
    return res;
  }

  async getSellerOrderChats(): Promise<IApiResponse<ISellerOrderChatSummary[]>> {
    return httpClient.get(`${this.endpoint}/sessions/seller/orders`);
  }

  async joinSellerInbox(restaurantId: string): Promise<void> {
    await this.ensureConnected();
    await this.hubConnection!.invoke('JoinSellerInbox', restaurantId);
  }

  async startConnection(token: string): Promise<void> {
    if (this.hubConnection?.state === 'Connected') return;

    if (this.hubConnection?.state === 'Connecting') {
      await this.waitForConnection();
      return;
    }

    const hubUrl = `${this.getHubBaseUrl()}/hubs/chat`;

    this.hubConnection = new HubConnectionBuilder()
      .withUrl(hubUrl, { accessTokenFactory: () => token })
      .configureLogging(import.meta.env.DEV ? LogLevel.Information : LogLevel.Warning)
      .withAutomaticReconnect()
      .build();

    this.registerHubHandlers();

    await this.hubConnection.start();
  }

  private registerHubHandlers(): void {
    if (!this.hubConnection || this.handlersRegistered) return;

    this.hubConnection.on('ReceiveMessage', (raw: Record<string, unknown>) => {
      const message = normalizeMessage(raw);
      this.messageCallbacks.forEach(cb => cb(message));
    });

    this.hubConnection.on('NewSession', (raw: Record<string, unknown>) => {
      const session = normalizeSession(raw);
      this.newSessionCallbacks.forEach(cb => cb(session));
    });

    this.hubConnection.on('SupportJoined', (sessionId: string, supportId: string) => {
      this.supportJoinedCallbacks.forEach(cb => cb(sessionId, supportId));
    });

    this.hubConnection.on('SessionClosed', (sessionId: string) => {
      this.sessionClosedCallbacks.forEach(cb => cb(sessionId));
    });

    this.hubConnection.on('OrderChatMessage', (raw: Record<string, unknown>) => {
      const message = normalizeMessage(raw);
      this.orderChatCallbacks.forEach(cb => cb(message));
      this.messageCallbacks.forEach(cb => cb(message));
    });

    this.handlersRegistered = true;
  }

  private async waitForConnection(timeoutMs = 10000): Promise<void> {
    const start = Date.now();
    while (this.hubConnection?.state !== 'Connected') {
      if (Date.now() - start > timeoutMs) {
        throw new Error('SignalR connection timeout');
      }
      await new Promise(r => setTimeout(r, 100));
    }
  }

  private async ensureConnected(): Promise<void> {
    if (this.hubConnection?.state === 'Connected') return;
    if (this.hubConnection?.state === 'Connecting') {
      await this.waitForConnection();
      return;
    }
    throw new Error('SignalR is not connected');
  }

  async stopConnection(): Promise<void> {
    if (this.hubConnection) {
      await this.hubConnection.stop();
      this.hubConnection = null;
      this.handlersRegistered = false;
    }
  }

  async joinSession(sessionId: string): Promise<void> {
    await this.ensureConnected();
    await this.hubConnection!.invoke('JoinSession', sessionId);
  }

  async leaveSession(sessionId: string): Promise<void> {
    if (this.hubConnection?.state === 'Connected') {
      await this.hubConnection.invoke('LeaveSession', sessionId);
    }
  }

  async sendMessage(sessionId: string, senderId: string, senderRole: string, content: string): Promise<void> {
    await this.ensureConnected();
    await this.hubConnection!.invoke('SendMessage', sessionId, senderId, senderRole, content);
  }

  async claimSession(sessionId: string, supportId: string): Promise<void> {
    try {
      await httpClient.post(`${this.endpoint}/sessions/${sessionId}/claim`, { supportId });
    } catch (err) {
      console.error('HTTP claimSession failed, falling back to SignalR', err);
    }
    await this.ensureConnected();
    await this.hubConnection!.invoke('ClaimSession', sessionId, supportId);
  }

  async closeSession(sessionId: string): Promise<void> {
    await this.ensureConnected();
    await this.hubConnection!.invoke('CloseSession', sessionId);
  }

  async joinSupportGroup(): Promise<void> {
    await this.ensureConnected();
    await this.hubConnection!.invoke('JoinSupportGroup');
  }

  onReceiveMessage(callback: (message: IChatMessage) => void): void {
    this.messageCallbacks.add(callback);
  }

  offReceiveMessage(callback: (message: IChatMessage) => void): void {
    this.messageCallbacks.delete(callback);
  }

  onNewSession(callback: (session: IChatSession) => void): void {
    this.newSessionCallbacks.add(callback);
  }

  offNewSession(callback: (session: IChatSession) => void): void {
    this.newSessionCallbacks.delete(callback);
  }

  onSupportJoined(callback: (sessionId: string, supportId: string) => void): void {
    this.supportJoinedCallbacks.add(callback);
  }

  offSupportJoined(callback: (sessionId: string, supportId: string) => void): void {
    this.supportJoinedCallbacks.delete(callback);
  }

  onSessionClosed(callback: (sessionId: string) => void): void {
    this.sessionClosedCallbacks.add(callback);
  }

  offSessionClosed(callback: (sessionId: string) => void): void {
    this.sessionClosedCallbacks.delete(callback);
  }

  onOrderChatMessage(callback: (message: IChatMessage) => void): void {
    this.orderChatCallbacks.add(callback);
  }

  offOrderChatMessage(callback: (message: IChatMessage) => void): void {
    this.orderChatCallbacks.delete(callback);
  }
}

export interface ISellerOrderChatSummary {
  id: string;
  userId: string;
  customerName?: string;
  orderId?: string;
  restaurantId?: string;
  topic: string;
  status: string;
  createdAt: string;
  lastMessage?: string;
  lastMessageAt?: string;
}

export const chatService = new ChatService();
