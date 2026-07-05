import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { httpClient } from './base/HttpClient';
import { API_ENDPOINTS } from '../config/endpoints';
import type { IApiResponse, IChatSession, IChatMessage, ICreateChatSessionRequest } from '../interfaces';

class ChatService {
  private hubConnection: HubConnection | null = null;
  private endpoint = '/Chat';

  // --- API Methods ---
  
  async createSession(data: ICreateChatSessionRequest): Promise<IApiResponse<IChatSession>> {
    return httpClient.post<IApiResponse<IChatSession>>(`${this.endpoint}/sessions`, data);
  }

  async getHistory(sessionId: string): Promise<IApiResponse<IChatMessage[]>> {
    return httpClient.get<IApiResponse<IChatMessage[]>>(`${this.endpoint}/sessions/${sessionId}/messages`);
  }

  // Admin / Coordinator API 
  async getOpenSessions(): Promise<IApiResponse<IChatSession[]>> {
    // Note: Assuming there is a GET /api/Chat/sessions API for admin. 
    // If not, we might need to adjust this. Let's assume it exists for now based on standard REST.
    return httpClient.get<IApiResponse<IChatSession[]>>(`${this.endpoint}/sessions`);
  }

  async getCurrentSession(): Promise<IApiResponse<IChatSession | null>> {
    return httpClient.get<IApiResponse<IChatSession | null>>(`${this.endpoint}/sessions/current`);
  }

  // --- SignalR Hub Management ---

  async startConnection(token: string): Promise<void> {
    if (this.hubConnection && this.hubConnection.state === 'Connected') {
      return;
    }

    const baseUrl = import.meta.env.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL.replace(/\/api\/?$/, '') : 'https://localhost:7008';
    const hubUrl = `${baseUrl}/hubs/chat`;
    
    this.hubConnection = new HubConnectionBuilder()
      .withUrl(hubUrl, { accessTokenFactory: () => token })
      .configureLogging(LogLevel.Information)
      .withAutomaticReconnect()
      .build();

    try {
      await this.hubConnection.start();
      console.log('SignalR Connected.');
    } catch (err) {
      console.error('SignalR Connection Error: ', err);
    }
  }

  async stopConnection(): Promise<void> {
    if (this.hubConnection) {
      await this.hubConnection.stop();
      this.hubConnection = null;
    }
  }

  async joinSession(sessionId: string): Promise<void> {
    if (this.hubConnection?.state === 'Connected') {
      await this.hubConnection.invoke('JoinSession', sessionId);
    }
  }

  async leaveSession(sessionId: string): Promise<void> {
    if (this.hubConnection?.state === 'Connected') {
      await this.hubConnection.invoke('LeaveSession', sessionId);
    }
  }

  async sendMessage(sessionId: string, senderId: string, senderRole: string, content: string): Promise<void> {
    if (this.hubConnection?.state === 'Connected') {
      await this.hubConnection.invoke('SendMessage', sessionId, senderId, senderRole, content);
    } else {
      throw new Error("SignalR is not connected");
    }
  }

  async claimSession(sessionId: string, supportId: string): Promise<void> {
    try {
      await httpClient.post(`${this.endpoint}/sessions/${sessionId}/claim`, { supportId });
    } catch (err) {
      console.error("HTTP claimSession failed, falling back to SignalR", err);
    }
    if (this.hubConnection?.state === 'Connected') {
      await this.hubConnection.invoke('ClaimSession', sessionId, supportId);
    }
  }

  async closeSession(sessionId: string): Promise<void> {
    if (this.hubConnection?.state === 'Connected') {
      await this.hubConnection.invoke('CloseSession', sessionId);
    }
  }

  async joinSupportGroup(): Promise<void> {
    if (this.hubConnection?.state === 'Connected') {
      await this.hubConnection.invoke('JoinSupportGroup');
    }
  }

  // --- SignalR Event Listeners ---

  onReceiveMessage(callback: (message: IChatMessage) => void): void {
    this.hubConnection?.on('ReceiveMessage', callback);
  }

  offReceiveMessage(callback: (message: IChatMessage) => void): void {
    this.hubConnection?.off('ReceiveMessage', callback);
  }

  onNewSession(callback: (session: IChatSession) => void): void {
    this.hubConnection?.on('NewSession', callback);
  }

  offNewSession(callback: (session: IChatSession) => void): void {
    this.hubConnection?.off('NewSession', callback);
  }

  onSupportJoined(callback: (sessionId: string, supportId: string) => void): void {
    this.hubConnection?.on('SupportJoined', callback);
  }

  offSupportJoined(callback: (sessionId: string, supportId: string) => void): void {
    this.hubConnection?.off('SupportJoined', callback);
  }

  onSessionClosed(callback: (sessionId: string) => void): void {
    this.hubConnection?.on('SessionClosed', callback);
  }

  offSessionClosed(callback: (sessionId: string) => void): void {
    this.hubConnection?.off('SessionClosed', callback);
  }
}

export const chatService = new ChatService();
