import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { httpClient } from './base/HttpClient';
import { ENV } from '../config/env';
import { API_ENDPOINTS } from '../config/endpoints';
import type { IApiResponse, IChatSession, IChatMessage, ICreateChatSessionRequest, ISellerOrderChatSummary, ICustomerChatSummary } from '../interfaces';

export type { ISellerOrderChatSummary, ICustomerChatSummary };

/**
 * Chuẩn hóa đối tượng tin nhắn thô từ SignalR / API về định dạng chuẩn IChatMessage (hỗ trợ cả camelCase và PascalCase).
 * @param raw - Object dữ liệu tin nhắn thô
 * @returns Đối tượng IChatMessage chuẩn hóa
 */
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

/**
 * Chuẩn hóa đối tượng phiên chat thô về định dạng chuẩn IChatSession.
 * @param raw - Object phiên chat thô
 * @returns Đối tượng IChatSession chuẩn hóa
 */
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

/**
 * Dịch vụ Trò chuyện Thời gian thực (ChatService).
 * Kết hợp API RESTful và kết nối SignalR Hub (`/hubs/chat`) để xử lý tin nhắn trực tiếp giữa:
 * - Khách hàng và Đội ngũ Hỗ trợ (Customer Support)
 * - Khách hàng và Người bán (Order Chat / Restaurant Chat)
 * - Điều phối viên và Quản trị viên
 */
class ChatService {
  private hubConnection: HubConnection | null = null;
  private handlersRegistered = false;
  private isStarting = false;
  private messageCallbacks = new Set<(message: IChatMessage) => void>();
  private newSessionCallbacks = new Set<(session: IChatSession) => void>();
  private supportJoinedCallbacks = new Set<(sessionId: string, supportId: string) => void>();
  private sessionClosedCallbacks = new Set<(sessionId: string) => void>();
  private orderChatCallbacks = new Set<(message: IChatMessage) => void>();
  private newOrderChatCallbacks = new Set<(session: IChatSession) => void>();

  /**
   * Lấy đường dẫn gốc của server để kết nối SignalR Hub.
   */
  private getHubBaseUrl(): string {
    return ENV.API_BASE_URL.replace(/\/api\/?$/i, '');
  }

  /**
   * Tạo một phiên chat hỗ trợ mới (Support Chat Session).
   * @param data - Dữ liệu yêu cầu tạo phiên chat
   */
  async createSession(data: ICreateChatSessionRequest): Promise<IApiResponse<IChatSession>> {
    const res = await httpClient.post<IApiResponse<IChatSession>>(API_ENDPOINTS.CHAT.CREATE_SESSION, data);
    if (res.data) {
      res.data = normalizeSession(res.data as unknown as Record<string, unknown>);
    }
    return res;
  }

  /**
   * Lấy lịch sử tin nhắn của một phiên chat theo ID (có hỗ trợ phân trang theo con trỏ before).
   * @param sessionId - Mã phiên chat
   * @param opts - Tùy chọn số lượng lấy (take) và mốc thời gian trước đó (before)
   */
  async getHistory(
    sessionId: string,
    opts?: { take?: number; before?: string }
  ): Promise<IApiResponse<{ items: IChatMessage[]; hasMore: boolean; nextBefore?: string | null }>> {
    const params: Record<string, string | number> = { t: Date.now() };
    if (opts?.take != null) params.take = opts.take;
    if (opts?.before) params.before = opts.before;

    const res = await httpClient.get<IApiResponse<any>>(API_ENDPOINTS.CHAT.GET_MESSAGES(sessionId), {
      params,
    });

    // Tương thích ngược: nếu API cũ trả về mảng tin nhắn thô
    if (Array.isArray(res.data)) {
      const items = res.data.map((m: unknown) => normalizeMessage(m as Record<string, unknown>));
      return {
        ...res,
        data: { items, hasMore: false, nextBefore: items[0]?.createdAt ?? null },
      };
    }

    if (res.data?.items && Array.isArray(res.data.items)) {
      res.data = {
        items: res.data.items.map((m: unknown) => normalizeMessage(m as Record<string, unknown>)),
        hasMore: !!res.data.hasMore,
        nextBefore: res.data.nextBefore ?? null,
      };
    } else if (res.data) {
      res.data = { items: [], hasMore: false, nextBefore: null };
    }

    return res;
  }

