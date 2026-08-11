import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { MessageSquare, Send, Loader2, RefreshCw, ChevronLeft, Store } from 'lucide-react';
import { useAuth } from '../hooks';
import { setActiveCustomerChatSession } from '../hooks/useCustomerChatWatcher';
import { chatService } from '../services/ChatService';
import type { ICustomerChatSummary, IChatMessage } from '../interfaces';
import { ROUTES } from '../routes/routeConfig';
import {
  getCustomerUnreadMap,
  markCustomerSessionRead,
  syncCustomerUnreadFromSessions,
} from '../utils/customerChatUnread';
import toast from 'react-hot-toast';

interface ICustomerChatLocal extends ICustomerChatSummary {
  hasUnread?: boolean;
  unreadCount?: number;
}

function isMessageInSession(session: ICustomerChatLocal | null, sessionId: string) {
  if (!session || !sessionId) return false;
  if (session.id === sessionId) return true;
  return (session.relatedSessionIds || []).includes(sessionId);
}

export function CustomerMessagesPage() {
  const { user, token, isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [sessions, setSessions] = useState<ICustomerChatLocal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState<ICustomerChatLocal | null>(null);
  const [messages, setMessages] = useState<IChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [nextBefore, setNextBefore] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const deepLinkHandledRef = useRef(false);
  const activeSessionRef = useRef<ICustomerChatLocal | null>(null);
  const loadingMoreRef = useRef(false);

  useEffect(() => {
    activeSessionRef.current = activeSession;
    setActiveCustomerChatSession(
      activeSession?.id ?? null,
      activeSession?.relatedSessionIds || []
    );
    return () => setActiveCustomerChatSession(null);
  }, [activeSession]);

  const markThreadRead = useCallback((session: ICustomerChatLocal) => {
    markCustomerSessionRead(session.id, session.relatedSessionIds || []);
    setSessions((prev) =>
      prev.map((s) =>
        s.id === session.id || (session.relatedSessionIds || []).includes(s.id)
          ? { ...s, hasUnread: false, unreadCount: 0 }
          : s
      )
    );
  }, []);

  const handleReceive = useCallback((message: IChatMessage) => {
    const current = activeSessionRef.current;
    const inActive = isMessageInSession(current, message.sessionId);

    if (!inActive) {
      const fromStore = message.senderRole === 'Seller' || message.senderRole === 'Mall';
      setSessions((prev) =>
        prev.map((s) => {
          const match = isMessageInSession(s, message.sessionId);
          if (!match) return s;
          return {
            ...s,
            lastMessage: message.content,
            lastMessageAt: message.createdAt,
            hasUnread: fromStore ? true : s.hasUnread,
            unreadCount: fromStore ? (s.unreadCount || 0) + 1 : s.unreadCount,
          };
        })
      );
      return;
    }

    // Đang trong đoạn chat → đã đọc
    if (current) markThreadRead(current);

    setMessages((prev) => {
      if (prev.some((m) => m.id === message.id)) return prev;
      return [...prev, message];
    });
  }, [markThreadRead]);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await chatService.getCustomerChats();
      if (!res.error && res.data) {
        syncCustomerUnreadFromSessions(res.data);
        const unreadMap = getCustomerUnreadMap();

        const formatted = (res.data as ICustomerChatLocal[]).map((s) => {
          const ids = [s.id, ...(s.relatedSessionIds || [])];
          const unreadCount = ids.reduce((sum, id) => sum + (Number(unreadMap[id]) || 0), 0);
          return {
            ...s,
            unreadCount,
            hasUnread: unreadCount > 0,
          };
        });

        setSessions(formatted);
        return formatted;
      }
    } catch {
      toast.error('Không thể tải danh sách tin nhắn');
    } finally {
      setLoading(false);
    }
    return [] as ICustomerChatLocal[];
  }, []);

  useEffect(() => {
    if (!token || !isAuthenticated) return;
    void fetchSessions();
  }, [token, isAuthenticated, fetchSessions]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    const setup = async () => {
      try {
        await chatService.startConnection(token);
      } catch {
        // hub optional for REST list
      }
      if (cancelled) return;
    };
    void setup();

    chatService.onReceiveMessage(handleReceive);
    chatService.onOrderChatMessage(handleReceive);
    return () => {
      cancelled = true;
      chatService.offReceiveMessage(handleReceive);
      chatService.offOrderChatMessage(handleReceive);
    };
  }, [token, handleReceive]);

  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distanceFromBottom < 120) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const openSession = async (session: ICustomerChatLocal) => {
    if (activeSession?.id === session.id) return;

    if (activeSession) {
      await chatService.leaveSession(activeSession.id).catch(() => {});
    }

    setActiveSession(session);
    markThreadRead(session);

    setChatLoading(true);
    setMessages([]);
    setHasMoreMessages(false);
    setNextBefore(null);
    try {
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

  useEffect(() => {
    if (loading || deepLinkHandledRef.current) return;
    const orderId = searchParams.get('orderId');
    const sessionId = searchParams.get('sessionId');
    if ((!orderId && !sessionId) || sessions.length === 0) return;

    const match = sessions.find((s) => {
      if (sessionId && s.id === sessionId) return true;
      if (!orderId) return false;
      const oid = orderId.toLowerCase();
      if (s.orderId === orderId || s.orderId?.toLowerCase().startsWith(oid.slice(0, 8))) return true;
      return (s.relatedOrderIds || []).some(
        (id) => id === orderId || id.toLowerCase().startsWith(oid.slice(0, 8))
      );
    });
    deepLinkHandledRef.current = true;
    if (match) {
      void openSession(match);
    }
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('orderId');
      next.delete('sessionId');
      return next;
    }, { replace: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, sessions, searchParams]);

  const handleSend = async () => {
    if (!inputText.trim() || !activeSession || !user || !token) return;
    if (activeSession.status !== 'Open') {
      toast.error('Cuộc hội thoại đã đóng');
      return;
    }
    const content = inputText.trim();
    setInputText('');
    setSending(true);
    try {
      await chatService.sendMessage(activeSession.id, user.id, user.role, content);
      // User trả lời → đánh dấu đã đọc
      markThreadRead(activeSession);
    } catch {
      toast.error('Gửi tin nhắn thất bại');
      setInputText(content);
    } finally {
      setSending(false);
    }
  };

  const formatOrderId = (orderId?: string) =>
    orderId ? `#${orderId.substring(0, 8).toUpperCase()}` : null;

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-lg mx-auto py-20 px-4 text-center">
        <MessageSquare className="w-14 h-14 text-gray-200 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-gray-800 mb-2">Tin nhắn</h1>
        <p className="text-gray-500 text-sm mb-6">Đăng nhập để xem tin nhắn từ cửa hàng</p>
        <Link
          to={ROUTES.LOGIN}
          className="inline-flex px-5 py-2.5 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600"
        >
          Đăng nhập
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex h-[calc(100vh-8rem)] min-h-[480px] bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
        <div className={`w-full md:w-80 flex-shrink-0 border-r border-gray-100 flex flex-col ${activeSession ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-orange-500" />
              <h2 className="font-semibold text-gray-800">Tin nhắn</h2>
            </div>
            <button
              onClick={() => void fetchSessions()}
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
                <p className="text-gray-400 text-sm">Chưa có tin nhắn từ cửa hàng</p>
                <p className="text-gray-300 text-xs mt-1">Nhắn từ chi tiết đơn hoặc trang nhà hàng để bắt đầu</p>
              </div>
            ) : (
              sessions.map((session) => {
                const isActive = activeSession?.id === session.id;
                const orderLabel = formatOrderId(session.orderId);
                return (
                  <button
                    key={session.id}
                    onClick={() => void openSession(session)}
                    className={`w-full text-left px-4 py-3 border-b border-gray-50 transition-colors flex flex-col gap-1 ${
                      isActive
                        ? 'bg-orange-50 border-l-4 border-l-orange-500'
                        : session.hasUnread
                          ? 'bg-red-50 border-l-4 border-l-red-500'
                          : 'hover:bg-orange-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Store className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                        <span className="font-semibold text-sm text-gray-800 truncate">
                          {session.restaurantName || 'Cửa hàng'}
                        </span>
                        {session.hasUnread && (
                          <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                            {(session.unreadCount || 1) > 99 ? '99+' : session.unreadCount || 1}
                          </span>
                        )}
                      </div>
                      {session.lastMessageAt && (
                        <span className="text-xs text-gray-400 shrink-0">{formatTime(session.lastMessageAt)}</span>
                      )}
                    </div>
                    {orderLabel && (
                      <span className="text-xs text-orange-600 font-medium">Đơn {orderLabel}</span>
                    )}
                    {!orderLabel && (
                      <span className="text-xs text-gray-400">Chat với cửa hàng</span>
                    )}
                    {orderLabel && (session.relatedOrderIds?.length || 0) > 1 && (
                      <span className="text-xs text-gray-400">{session.relatedOrderIds!.length} đơn liên quan</span>
                    )}
                    {session.lastMessage && (
                      <span className="text-xs text-gray-400 truncate">{session.lastMessage}</span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className={`flex-1 flex-col ${activeSession ? 'flex' : 'hidden md:flex'}`}>
          {!activeSession ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-gray-400">
              <MessageSquare className="w-16 h-16 text-gray-200 mb-4" />
              <p className="text-lg font-medium text-gray-500">Chọn một cuộc hội thoại</p>
              <p className="text-sm mt-1">Xem tin nhắn từ cửa hàng và trả lời tại đây</p>
            </div>
          ) : (
            <>
              <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3 bg-white">
                <button
                  onClick={() => setActiveSession(null)}
                  className="md:hidden p-1.5 rounded-lg hover:bg-gray-100"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-500" />
                </button>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-800 truncate">
                    {activeSession.restaurantName || 'Cửa hàng'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatOrderId(activeSession.orderId)
                      ? `Đơn ${formatOrderId(activeSession.orderId)}`
                      : 'Chat cửa hàng'}
                  </p>
                </div>
                <div className="ml-auto">
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      activeSession.status === 'Open'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {activeSession.status === 'Open' ? 'Đang mở' : 'Đã đóng'}
                  </span>
                </div>
              </div>

              <div
                ref={messagesContainerRef}
                onScroll={handleMessagesScroll}
                className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50"
              >
                {chatLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-orange-400" />
                  </div>
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
                    {messages.map((msg) => {
                    const isMine = msg.senderId?.toLowerCase() === user?.id?.toLowerCase();
                    return (
                      <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm shadow-sm ${
                            isMine
                              ? 'bg-orange-600 text-white rounded-br-md'
                              : 'bg-white text-slate-900 border border-slate-200 rounded-bl-md'
                          }`}
                        >
                          <p className={`whitespace-pre-wrap break-words font-medium leading-relaxed ${isMine ? 'text-white' : 'text-slate-900'}`}>
                            {msg.content}
                          </p>
                          <p className={`text-[10px] mt-1 ${isMine ? 'text-orange-100' : 'text-slate-500'}`}>
                            {formatTime(msg.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  </>
                )}
              </div>

              <div className="p-3 border-t border-gray-100 bg-white">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        void handleSend();
                      }
                    }}
                    disabled={activeSession.status !== 'Open' || sending}
                    placeholder={
                      activeSession.status === 'Open'
                        ? 'Nhập tin nhắn...'
                        : 'Cuộc hội thoại đã đóng'
                    }
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-500 bg-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 disabled:bg-slate-50 disabled:text-slate-400"
                  />
                  <button
                    onClick={() => void handleSend()}
                    disabled={!inputText.trim() || sending || activeSession.status !== 'Open'}
                    className="p-2.5 rounded-xl bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
