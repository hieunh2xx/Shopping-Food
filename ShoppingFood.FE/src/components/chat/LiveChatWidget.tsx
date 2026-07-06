import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { useAuth } from '../../hooks';
import { chatService } from '../../services';
import type { IChatSession, IChatMessage, ChatTopic } from '../../interfaces';
import toast from 'react-hot-toast';

export function LiveChatWidget() {
  const { user, token } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [session, setSession] = useState<IChatSession | null>(null);
  const [messages, setMessages] = useState<IChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [supportJoined, setSupportJoined] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionIdRef = useRef<string | null>(null);

  const handleReceiveMessage = useCallback((message: IChatMessage) => {
    if (sessionIdRef.current && message.sessionId !== sessionIdRef.current) return;
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
  }, []);

  const handleSupportJoined = useCallback((_sessionId: string) => {
    setSupportJoined(true);
    toast.success('Nhân viên hỗ trợ đã tham gia cuộc trò chuyện');
  }, []);

  const handleSessionClosed = useCallback(() => {
    setSession(null);
    setMessages([]);
    setSupportJoined(false);
    sessionIdRef.current = null;
    toast('Phiên chat đã kết thúc');
  }, []);

  useEffect(() => {
    if (user && token && isOpen && !session) {
      chatService.getCurrentSession()
        .then(res => {
          if (res.data) {
            setSession(res.data);
            setMessages(res.data.messages || []);
            sessionIdRef.current = res.data.id;
            setSupportJoined(!!res.data.supportId);
          }
        })
        .catch(() => toast.error('Không tải được phiên chat'));
    }
  }, [user, token, isOpen, session]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!session?.id || !token) return;

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
      chatService.leaveSession(session.id).catch(() => {});
    };
  }, [session?.id, token, handleReceiveMessage, handleSupportJoined, handleSessionClosed]);

  const handleStartChat = async (topic: ChatTopic) => {
    if (!token) {
      toast.error('Vui lòng đăng nhập để chat');
      return;
    }
    try {
      setIsConnecting(true);
      const res = await chatService.createSession({ topic });
      if (res.error || !res.data) {
        toast.error(res.message || 'Không tạo được phiên chat');
        return;
      }
      setSession(res.data);
      sessionIdRef.current = res.data.id;
      setSupportJoined(!!res.data.supportId);
      const history = await chatService.getHistory(res.data.id);
      if (history.data) setMessages(history.data);
    } catch {
      toast.error('Không thể bắt đầu chat');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !session || !user || !token) return;

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
      toast.error('Gửi tin nhắn thất bại');
      setMessages(prev => prev.filter(m => m.id !== tempId));
    }
  };

  if (!user) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen ? (
        <div className="w-80 sm:w-96 h-[500px] max-h-[80vh] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden mb-4">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 p-4 text-white flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-lg">Hỗ trợ trực tuyến</h3>
              <p className="text-xs text-orange-100">
                {session
                  ? supportJoined
                    ? 'Nhân viên đang hỗ trợ'
                    : 'Đang chờ nhân viên...'
                  : 'Chọn chủ đề để bắt đầu'}
              </p>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/20 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 flex flex-col gap-4 relative">
            {!session ? (
              <div className="flex flex-col gap-3 justify-center h-full">
                <p className="text-sm text-gray-500 text-center mb-2">Chọn chủ đề cần hỗ trợ:</p>
                {(['OrderIssue', 'SystemIssue', 'General'] as ChatTopic[]).map((topic, i) => {
                  const labels: Record<ChatTopic, string> = {
                    OrderIssue: 'Vấn đề đơn hàng',
                    SystemIssue: 'Lỗi hệ thống',
                    General: 'Thông tin chung',
                  };
                  const colors = ['border-orange-200 text-orange-600 hover:bg-orange-50', 'border-blue-200 text-blue-600 hover:bg-blue-50', 'border-gray-200 text-gray-700 hover:bg-gray-100'];
                  return (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => handleStartChat(topic)}
                      disabled={isConnecting}
                      className={`w-full bg-white border font-medium py-3 px-4 rounded-xl shadow-sm text-left ${colors[i]}`}
                    >
                      {labels[topic]}
                    </button>
                  );
                })}
              </div>
            ) : (
              <>
                {messages.length === 0 && (
                  <p className="text-center text-gray-400 text-sm py-8">
                    Gửi tin nhắn — nhân viên sẽ phản hồi realtime
                  </p>
                )}
                {messages.map(msg => {
                  const isMe = msg.senderId === user.id;
                  return (
                    <div key={msg.id} className={`flex flex-col max-w-[80%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}>
                      <div className={`p-3 rounded-2xl text-sm ${isMe ? 'bg-orange-500 text-white rounded-tr-sm' : 'bg-white text-gray-900 border border-gray-200 rounded-tl-sm'}`}>
                        {msg.content}
                      </div>
                      <span className="text-[10px] text-gray-400 mt-1">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </>
            )}

            {isConnecting && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          {session && (
            <div className="p-3 bg-white border-t border-gray-100">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  placeholder="Nhập tin nhắn..."
                  className="flex-1 bg-gray-50 rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-orange-200 focus:border-orange-500 border border-transparent"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || isConnecting}
                  className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white p-2.5 rounded-full"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-4 rounded-full shadow-lg hover:scale-105 transition-transform"
          aria-label="Mở chat hỗ trợ"
        >
          <MessageCircle className="w-7 h-7" />
        </button>
      )}
    </div>
  );
}
