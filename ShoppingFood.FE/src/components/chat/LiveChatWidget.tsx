import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, User, Bot } from 'lucide-react';
import { useAuth } from '../../hooks';
import { chatService } from '../../services';
import type { IChatSession, IChatMessage, ChatTopic } from '../../interfaces';

export function LiveChatWidget() {
  const { user, token } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [session, setSession] = useState<IChatSession | null>(null);
  const [messages, setMessages] = useState<IChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check for existing session on mount or when opened
  useEffect(() => {
    if (user && token && isOpen) {
      chatService.getCurrentSession().then(res => {
        if (res.data) {
          setSession(res.data);
          setMessages(res.data.messages || []);
        } else {
          setSession(null);
          setMessages([]);
        }
      }).catch(err => console.error("Failed to fetch current session", err));
    }
  }, [user, token, isOpen]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Connect to SignalR when session is established
  useEffect(() => {
    if (session && token) {
      setIsConnecting(true);
      
      const connect = async () => {
        await chatService.startConnection(token);
        await chatService.joinSession(session.id);
        
        chatService.onReceiveMessage((message: IChatMessage) => {
          setMessages(prev => {
            const existsById = prev.some(m => m.id === message.id);
            if (existsById) return prev;

            // Look for matching optimistic message to replace in-place
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
        });

        chatService.onSessionClosed(() => {
          setSession(null);
          setMessages([]);
        });

        setIsConnecting(false);
      };

      connect();

      return () => {
        chatService.offReceiveMessage(() => {});
        chatService.offSessionClosed(() => {});
        chatService.leaveSession(session.id);
        chatService.stopConnection();
      };
    }
  }, [session, token]);

  const handleStartChat = async (topic: ChatTopic) => {
    try {
      setIsConnecting(true);
      const res = await chatService.createSession({ topic });
      if (res.data) {
        setSession(res.data);
        // Load existing messages if any
        if (res.data.id) {
            const history = await chatService.getHistory(res.data.id);
            if (history.data) {
                setMessages(history.data);
            }
        }
      }
    } catch (error) {
      console.error('Failed to start chat session', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !session || !user) return;

    let tempId = Date.now().toString();
    try {
      const newMsg: IChatMessage = {
        id: tempId,
        sessionId: session.id,
        senderId: user.id,
        senderRole: user.role,
        content: inputText.trim(),
        createdAt: new Date().toISOString()
      };
      setMessages(prev => [...prev, newMsg]);
      setInputText('');

      await chatService.sendMessage(session.id, user.id, user.role, newMsg.content);
    } catch (error) {
      console.error('Failed to send message', error);
      // Remove optimistic message on failure
      setMessages(prev => prev.filter(m => m.id !== tempId));
    }
  };

  if (!user) return null; // Only logged in users can chat

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen ? (
        <div className="w-80 sm:w-96 h-[500px] max-h-[80vh] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden mb-4 transition-all transform origin-bottom-right duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-red-500 p-4 text-white flex justify-between items-center shadow-md">
            <div>
              <h3 className="font-semibold text-lg">Hỗ trợ trực tuyến</h3>
              <p className="text-xs text-orange-100">
                {session ? 'Đang kết nối với nhân viên' : 'Chọn chủ đề để bắt đầu'}
              </p>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 flex flex-col gap-4">
            {!session ? (
              <div className="flex flex-col gap-3 justify-center h-full">
                <p className="text-sm text-gray-500 text-center mb-2">Vui lòng chọn chủ đề bạn cần hỗ trợ:</p>
                <button 
                  onClick={() => handleStartChat('OrderIssue')}
                  className="w-full bg-white border border-orange-200 text-orange-600 hover:bg-orange-50 font-medium py-3 px-4 rounded-xl shadow-sm transition-all text-left flex items-center justify-between group"
                >
                  <span>Vấn đề đơn hàng</span>
                  <span className="text-orange-400 group-hover:translate-x-1 transition-transform">→</span>
                </button>
                <button 
                  onClick={() => handleStartChat('SystemIssue')}
                  className="w-full bg-white border border-blue-200 text-blue-600 hover:bg-blue-50 font-medium py-3 px-4 rounded-xl shadow-sm transition-all text-left flex items-center justify-between group"
                >
                  <span>Lỗi hệ thống</span>
                  <span className="text-blue-400 group-hover:translate-x-1 transition-transform">→</span>
                </button>
                <button 
                  onClick={() => handleStartChat('General')}
                  className="w-full bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 font-medium py-3 px-4 rounded-xl shadow-sm transition-all text-left flex items-center justify-between group"
                >
                  <span>Khác (Thông tin chung)</span>
                  <span className="text-gray-400 group-hover:translate-x-1 transition-transform">→</span>
                </button>
              </div>
            ) : (
              <>
                {messages.length === 0 && (
                  <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                    Gửi tin nhắn đầu tiên để bắt đầu trò chuyện...
                  </div>
                )}
                {messages.map((msg) => {
                  const isMe = msg.senderId === user.id;
                  return (
                    <div key={msg.id} className={`flex flex-col max-w-[80%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}>
                      <div className={`p-3 rounded-2xl text-sm font-medium ${isMe ? 'bg-orange-500 text-white rounded-tr-sm' : 'bg-white text-gray-900 border border-gray-200 rounded-tl-sm shadow-sm'}`}>
                        {msg.content}
                      </div>
                      <span className="text-[10px] text-gray-400 mt-1 px-1">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </>
            )}
            
            {isConnecting && !session && (
               <div className="absolute inset-0 bg-white/80 flex items-center justify-center backdrop-blur-sm z-10">
                 <div className="flex flex-col items-center gap-2 text-orange-500">
                    <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm font-medium">Đang kết nối...</span>
                 </div>
               </div>
            )}
          </div>

          {/* Footer Input */}
          {session && (
            <div className="p-3 bg-white border-t border-gray-100">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Nhập tin nhắn..."
                  className="flex-1 bg-gray-50 border-transparent focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-200 rounded-full px-4 py-2 text-sm text-gray-900 font-medium placeholder-gray-400 transition-all"
                />
                <button 
                  type="submit"
                  disabled={!inputText.trim()}
                  className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white p-2.5 rounded-full transition-colors flex items-center justify-center"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-4 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 group flex items-center justify-center"
        >
          <MessageCircle className="w-7 h-7 group-hover:rotate-12 transition-transform" />
        </button>
      )}
    </div>
  );
}
