import { useState, useEffect, useRef, useCallback } from 'react';
import { User, Send, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { chatService } from '../../services';
import { useAuth } from '../../hooks';
import type { IChatSession, IChatMessage } from '../../interfaces';

export interface SupportChatDashboardProps {
  role: 'Admin' | 'Coordinator';
}

export function SupportChatDashboard({ role }: SupportChatDashboardProps) {
  const { user, token } = useAuth();
  const [sessions, setSessions] = useState<IChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, IChatMessage[]>>({});
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [inputText, setInputText] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeSessionIdRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  useEffect(() => {
    activeSessionIdRef.current = activeSessionId;
  }, [activeSessionId]);

  const handleReceiveMessage = useCallback((message: IChatMessage) => {
    setMessages(prev => {
      const sessionMsgs = prev[message.sessionId] || [];
      if (sessionMsgs.some(m => m.id === message.id)) return prev;
      const optimisticIndex = sessionMsgs.findIndex(m =>
        m.senderId === message.senderId && m.content === message.content && m.id.length < 20
      );
      const updatedMsgs = optimisticIndex !== -1
        ? sessionMsgs.map((m, i) => (i === optimisticIndex ? message : m))
        : [...sessionMsgs, message];
      return { ...prev, [message.sessionId]: updatedMsgs };
    });

    if (message.sessionId !== activeSessionIdRef.current) {
      if (message.senderRole !== 'Admin' && message.senderRole !== 'Coordinator') {
        setUnreadCounts(prev => ({
          ...prev,
          [message.sessionId]: (prev[message.sessionId] || 0) + 1
        }));
      }
    } else {
      const storedLastRead = localStorage.getItem('chat_last_read');
      const lastReadTimes = storedLastRead ? JSON.parse(storedLastRead) : {};
      lastReadTimes[message.sessionId] = new Date().toISOString();
      localStorage.setItem('chat_last_read', JSON.stringify(lastReadTimes));
      window.dispatchEvent(new Event('chat_read_updated'));
    }
  }, []);

  const handleNewSession = useCallback((newSession: IChatSession) => {
    setSessions(prev => (prev.find(s => s.id === newSession.id) ? prev : [newSession, ...prev]));
    setUnreadCounts(prev => ({ ...prev, [newSession.id]: (prev[newSession.id] || 0) + 1 }));
    chatService.joinSession(newSession.id).catch(console.error);
  }, []);

  const handleSupportJoined = useCallback((sessId: string, supportId: string) => {
    setSessions(prev => prev.map(s => (s.id === sessId ? { ...s, supportId } : s)));
  }, []);

  const handleSessionClosed = useCallback((sessId: string) => {
    setSessions(prev => prev.map(s => s.id === sessId ? { ...s, status: 'Closed' } : s));
  }, []);

  

  const fetchSessions = async () => {
    try {
      const res = await chatService.getOpenSessions();
      if (res.data) {
        setSessions(res.data);
        const initialMsgs: Record<string, IChatMessage[]> = {};
        const initialUnread: Record<string, number> = {};
        const storedLastRead = localStorage.getItem('chat_last_read');
        const lastReadTimes = storedLastRead ? JSON.parse(storedLastRead) : {};

        res.data.forEach(s => {
          if (s.messages) {
            initialMsgs[s.id] = s.messages;
            const lastRead = lastReadTimes[s.id];
            const hasNewMsg = s.messages.some(m => {
              const msgDate = m.createdAt.endsWith('Z') ? new Date(m.createdAt) : new Date(m.createdAt + 'Z');
              return m.senderRole === 'Customer' && (!lastRead || msgDate > new Date(lastRead));
            });
            if (hasNewMsg) {
              initialUnread[s.id] = 1;
            }
          }
        });
        setMessages(prev => ({ ...initialMsgs, ...prev }));
        setUnreadCounts(prev => ({ ...prev, ...initialUnread }));
        return res.data;
      }
      return [];
    } catch (error) {
      console.error('Failed to load sessions', error);
      return [];
    }
  };

  useEffect(() => {
    if (!token) return;

    const connect = async () => {
      try {
        await chatService.startConnection(token);
        // Nếu component đã unmount thì không đăng ký handler nữa
        if (!isMountedRef.current) {
          return;
        }
        
        if (role === 'Admin') {
          await chatService.joinAdminGroup();
        } else if (role === 'Coordinator') {
          await chatService.joinCoordinatorGroup();
        }

        // Join tất cả sessions hiện có SAU KHI connection đã ready
        // Tránh race condition với useEffect[sessions] bên dưới
        const fetchedSessions = await fetchSessions();
        if (fetchedSessions && fetchedSessions.length > 0) {
          for (const s of fetchedSessions) {
            await chatService.joinSession(s.id);
          }
        }
        
        chatService.onReceiveMessage(handleReceiveMessage);
        chatService.onNewSession(handleNewSession);
        chatService.onSupportJoined(handleSupportJoined);
        chatService.onSessionClosed(handleSessionClosed);
      } catch (err) {
        console.error('Support chat SignalR failed', err);
      }
    };

    connect();

    return () => {
      isMountedRef.current = false;
      chatService.offReceiveMessage(handleReceiveMessage);
      chatService.offNewSession(handleNewSession);
      chatService.offSupportJoined(handleSupportJoined);
      chatService.offSessionClosed(handleSessionClosed);
    };
  }, [token, handleReceiveMessage, handleNewSession, handleSupportJoined, handleSessionClosed]);

  useEffect(() => {
    if (activeSessionId) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeSessionId]);

  // Sessions được join trong connect() sau khi hub đã sẵn sàng
  // handleNewSession tự join session mới khi có user tạo

  const handleSelectSession = async (session: IChatSession) => {
    setActiveSessionId(session.id);
    setUnreadCounts(prev => ({ ...prev, [session.id]: 0 }));

    const storedLastRead = localStorage.getItem('chat_last_read');
    const lastReadTimes = storedLastRead ? JSON.parse(storedLastRead) : {};
    lastReadTimes[session.id] = new Date().toISOString();
    localStorage.setItem('chat_last_read', JSON.stringify(lastReadTimes));
    window.dispatchEvent(new Event('chat_read_updated'));

    if (!messages[session.id] || messages[session.id].length === 0) {
      try {
        const historyRes = await chatService.getHistory(session.id, { take: 50 });
        if (historyRes.data?.items) {
          setMessages(prev => ({ ...prev, [session.id]: historyRes.data!.items }));
        }
      } catch (error) {
        console.error('Failed to load history', error);
      }
    }
  };

  const handleClaimSession = async (session: IChatSession) => {
    if (!user) return;
    try {
      await chatService.claimSession(session.id, user.id);
      // Update local state
      setSessions(prev => prev.map(s => s.id === session.id ? { ...s, supportId: user.id } : s));
    } catch (error) {
      console.error('Failed to claim session', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeSessionId || !user) return;

    try {
      const tempId = Date.now().toString();
      const newMsg: IChatMessage = {
        id: tempId,
        sessionId: activeSessionId,
        senderId: user.id,
        senderRole: user.role as IChatMessage['senderRole'],
        content: inputText.trim(),
        createdAt: new Date().toISOString()
      };
      setMessages(prev => ({
        ...prev,
        [activeSessionId]: [...(prev[activeSessionId] || []), newMsg]
      }));
      setInputText('');

      await chatService.sendMessage(activeSessionId, user.id, user.role, newMsg.content);
    } catch (error) {
      console.error('Failed to send message', error);
    }
  };

  const activeSession = sessions.find(s => s.id === activeSessionId);
  const activeMessages = activeSessionId ? messages[activeSessionId] || [] : [];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex overflow-hidden" style={{ height: 'calc(100vh - 120px)' }}>
      {/* Sidebar: Session List */}
      <div className="w-1/3 border-r border-gray-100 flex flex-col bg-gray-50/50 animate-[fadeIn_0.5s_ease-out]">
        <div className="p-4 border-b border-gray-100 bg-white flex justify-between items-center">
          <h2 className="font-semibold text-gray-800">Phiên hỗ trợ</h2>
          <button onClick={fetchSessions} className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors">Làm mới</button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {sessions.length === 0 ? (
            <div className="text-center text-gray-500 mt-10 text-sm">Không có phiên hỗ trợ nào</div>
          ) : (
            sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => handleSelectSession(session)}
                className={`w-full text-left p-3 rounded-xl mb-2 transition-all ${
                  activeSessionId === session.id 
                    ? 'bg-blue-50 border-blue-100 shadow-sm' 
                    : 'bg-white border-transparent hover:bg-gray-50'
                } border`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium text-gray-800 text-sm">Khách hàng: {session.userId.substring(0, 8)}...</span>
                  <div className="flex items-center gap-2">
                    {(unreadCounts[session.id] || 0) > 0 && (
                      <span className="w-2.5 h-2.5 bg-red-500 rounded-full shadow-sm"></span>
                    )}
                    <span className="text-xs text-gray-400">
                      {new Date(session.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    session.topic === 'OrderIssue' ? 'bg-red-100 text-red-700' :
                    session.topic === 'SystemIssue' ? 'bg-purple-100 text-purple-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {session.topic === 'OrderIssue' ? 'Đơn hàng' : session.topic === 'SystemIssue' ? 'Hệ thống' : 'Chung'}
                  </span>
                  {session.status === 'Closed' ? (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Đã đóng
                    </span>
                  ) : !session.supportId ? (
                    <span className="text-xs text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Đang chờ
                    </span>
                  ) : session.supportId === user?.id ? (
                    <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full font-medium">Của bạn</span>
                  ) : null}
                </div>
                {(unreadCounts[session.id] || 0) > 0 && (
                  <span className="absolute top-3 right-3 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main: Chat Area */}
      <div className="flex-1 flex flex-col bg-white animate-[slideUp_0.5s_ease-out]">
        {activeSession ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white shadow-sm z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">
                    {activeSession.topic === 'OrderIssue' ? 'Vấn đề đơn hàng' : activeSession.topic === 'SystemIssue' ? 'Lỗi hệ thống' : 'Hỗ trợ chung'}
                  </h3>
                  <p className="text-xs text-gray-500">Khách hàng ID: {activeSession.userId}</p>
                </div>
              </div>
              <div>
                {activeSession.status === 'Closed' ? (
                  <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" /> Phiên đã đóng
                  </span>
                ) : !activeSession.supportId ? (
                  <button 
                    onClick={() => handleClaimSession(activeSession)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                  >
                    Tiếp nhận hỗ trợ
                  </button>
                ) : activeSession.supportId === user?.id ? (
                  <button 
                    onClick={() => chatService.closeSession(activeSession.id)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Đóng phiên
                  </button>
                ) : (
                  <span className="text-sm text-gray-500">Đã có người hỗ trợ</span>
                )}
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-[#F8F9FA] flex flex-col gap-4">
              {activeMessages.map((msg) => {
                const isMe = msg.senderId === user?.id;
                return (
                  <div key={msg.id} className={`flex flex-col max-w-[70%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-gray-500 font-medium">
                        {isMe ? 'Bạn' : (msg.senderRole === 'Customer' ? 'Khách hàng' : msg.senderRole)}
                      </span>
                    </div>
                    <div className={`p-3 rounded-2xl text-sm font-medium ${isMe ? 'bg-blue-600 text-white rounded-tr-sm shadow-sm' : 'bg-white text-gray-900 border border-gray-200 rounded-tl-sm shadow-sm'}`}>
                      {msg.content}
                    </div>
                    <span className="text-[10px] text-gray-400 mt-1 px-1">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-100">
              {activeSession.status === 'Closed' ? (
                <div className="text-center py-2 text-sm text-gray-500 bg-gray-50 rounded-lg">
                  Phiên hỗ trợ này đã đóng
                </div>
              ) : (
                <form onSubmit={handleSendMessage} className="flex gap-3">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Nhập tin nhắn hỗ trợ..."
                    disabled={activeSession.supportId !== user?.id}
                    className="flex-1 bg-gray-50 border border-gray-200 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl px-4 py-3 text-sm text-gray-900 font-medium placeholder:text-gray-500 transition-all disabled:opacity-50"
                  />
                  <button 
                    type="submit"
                    disabled={!inputText.trim() || activeSession.supportId !== user?.id}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 text-white px-5 rounded-xl transition-colors flex items-center justify-center shadow-sm"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <Clock className="w-16 h-16 mb-4 text-gray-200" />
            <p className="text-lg font-medium text-gray-600">Chưa chọn phiên hỗ trợ</p>
            <p className="text-sm">Chọn một cuộc trò chuyện từ danh sách bên trái để bắt đầu</p>
          </div>
        )}
      </div>
    </div>
  );
}