  /**
   * Lấy danh sách các phiên chat hỗ trợ đang mở (dành cho nhân viên hỗ trợ).
   */
  async getOpenSessions(): Promise<IApiResponse<IChatSession[]>> {
    const res = await httpClient.get<IApiResponse<IChatSession[]>>(`${API_ENDPOINTS.CHAT.GET_SESSIONS}?t=${Date.now()}`);
    if (res.data) {
      res.data = res.data.map(s => normalizeSession(s as unknown as Record<string, unknown>));
    }
    return res;
  }

  /**
   * Lấy danh sách toàn bộ các phiên chat của người dùng hiện tại.
   */
  async getUserSessions(): Promise<IApiResponse<IChatSession[]>> {
    const res = await httpClient.get<IApiResponse<IChatSession[]>>(`${API_ENDPOINTS.CHAT.GET_USER_SESSIONS}?t=${Date.now()}`);
    if (res.data) {
      res.data = res.data.map(s => normalizeSession(s as unknown as Record<string, unknown>));
    }
    return res;
  }

  /**
   * Lấy phiên chat hỗ trợ hiện tại đang hoạt động của người dùng (nếu có).
   */
  async getCurrentSession(): Promise<IApiResponse<IChatSession | null>> {
    const res = await httpClient.get<IApiResponse<IChatSession | null>>(`${API_ENDPOINTS.CHAT.GET_CURRENT_SESSION}?t=${Date.now()}`);
    if (res.data) {
      res.data = normalizeSession(res.data as unknown as Record<string, unknown>);
    }
    return res;
  }

  /**
   * Tạo hoặc lấy phiên chat trực tiếp theo đơn hàng (Order Chat giữa Khách và Người bán).
   * @param orderId - Mã đơn hàng
   */
  async createOrderSession(orderId: string): Promise<IApiResponse<IChatSession>> {
    const res = await httpClient.post<IApiResponse<IChatSession>>(API_ENDPOINTS.CHAT.CREATE_ORDER_SESSION(orderId), {});
    if (res.data) {
      res.data = normalizeSession(res.data as unknown as Record<string, unknown>);
    }
    return res;
  }

  /**
   * Tạo hoặc lấy phiên chat với một nhà hàng cụ thể.
   * @param restaurantId - Mã nhà hàng
   */
  async createRestaurantSession(restaurantId: string): Promise<IApiResponse<IChatSession>> {
    const res = await httpClient.post<IApiResponse<IChatSession>>(
      API_ENDPOINTS.CHAT.CREATE_RESTAURANT_SESSION(restaurantId),
      {}
    );
    if (res.data) {
      res.data = normalizeSession(res.data as unknown as Record<string, unknown>);
    }
    return res;
  }

  /**
   * Lấy danh sách tóm tắt các cuộc trò chuyện theo đơn hàng của Người bán.
   */
  async getSellerOrderChats(): Promise<IApiResponse<ISellerOrderChatSummary[]>> {
    return httpClient.get(API_ENDPOINTS.CHAT.GET_SELLER_ORDERS);
  }

  /**
   * Lấy danh sách tóm tắt tất cả các cuộc trò chuyện của Khách hàng với các nhà hàng/shop.
   */
  async getCustomerChats(): Promise<IApiResponse<ICustomerChatSummary[]>> {
    return httpClient.get(API_ENDPOINTS.CHAT.GET_CUSTOMER_CHATS);
  }

  /**
   * Đăng ký nhận tin nhắn trong hộp thư của nhà hàng (Seller Inbox) qua SignalR.
   * @param restaurantId - Mã nhà hàng
   */
  async joinSellerInbox(restaurantId: string): Promise<void> {
    await this.ensureConnected();
    await this.hubConnection!.invoke('JoinSellerInbox', restaurantId);
  }

