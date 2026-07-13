import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageSquare, Send, Loader2, X, RefreshCw, ChevronLeft } from 'lucide-react';
import { useAuth } from '../../hooks';
import { chatService } from '../../services/ChatService';
import type { ISellerOrderChatSummary } from '../../services/ChatService';
import type { IChatMessage } from '../../interfaces';

interface ISellerOrderChatSummaryLocal extends ISellerOrderChatSummary {
  hasUnread?: boolean;
}
import toast from 'react-hot-toast';

export function SellerChatPage() {
  const { user, token } = useAuth();
  const [sessions, setSessions] = useState<ISellerOrderChatSummaryLocal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState<ISellerOrderChatSummaryLocal | null>(null);
  const [messages, setMessages] = useState<IChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleReceive = useCallback((message: IChatMessage) => {
    if (!activeSession || message.sessionId !== activeSession.id) {
      // Tin mới từ session khác — reload danh sách
      setSessions(prev =>
        prev.map(s =>
          s.id === message.sessionId
            ? { ...s, lastMessage: message.content, lastMessageAt: message.createdAt, hasUnread: true }
            : s
        )
      );
      return;
    }
    setMessages(prev => {
      if (prev.some(m => m.id === message.id)) return prev;
      return [...prev, message];
    });
  }, [activeSession]);

  useEffect(() => {
    if (!token) return;
    fetchSessions();
  }, [token]);

  useEffect(() => {
    if (!token) return;
    chatService.startConnection(token).catch(() => {});
    chatService.onReceiveMessage(handleReceive);
    chatService.onOrderChatMessage(handleReceive);
    return () => {
      chatService.offReceiveMessage(handleReceive);
      chatService.offOrderChatMessage(handleReceive);
    };
  }, [token, handleReceive]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await chatService.getSellerOrderChats();
      if (!res.error && res.data) {
        const storedLastRead = localStorage.getItem('seller_chat_last_read');
        let lastReadTimes: Record<string, string> = {};
        try {
          if (storedLastRead) lastReadTimes = JSON.parse(storedLastRead);
        } catch {
          lastReadTimes = {};
        }

        const formatted = (res.data as ISellerOrderChatSummaryLocal[]).map(s => {
          const lastRead = lastReadTimes[s.id];
          if (!s.lastMessageAt) return s;
          
          const msgDateStr = String(s.lastMessageAt);
          const msgDate = msgDateStr.endsWith('Z') ? new Date(msgDateStr) : new Date(msgDateStr + 'Z');
          const isUnread = !lastRead || msgDate > new Date(lastRead);
          
          return { ...s, hasUnread: isUnread };
        });

        setSessions(formatted);
      }
    } catch {
      toast.error('Không thể tải danh sách tin nhắn');
    } finally {
      setLoading(false);
    }
  };

  const openSession = async (session: ISellerOrderChatSummary) => {
    if (activeSession?.id === session.id) return;

    // Rời session cũ
    if (activeSession) {
      await chatService.leaveSession(activeSession.id).catch(() => {});
    }

    setActiveSession(session);
    setSessions(prev => prev.map(s => s.id === session.id ? { ...s, hasUnread: false } : s));
    
    // Đánh dấu đã đọc
    const storedLastRead = localStorage.getItem('seller_chat_last_read');
    let lastReadTimes: Record<string, string> = {};
    try {
      if (storedLastRead) lastReadTimes = JSON.parse(storedLastRead);
    } catch {
      lastReadTimes = {};
    }
    lastReadTimes[session.id] = new Date().toISOString();
    localStorage.setItem('seller_chat_last_read', JSON.stringify(lastReadTimes));
    window.dispatchEvent(new Event('seller_chat_read_updated'));

    setChatLoading(true);
    setMessages([]);
    try {
      if (user?.restaurantId || session.restaurantId) {
        await chatService.joinSellerInbox(session.restaurantId || user?.restaurantId || '');
      }
      await chatService.joinSession(session.id);
      const history = await chatService.getHistory(session.id);
      if (!history.error && history.data) {
        setMessages(history.data);
      }
    } catch {
      toast.error('Không thể mở phiên chat');
    } finally {
      setChatLoading(false);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || !activeSession || !user || !token) return;
    const content = inputText.trim();
    setInputText('');
    setSending(true);
    try {
      await chatService.sendMessage(activeSession.id, user.id, user.role, content);
    } catch {
      toast.error('Gửi tin nhắn thất bại');
      setInputText(content);
    } finally {
      setSending(false);
    }
  };

  const formatOrderId = (orderId?: string) =>
    orderId ? `#${orderId.substring(0, 8).toUpperCase()}` : 'Không có mã';

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-white rounded-2xl shadow overflow-hidden border border-gray-100">
      {/* Sidebar danh sách */}
      <div className="w-80 flex-shrink-0 border-r border-gray-100 flex flex-col">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-orange-500" />
            <h2 className="font-semibold text-gray-800">Hộp thư</h2>
          </div>
          <button
            onClick={fetchSessions}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            title="Làm mới"
          >
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-orange-400" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <MessageSquare className="w-12 h-12 text-gray-200 mb-3" />
              <p className="text-gray-400 text-sm">Chưa có cuộc hội thoại nào</p>
            </div>
          ) : (
            sessions.map(session => {
              const isActive = activeSession?.id === session.id;
              return (
                <button
                  key={session.id}
                  onClick={() => openSession(session)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-50 transition-colors flex flex-col gap-1 ${
                    isActive
                      ? 'bg-orange-50 border-l-4 border-l-orange-500'
                      : session.hasUnread
                        ? 'bg-red-50 border-l-4 border-l-red-500 animate-pulse'
                        : 'hover:bg-orange-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-gray-800">
                        Đơn {formatOrderId(session.orderId)}
                      </span>
                      {session.hasUnread && (
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-bounce"></span>
                      )}
                    </div>
                    {session.lastMessageAt && (
                      <span className="text-xs text-gray-400">{formatTime(session.lastMessageAt)}</span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500 truncate">
                    {session.customerName || 'Khách hàng'}
                  </span>
                  {session.lastMessage && (
                    <span className="text-xs text-gray-400 truncate">{session.lastMessage}</span>
                  )}
                  <span className={`text-xs font-medium ${session.status === 'Open' ? 'text-green-600' : 'text-gray-400'}`}>
                    {session.status === 'Open' ? '● Đang mở' : '● Đã đóng'}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Khu vực chat */}
      <div className="flex-1 flex flex-col">
        {!activeSession ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-gray-400">
            <MessageSquare className="w-16 h-16 text-gray-200 mb-4" />
            <p className="text-lg font-medium text-gray-500">Chọn một cuộc hội thoại</p>
            <p className="text-sm mt-1">Chọn đơn hàng bên trái để xem và trả lời tin nhắn</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3 bg-white">
              <button
                onClick={() => setActiveSession(null)}
                className="md:hidden p-1.5 rounded-lg hover:bg-gray-100"
              >
                <ChevronLeft className="w-5 h-5 text-gray-500" />
              </button>
              <div>
                <p className="font-semibold text-gray-800">
                  Đơn {formatOrderId(activeSession.orderId)}
                </p>
                <p className="text-xs text-gray-500">{activeSession.customerName || 'Khách hàng'}</p>
              </div>
              <div className="ml-auto">
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  activeSession.status === 'Open'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {activeSession.status === 'Open' ? 'Đang mở' : 'Đã đóng'}
                </span>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50">
              {chatLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-orange-400" />
                </div>
              ) : messages.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-8">Chưa có tin nhắn nào.</p>
              ) : (
                messages.map(m => {
                  const mine = m.senderId === user?.id;
                  return (
                    <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                        mine
                          ? 'bg-orange-500 text-white rounded-br-sm'
                          : 'bg-white text-gray-800 rounded-bl-sm border border-gray-100'
                      }`}>
                        {!mine && (
                          <p className="text-xs font-semibold text-orange-500 mb-0.5">
                            {m.senderRole === 'Customer' ? 'Khách hàng' : m.senderRole}
                          </p>
                        )}
                        <p className="leading-relaxed">{m.content}</p>
                        <p className={`text-xs mt-1 ${mine ? 'text-orange-100' : 'text-gray-400'}`}>
                          {formatTime(m.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            {activeSession.status === 'Closed' ? (
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 text-center text-sm text-gray-400 italic">
                Phiên chat này đã kết thúc
              </div>
            ) : (
              <div className="px-4 py-3 border-t border-gray-100 bg-white flex gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder="Nhập tin nhắn trả lời..."
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/40"
                  disabled={sending}
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={sending || !inputText.trim()}
                  className="p-2.5 rounded-xl bg-orange-500 text-white disabled:opacity-50 hover:bg-orange-600 transition-colors"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
