import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, X, Send, ChevronLeft, Plus, Clock, CheckCircle } from 'lucide-react';
import { useAuth } from '../../hooks';
import { chatService } from '../../services';
import type { IChatSession, IChatMessage, ChatTopic } from '../../interfaces';
import toast from 'react-hot-toast';


type WidgetView = 'history' | 'create' | 'chat';

/**
 * Widget Live Chat Hỗ Trợ Khách Hàng Nổi Trên Màn Hình (LiveChatWidget).
 * Cho phép khách hàng hoặc người bán mở hộp thoại chat trực tuyến với Admin / Điều phối viên:
 * - Xem danh sách lịch sử các phiên hỗ trợ cũ
 * - Tạo yêu cầu hỗ trợ mới theo từng chủ đề: Vấn đề đơn hàng (OrderIssue), Lỗi hệ thống (SystemIssue), Thông tin chung (General)
 * - Nhắn tin trao đổi thời gian thực qua SignalR Hub.
 */
export function LiveChatWidget() {
  const { user, token } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<WidgetView>('history');
  const [sessionsList, setSessionsList] = useState<IChatSession[]>([]);
  const [session, setSession] = useState<IChatSession | null>(null);
  const [messages, setMessages] = useState<IChatMessage[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [inputText, setInputText] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [supportJoined, setSupportJoined] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionIdRef = useRef<string | null>(null);

  /**
   * Tải lịch sử các phiên chat hỗ trợ của người dùng hiện tại từ API.
   */
  const loadHistory = useCallback(async () => {
    if (!token) return;
    try {
      setIsConnecting(true);
      const res = await chatService.getUserSessions();
      if (res.data) {
        setSessionsList(res.data);
      }
    } catch {
      toast.error('Tải lịch sử chat thất bại do lỗi kết nối mạng.');
    } finally {
      setIsConnecting(false);
    }
  }, [token]);

  useEffect(() => {
    if (user && token && isOpen && view === 'history') {
      loadHistory();
    }
  }, [user, token, isOpen, view, loadHistory]);

  // Lắng nghe sự kiện tùy biến 'openLiveChat' để mở widget từ bất cứ đâu trong app
  useEffect(() => {
    const handleOpenChat = () => setIsOpen(true);
    window.addEventListener('openLiveChat', handleOpenChat);
    return () => window.removeEventListener('openLiveChat', handleOpenChat);
  }, []);

  /**
   * Callback xử lý khi nhận tin nhắn mới từ SignalR.
   */
  const handleReceiveMessage = useCallback((message: IChatMessage) => {
    if (message.sessionId === sessionIdRef.current) {
      setMessages(prev => {
        if (prev.some(m => m.id === message.id)) return prev;
        const optimisticIndex = prev.findIndex(m =>
          m.senderId === message.senderId &&
          m.content === message.content &&
          m.id.length < 20
        );
        if (optimisticIndex !== -1) {
          const updated = [...prev];
          updated[optimisticIndex] = message;
          return updated;
        }
        return [...prev, message];
      });
    } else {
      if (message.senderRole !== 'Customer') {
        setUnreadCounts(prev => ({
          ...prev,
          [message.sessionId]: (prev[message.sessionId] || 0) + 1
        }));
      }
    }
  }, []);

  /**
   * Callback xử lý khi có nhân viên hỗ trợ tham gia phiên chat.
   */
  const handleSupportJoined = useCallback((_sessionId: string) => {
    setSupportJoined(true);
    toast.success('Nhân viên hỗ trợ đã tham gia cuộc trò chuyện');
  }, []);

  /**
   * Callback xử lý khi phiên chat bị đóng.
   */
  const handleSessionClosed = useCallback(() => {
    setSession(prev => prev ? { ...prev, status: 'Closed' } : null);
    setSupportJoined(false);
    toast('Phiên chat đã kết thúc');
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, view]);

  // Kết nối và đăng ký lắng nghe sự kiện SignalR khi mở phòng chat
  useEffect(() => {
    if (view !== 'chat' || !session?.id || !token || session.status === 'Closed') return;

    sessionIdRef.current = session.id;
    let active = true;

    const connect = async () => {
      setIsConnecting(true);
      try {
        await chatService.startConnection(token);
        await chatService.joinSession(session.id);
        chatService.onReceiveMessage(handleReceiveMessage);
        chatService.onSupportJoined(handleSupportJoined);
        chatService.onSessionClosed(handleSessionClosed);
      } catch {
        if (active) toast.error('Không kết nối được chat realtime. Thử lại sau.');
      } finally {
        if (active) setIsConnecting(false);
      }
    };

    connect();

    return () => {
      active = false;
      chatService.offReceiveMessage(handleReceiveMessage);
      chatService.offSupportJoined(handleSupportJoined);
      chatService.offSessionClosed(handleSessionClosed);
      if (session?.id) chatService.leaveSession(session.id).catch(() => {});
    };
  }, [session?.id, session?.status, token, view, handleReceiveMessage, handleSupportJoined, handleSessionClosed]);

  /**
   * Mở một phiên chat đã có từ danh sách lịch sử.
   * @param s - Đối tượng phiên chat
   */
  const openSession = async (s: IChatSession) => {
    try {
      setIsConnecting(true);
      setSession(s);
      sessionIdRef.current = s.id;
      setSupportJoined(!!s.supportId);
      setUnreadCounts(prev => ({ ...prev, [s.id]: 0 }));
      
      const history = await chatService.getHistory(s.id, { take: 50 });
      if (history.data?.items) setMessages(history.data.items);
      
      setView('chat');
    } catch {
      toast.error('Mở phiên chat thất bại do lỗi kết nối mạng.');
    } finally {
      setIsConnecting(false);
    }
  };

  /**
   * Tạo phiên chat hỗ trợ mới với chủ đề đã chọn.
   * @param topic - Chủ đề hỗ trợ
   */
  const handleStartChat = async (topic: ChatTopic) => {
    if (!token) return;
    try {
      setIsConnecting(true);
      const res = await chatService.createSession({ topic });
      if (res.error || !res.data) {
        toast.error(res.message);
        return;
      }
      setSession(res.data);
      sessionIdRef.current = res.data.id;
      setSupportJoined(!!res.data.supportId);
      const history = await chatService.getHistory(res.data.id, { take: 50 });
      if (history.data?.items) setMessages(history.data.items);
      setView('chat');
    } catch {
      toast.error('Bắt đầu chat thất bại do lỗi kết nối mạng.');
    } finally {
      setIsConnecting(false);
    }
  };

  /**
   * Gửi tin nhắn trong phiên chat hỗ trợ.
   * @param e - Sự kiện FormEvent
   */
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !session || !user || !token || session.status === 'Closed') return;

    const tempId = Date.now().toString();
    const content = inputText.trim();
    const newMsg: IChatMessage = {
      id: tempId,
      sessionId: session.id,
      senderId: user.id,
      senderRole: user.role as IChatMessage['senderRole'],
      content,
      createdAt: new Date().toISOString(),
    };

    setMessages(prev => [...prev, newMsg]);
    setInputText('');

    try {
      await chatService.sendMessage(session.id, user.id, user.role, content);
    } catch {
      toast.error('Gửi tin nhắn thất bại do lỗi kết nối mạng.');
      setMessages(prev => prev.filter(m => m.id !== tempId));
    }
  };


  if (!user || user.role === 'Admin' || user.role === 'Coordinator') return null;

  const topicLabels: Record<ChatTopic, string> = {
    OrderIssue: 'Vấn đề đơn hàng',
    OrderCancellation: 'Hủy đơn hàng',
    SystemIssue: 'Lỗi hệ thống',
    General: 'Thông tin chung',
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen ? (
        <div className="w-80 sm:w-96 h-[500px] max-h-[80vh] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden mb-4">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 p-4 text-white flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              {view !== 'history' && (
                <button 
                  onClick={() => setView('history')}
                  className="p-1 hover:bg-white/20 rounded-full"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              <div>
                <h3 className="font-semibold text-lg">Hỗ trợ trực tuyến</h3>
                {view === 'chat' && session && (
                  <p className="text-xs text-orange-100">
                    {topicLabels[session.topic as ChatTopic] || 'Chat'}
                    {' · '}
                    {session.status === 'Closed' 
                      ? 'Phiên đã đóng' 
                      : supportJoined ? 'Nhân viên đang hỗ trợ' : 'Đang chờ nhân viên...'}
                  </p>
                )}
                {view === 'create' && (
                  <p className="text-xs text-orange-100">Chọn đúng chủ đề để được hỗ trợ phù hợp</p>
                )}
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/20 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto bg-gray-50 flex flex-col relative min-h-0">
            {view === 'history' && (
              <div className="p-4 flex flex-col gap-3 h-full">
                <button
                  onClick={() => setView('create')}
                  className="w-full bg-white border border-orange-200 text-orange-600 hover:bg-orange-50 py-3 px-4 rounded-xl shadow-sm flex items-center justify-center gap-2 font-medium"
                >
                  <Plus className="w-5 h-5" />
                  Tạo yêu cầu mới
                </button>

                <div className="flex-1 overflow-y-auto flex flex-col gap-2 mt-2">
                  {sessionsList.length === 0 && !isConnecting && (
                    <p className="text-center text-gray-500 text-sm mt-8">Chưa có lịch sử hỗ trợ.</p>
                  )}
                  {sessionsList.map(s => (
                    <div 
                      key={s.id} 
                      onClick={() => openSession(s)}
                      className="relative bg-white p-3 rounded-xl border border-gray-100 shadow-sm hover:border-orange-200 cursor-pointer transition-colors flex-shrink-0"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium text-gray-800 text-sm">{topicLabels[s.topic as ChatTopic]}</span>
                        {s.status === 'Open' ? (
                          <span className="flex items-center gap-1 text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                            <Clock className="w-3 h-3" /> Đang mở
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                            <CheckCircle className="w-3 h-3" /> Đã đóng
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(s.createdAt).toLocaleString('vi-VN')}
                      </div>
                      {(unreadCounts[s.id] || 0) > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {view === 'create' && (
              <div className="p-4 flex flex-col gap-3 h-full">
                <p className="text-sm text-gray-500 text-center mb-1">Chọn chủ đề cần hỗ trợ:</p>
                <p className="text-[11px] text-gray-400 text-center mb-2">
                  Đơn hàng → Điều phối viên · Hệ thống / Chung → Admin
                </p>
                {([
                  { topic: 'OrderIssue' as ChatTopic, desc: 'Theo dõi đơn, giao hàng, khiếu nại đơn' },
                  { topic: 'SystemIssue' as ChatTopic, desc: 'Lỗi app, thanh toán, tài khoản' },
                  { topic: 'General' as ChatTopic, desc: 'Câu hỏi chung về UniEats' },
                ]).map(({ topic, desc }, i) => {
                  const colors = ['border-orange-200 text-orange-600 hover:bg-orange-50', 'border-blue-200 text-blue-600 hover:bg-blue-50', 'border-gray-200 text-gray-700 hover:bg-gray-100'];
                  return (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => handleStartChat(topic)}
                      disabled={isConnecting}
                      className={`w-full bg-white border font-medium py-3 px-4 rounded-xl shadow-sm text-left ${colors[i]}`}
                    >
                      <span className="block">{topicLabels[topic]}</span>
                      <span className="block text-[11px] font-normal opacity-70 mt-0.5">{desc}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {view === 'chat' && (
              <div className="p-4 flex flex-col gap-4 flex-1">
                {messages.length === 0 && (
                  <p className="text-center text-gray-400 text-sm py-8">
                    {session
                      ? `Chủ đề: ${topicLabels[session.topic as ChatTopic] || session.topic}. Gửi tin nhắn — nhân viên sẽ phản hồi realtime.`
                      : 'Gửi tin nhắn — nhân viên sẽ phản hồi realtime'}
                  </p>
                )}
                {messages.map(msg => {
                  const isMe = msg.senderId === user.id;
                  return (
                    <div key={msg.id} className={`flex flex-col max-w-[80%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}>
                      <div className={`p-3 rounded-2xl text-sm whitespace-pre-wrap ${isMe ? 'bg-orange-500 text-white rounded-tr-sm' : 'bg-white text-gray-900 border border-gray-200 rounded-tl-sm'}`}>
                        {msg.content}
                      </div>
                      <span className="text-[10px] text-gray-400 mt-1">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}

            {isConnecting && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          {view === 'chat' && session && (
            <div className="p-3 bg-white border-t border-gray-100 shrink-0">
              {session.status === 'Closed' ? (
                <div className="text-center py-2 text-sm text-gray-500 bg-gray-50 rounded-lg">
                  Phiên hỗ trợ này đã đóng
                </div>
              ) : (
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    placeholder="Nhập tin nhắn..."
                    className="flex-1 bg-gray-50 rounded-full px-4 py-2 text-sm text-gray-900 placeholder:text-gray-500 font-medium focus:ring-2 focus:ring-orange-200 focus:border-orange-500 border border-transparent"
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim() || isConnecting}
                    className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white p-2.5 rounded-full shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="relative bg-gradient-to-r from-orange-500 to-red-500 text-white p-4 rounded-full shadow-[0_0_15px_rgba(249,115,22,0.5)] hover:scale-105 transition-all duration-300 group"
          aria-label="Mở chat hỗ trợ"
        >
          {Object.values(unreadCounts).some(count => count > 0) && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-white"></span>
            </span>
          )}
          <MessageCircle className="w-7 h-7 group-hover:animate-none" />
        </button>
      )}
    </div>
  );
}