  /**
   * Khởi tạo kết nối SignalR Hub với JWT token xác thực.
   * @param token - JWT access token
   */
  async startConnection(token: string): Promise<void> {
    if (this.hubConnection?.state === 'Connected') return;
    if (this.isStarting || this.hubConnection?.state === 'Connecting') {
      await this.waitForConnection();
      return;
    }

    const hubUrl = `${this.getHubBaseUrl()}/hubs/chat`;

    this.isStarting = true;
    if (this.hubConnection) {
      try { await this.hubConnection.stop(); } catch { /* bỏ qua */ }
      this.hubConnection = null;
      this.handlersRegistered = false;
    }

    this.hubConnection = new HubConnectionBuilder()
      .withUrl(hubUrl, { accessTokenFactory: () => token })
      .configureLogging(import.meta.env.DEV ? LogLevel.Information : LogLevel.Warning)
      .withAutomaticReconnect()
      .build();

    this.registerHubHandlers();

    try {
      await this.hubConnection.start();
    } catch (err) {
      console.error('[ChatService] startConnection FAILED:', err);
      this.hubConnection = null;
      this.handlersRegistered = false;
      throw err;
    } finally {
      this.isStarting = false;
    }
  }

  /**
   * Đăng ký các sự kiện lắng nghe từ SignalR Hub (nhận tin nhắn, mở phiên mới, hỗ trợ tham gia,...).
   */
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

    this.hubConnection.on('NewOrderChat', (raw: Record<string, unknown>) => {
      const session = normalizeSession(raw);
      this.newOrderChatCallbacks.forEach(cb => cb(session));
    });

