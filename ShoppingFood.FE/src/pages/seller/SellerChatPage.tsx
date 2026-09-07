import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MessageSquare, Send, Loader2, RefreshCw, ChevronLeft } from 'lucide-react';
import { useAuth } from '../../hooks';
import { chatService } from '../../services/ChatService';
import type { ISellerOrderChatSummary } from '../../services/ChatService';
import type { IChatMessage } from '../../interfaces';
import toast from 'react-hot-toast';

interface ISellerOrderChatSummaryLocal extends ISellerOrderChatSummary {
  hasUnread?: boolean;
}

/**
 * Trang Trò Chuyện Trực Tiếp Dành Cho Người Bán (SellerChatPage).
 * Hỗ trợ chủ quán kết nối nhanh với khách hàng theo từng phiên / đơn hàng:
 * - Danh sách cuộc trò chuyện theo đơn hàng kèm chỉ báo tin nhắn mới chưa đọc
 * - Khung chat trực tiếp SignalR Realtime hỗ trợ cuộn tải thêm lịch sử tin nhắn
 * - Hỗ trợ liên kết trực tiếp (Deep link) từ trang đơn hàng qua query `orderId` hoặc `sessionId`.
 */
export function SellerChatPage() {
  const { user, token } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [sessions, setSessions] = useState<ISellerOrderChatSummaryLocal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState<ISellerOrderChatSummaryLocal | null>(null);
  const [messages, setMessages] = useState<IChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [nextBefore, setNextBefore] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const deepLinkHandledRef = useRef(false);
  const loadingMoreRef = useRef(false);


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

  const restaurantId = user?.sellerInfo?.restaurantId;

  useEffect(() => {
    if (!token) return;
    fetchSessions();
  }, [token]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    const setup = async () => {
      try {
        await chatService.startConnection(token);
        if (!cancelled && restaurantId) {
          await chatService.joinSellerInbox(restaurantId);
        }
      } catch {
        // hub connect optional for REST list
      }
    };
    setup();

    const onNewOrderChat = () => {
      fetchSessions();
    };

    chatService.onReceiveMessage(handleReceive);
    chatService.onOrderChatMessage(handleReceive);
    chatService.onNewOrderChat(onNewOrderChat);
    return () => {
      cancelled = true;
      chatService.offReceiveMessage(handleReceive);
      chatService.offOrderChatMessage(handleReceive);
      chatService.offNewOrderChat(onNewOrderChat);
    };
  }, [token, restaurantId, handleReceive]);

  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    // Chỉ auto-scroll khi đang ở gần đáy (tin mới), không nhảy khi tải tin cũ phía trên
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distanceFromBottom < 120) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }
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
        return formatted;
      }
    } catch {
      toast.error('Không thể tải danh sách tin nhắn');
    } finally {
      setLoading(false);
    }
    return [] as ISellerOrderChatSummaryLocal[];
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
    setHasMoreMessages(false);
    setNextBefore(null);
    try {
      const rid = session.restaurantId || restaurantId;
      if (rid) {
        await chatService.joinSellerInbox(rid);
      }
      await chatService.joinSession(session.id);
      const history = await chatService.getHistory(session.id, { take: 20 });
      if (!history.error && history.data) {
        setMessages(history.data.items);
        setHasMoreMessages(!!history.data.hasMore);
        setNextBefore(history.data.nextBefore ?? null);
        requestAnimationFrame(() => {
          const box = messagesContainerRef.current;
          if (box) box.scrollTop = box.scrollHeight;
        });
      }
    } catch {
      toast.error('Không thể mở phiên chat');
    } finally {
      setChatLoading(false);
    }
  };

  const loadOlderMessages = useCallback(async () => {
    if (!activeSession || !hasMoreMessages || !nextBefore || loadingMoreRef.current) return;
    const el = messagesContainerRef.current;
    const prevHeight = el?.scrollHeight ?? 0;
    const prevTop = el?.scrollTop ?? 0;

    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const history = await chatService.getHistory(activeSession.id, {
        take: 20,
        before: nextBefore,
      });
      if (!history.error && history.data?.items?.length) {
        setMessages((prev) => {
          const existing = new Set(prev.map((m) => m.id));
          const older = history.data!.items.filter((m) => !existing.has(m.id));
          return [...older, ...prev];
        });
        setHasMoreMessages(!!history.data.hasMore);
        setNextBefore(history.data.nextBefore ?? null);
        requestAnimationFrame(() => {
          const box = messagesContainerRef.current;
          if (!box) return;
          box.scrollTop = box.scrollHeight - prevHeight + prevTop;
        });
      } else {
        setHasMoreMessages(false);
      }
    } catch {
      // silent
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [activeSession, hasMoreMessages, nextBefore]);

  const handleMessagesScroll = useCallback(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    if (el.scrollTop <= 48) {
      void loadOlderMessages();
    }
  }, [loadOlderMessages]);

  // Deep-link từ thông báo: ?orderId=...
  useEffect(() => {
    if (loading || deepLinkHandledRef.current) return;
    const orderId = searchParams.get('orderId');
    if (!orderId || sessions.length === 0) return;

    const match = sessions.find(
      s =>
        s.orderId === orderId ||
        s.orderId?.toLowerCase().startsWith(orderId.toLowerCase().slice(0, 8)) ||
        (s.relatedOrderIds || []).some(
          (id) => id === orderId || id.toLowerCase().startsWith(orderId.toLowerCase().slice(0, 8))
        )
    );
    deepLinkHandledRef.current = true;
    if (match) {
      void openSession(match);
    }
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('orderId');
      return next;
    }, { replace: true });
  }, [loading, sessions, searchParams]);

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
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-semibold text-sm text-gray-800 truncate">
                        {session.customerName || 'Khách hàng'}
                      </span>
                      {session.hasUnread && (
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-bounce shrink-0"></span>
                      )}
                    </div>
                    {session.lastMessageAt && (
                      <span className="text-xs text-gray-400 shrink-0">{formatTime(session.lastMessageAt)}</span>
                    )}
                  </div>
                  {session.orderId && (
                    <span className="text-xs text-orange-600 font-medium">
                      Đơn {formatOrderId(session.orderId)}
                      {(session.relatedOrderIds?.length || 0) > 1 ? ` · ${(session.relatedOrderIds!.length)} đơn` : ''}
                    </span>
                  )}
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
                  {activeSession.customerName || 'Khách hàng'}
                </p>
                <p className="text-xs text-gray-500">
                  {formatOrderId(activeSession.orderId)
                    ? `Đơn ${formatOrderId(activeSession.orderId)}`
                    : 'Chat cửa hàng'}
                </p>
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
            <div
              ref={messagesContainerRef}
              onScroll={handleMessagesScroll}
              className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50"
            >
              {chatLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-orange-400" />
                </div>
              ) : messages.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-8">Chưa có tin nhắn nào.</p>
              ) : (
                <>
                  {(loadingMore || hasMoreMessages) && (
                    <div className="flex justify-center py-2">
                      {loadingMore ? (
                        <Loader2 className="w-4 h-4 animate-spin text-orange-400" />
                      ) : (
                        <button
                          type="button"
                          onClick={() => void loadOlderMessages()}
                          className="text-xs text-slate-500 hover:text-orange-600"
                        >
                          Tải tin nhắn cũ hơn
                        </button>
                      )}
                    </div>
                  )}
                  {messages.map(m => {
                  const mine = m.senderId?.toLowerCase() === user?.id?.toLowerCase();
                  return (
                    <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                        mine
                          ? 'bg-orange-600 text-white rounded-br-sm'
                          : 'bg-white text-slate-900 rounded-bl-sm border border-slate-200'
                      }`}>
                        {!mine && (
                          <p className="text-xs font-semibold text-orange-600 mb-0.5">
                            {m.senderRole === 'Customer' ? 'Khách hàng' : m.senderRole}
                          </p>
                        )}
                        <p className={`leading-relaxed font-medium ${mine ? 'text-white' : 'text-slate-900'}`}>
                          {m.content}
                        </p>
                        <p className={`text-xs mt-1 ${mine ? 'text-orange-100' : 'text-slate-500'}`}>
                          {formatTime(m.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                </>
              )}
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
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-500 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400/40"
                  disabled={sending}
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={sending || !inputText.trim()}
                  className="p-2.5 rounded-xl bg-orange-600 text-white disabled:opacity-40 hover:bg-orange-700 transition-colors"
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