    this.handlersRegistered = true;
  }

  /**
   * Chờ kết nối SignalR chuyển sang trạng thái 'Connected' trong khoảng thời gian timeout.
   */
  private async waitForConnection(timeoutMs = 10000): Promise<void> {
    const start = Date.now();
    while (this.hubConnection?.state !== 'Connected') {
      if (Date.now() - start > timeoutMs) {
        throw new Error('SignalR connection timeout');
      }
      if (!this.hubConnection && !this.isStarting) {
        throw new Error('SignalR connection was cancelled');
      }
      await new Promise(r => setTimeout(r, 100));
    }
  }

  /**
   * Đảm bảo kết nối SignalR đang hoạt động trước khi gọi hàm invoke.
   */
  private async ensureConnected(): Promise<void> {
    if (this.hubConnection?.state === 'Connected') return;
    if (this.hubConnection?.state === 'Connecting') {
      await this.waitForConnection();
      return;
    }
    throw new Error('SignalR is not connected');
  }

  /**
   * Ngắt kết nối SignalR Hub và giải phóng bộ nhớ.
   */
  async stopConnection(): Promise<void> {
    this.isStarting = false;
    if (this.hubConnection) {
      await this.hubConnection.stop();
      this.hubConnection = null;
      this.handlersRegistered = false;
    }
  }

  /**
   * Tham gia vào phòng chat của một phiên cụ thể để nhận tin nhắn.
   * @param sessionId - Mã phiên chat
   */
  async joinSession(sessionId: string): Promise<void> {
    await this.ensureConnected();
    await this.hubConnection!.invoke('JoinSession', sessionId);
  }

  /**
   * Rời khỏi phòng chat của một phiên.
   * @param sessionId - Mã phiên chat
   */
  async leaveSession(sessionId: string): Promise<void> {
    if (this.hubConnection?.state === 'Connected') {
      await this.hubConnection.invoke('LeaveSession', sessionId);
    }
  }

  /**
   * Gửi tin nhắn qua SignalR Hub tới một phiên chat.
   * @param sessionId - Mã phiên chat
   * @param senderId - ID người gửi
   * @param senderRole - Vai trò người gửi (Customer, Seller, Support,...)
   * @param content - Nội dung văn bản tin nhắn
   */
  async sendMessage(sessionId: string, senderId: string, senderRole: string, content: string): Promise<void> {
    await this.ensureConnected();
    await this.hubConnection!.invoke('SendMessage', sessionId, senderId, senderRole, content);
  }

  /**
   * Tiếp nhận phiên chat hỗ trợ (dành cho nhân viên CSKH).
   * @param sessionId - Mã phiên chat
   * @param supportId - ID nhân viên hỗ trợ
   */
  async claimSession(sessionId: string, supportId: string): Promise<void> {
    try {
      await httpClient.post(API_ENDPOINTS.CHAT.CLAIM_SESSION(sessionId), { supportId });
    } catch (error) {
      console.error('HTTP claimSession failed, falling back to SignalR', error);
    }
    await this.ensureConnected();
    await this.hubConnection!.invoke('ClaimSession', sessionId, supportId);
  }

  /**
   * Đóng một phiên chat hỗ trợ khi đã giải quyết xong.
   * @param sessionId - Mã phiên chat
   */
  async closeSession(sessionId: string): Promise<void> {
    await this.ensureConnected();
    await this.hubConnection!.invoke('CloseSession', sessionId);
  }

  /**
   * Tham gia nhóm SignalR của Điều phối viên (Coordinator Group).
   */
  async joinCoordinatorGroup(): Promise<void> {
    await this.ensureConnected();
    await this.hubConnection!.invoke('JoinCoordinatorGroup');
  }

  /**
   * Tham gia nhóm SignalR của Quản trị viên (Admin Group).
   */
  async joinAdminGroup(): Promise<void> {
    await this.ensureConnected();
    await this.hubConnection!.invoke('JoinAdminGroup');
  }

  /** Đăng ký callback khi nhận được tin nhắn mới */
  onReceiveMessage(callback: (message: IChatMessage) => void): void {
    this.messageCallbacks.add(callback);
  }

  /** Hủy đăng ký callback nhận tin nhắn mới */
  offReceiveMessage(callback: (message: IChatMessage) => void): void {
    this.messageCallbacks.delete(callback);
  }

  /** Đăng ký callback khi có phiên chat hỗ trợ mới được tạo */
  onNewSession(callback: (session: IChatSession) => void): void {
    this.newSessionCallbacks.add(callback);
  }

  /** Hủy đăng ký callback phiên chat mới */
  offNewSession(callback: (session: IChatSession) => void): void {
    this.newSessionCallbacks.delete(callback);
  }

  /** Đăng ký callback khi có nhân viên hỗ trợ tham gia phiên */
  onSupportJoined(callback: (sessionId: string, supportId: string) => void): void {
    this.supportJoinedCallbacks.add(callback);
  }

  /** Hủy callback nhân viên hỗ trợ tham gia */
  offSupportJoined(callback: (sessionId: string, supportId: string) => void): void {
    this.supportJoinedCallbacks.delete(callback);
  }

  /** Đăng ký callback khi phiên chat bị đóng */
  onSessionClosed(callback: (sessionId: string) => void): void {
    this.sessionClosedCallbacks.add(callback);
  }

  /** Hủy callback đóng phiên */
  offSessionClosed(callback: (sessionId: string) => void): void {
    this.sessionClosedCallbacks.delete(callback);
  }

  /** Đăng ký callback khi nhận được tin nhắn chat theo đơn hàng */
  onOrderChatMessage(callback: (message: IChatMessage) => void): void {
    this.orderChatCallbacks.add(callback);
  }

  /** Hủy callback tin nhắn chat theo đơn hàng */
  offOrderChatMessage(callback: (message: IChatMessage) => void): void {
    this.orderChatCallbacks.delete(callback);
  }

  /** Đăng ký callback khi có phiên chat theo đơn hàng mới */
  onNewOrderChat(callback: (session: IChatSession) => void): void {
    this.newOrderChatCallbacks.add(callback);
  }

  /** Hủy callback phiên chat theo đơn hàng mới */
  offNewOrderChat(callback: (session: IChatSession) => void): void {
    this.newOrderChatCallbacks.delete(callback);
  }
}

// Khởi tạo và xuất thể hiện duy nhất của ChatService
export const chatService = new ChatService();
