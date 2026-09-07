import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { useAuth } from '../../hooks';
import { chatService } from '../../services/ChatService';
import type { IChatMessage } from '../../interfaces';
import toast from 'react-hot-toast';

export interface OrderSellerChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  sessionId?: string;
  restaurantId?: string;
  title?: string;
  isSeller?: boolean;
  sessionStatus?: 'Open' | 'Closed';
  onSessionReady?: (sessionId: string, orderId: string) => void;
}

/**
 * Modal Trò Chuyện Trực Tuyến Giữa Khách Hàng và Nhà Hàng Theo Đơn (OrderSellerChatModal).
 * Phục vụ nhu cầu trao đổi trực tiếp về món ăn, yêu cầu thay đổi, hủy đơn hoặc hướng dẫn giao nhận.
 * Hỗ trợ giao tiếp Realtime SignalR Hub hai chiều cho cả Customer và Seller.
 */
export function OrderSellerChatModal({
  isOpen,
  onClose,
  orderId,
  sessionId: initialSessionId,
  restaurantId,
  title,
  isSeller = false,
  sessionStatus,
  onSessionReady,
}: OrderSellerChatModalProps) {
  const { user, token } = useAuth();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<IChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeSessionRef = useRef<string | null>(null);

  /**
   * Callback nhận tin nhắn từ SignalR và cập nhật vào danh sách tin nhắn.
   */
  const handleReceive = useCallback((message: IChatMessage) => {
    const activeSid = activeSessionRef.current;
    if (activeSid && message.sessionId !== activeSid) return;
    setMessages(prev => {
      if (prev.some(m => m.id === message.id)) return prev;
      // Thay thế tin nhắn tạm thời (optimistic) bằng tin nhắn chính thức từ server
      const withoutTemp = prev.filter(m => !(m.id.startsWith('temp-') && m.content === message.content && m.senderId === message.senderId));
      return [...withoutTemp, message];
    });
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setSessionId(null);
      setMessages([]);
      setInputText('');
      activeSessionRef.current = null;
      return;
    }
    if (!token || !user || !orderId) return;

    let active = true;
    let joinedSid: string | null = null;

    const setup = async () => {
      setLoading(true);
      setMessages([]);
      try {
        await chatService.startConnection(token);
        if (isSeller && restaurantId) {
          await chatService.joinSellerInbox(restaurantId);
        }

        let sid = initialSessionId ?? null;

        // Customer hoặc Seller đều có thể tạo/mở phiên chat đơn hàng
        if (!sid) {
          const res = await chatService.createOrderSession(orderId);
          if (res.error || !res.data) {
            toast.error(res.message || 'Không tạo được phiên chat');
            return;
          }
          sid = res.data.id;
          if (active) {
            setSessionId(sid);
            setMessages(res.data.messages || []);
            onSessionReady?.(sid, orderId);
          }
        }

        if (sid && active) {
          setSessionId(sid);
          activeSessionRef.current = sid;
          joinedSid = sid;
          await chatService.joinSession(sid);
          const history = await chatService.getHistory(sid, { take: 20 });
          if (!history.error && history.data?.items && active) {
            setMessages(history.data.items);
          }
        }
      } catch {
        toast.error('Không kết nối được chat realtime');
      } finally {
        if (active) setLoading(false);
      }
    };

    setup();
    chatService.onReceiveMessage(handleReceive);
    chatService.onOrderChatMessage(handleReceive);

    return () => {
      active = false;
      chatService.offReceiveMessage(handleReceive);
      chatService.offOrderChatMessage(handleReceive);
      if (joinedSid) chatService.leaveSession(joinedSid).catch(() => undefined);
    };
  }, [isOpen, token, user, orderId, initialSessionId, isSeller, restaurantId, handleReceive, onSessionReady]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /**
   * Xử lý gửi tin nhắn mới lên phòng chat đơn hàng.
   */
  const handleSend = async () => {
    if (!inputText.trim() || !sessionId || !user || !token) return;
    const content = inputText.trim();
    setInputText('');
    setSending(true);

    const optimistic: IChatMessage = {
      id: `temp-${Date.now()}`,
      sessionId,
      senderId: user.id,
      senderRole: user.role as IChatMessage['senderRole'],
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);

    try {
      await chatService.sendMessage(sessionId, user.id, user.role, content);
    } catch {
      toast.error('Gửi tin nhắn thất bại');
      setMessages(prev => prev.filter(m => m.id !== optimistic.id));
      setInputText(content);
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title ?? (isSeller ? 'Chat với khách hàng' : 'Nhắn tin người bán')}
      size="md"
      zIndexClass="z-[10500]"
    >
      <div className="flex flex-col h-80">
        {!isSeller && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-3">
            Sau khi người bán xác nhận, bạn không thể tự hủy. Hãy nhắn tin yêu cầu hủy — người bán sẽ quyết định.
          </p>
        )}

        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
            </div>
          ) : messages.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-8">Chưa có tin nhắn. Gửi lời nhắn đầu tiên.</p>
          ) : (
            messages.map(m => {
              const mine = m.senderId?.toLowerCase() === user?.id?.toLowerCase();
              return (
                <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm font-medium shadow-sm ${mine ? 'bg-orange-600 text-white' : 'bg-white text-slate-900 border border-slate-200'} ${m.id.startsWith('temp-') ? 'opacity-70' : ''}`}>
                    <span className={mine ? 'text-white' : 'text-slate-900'}>{m.content}</span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
          {sessionStatus === 'Closed' ? (
            <p className="text-sm text-center w-full text-gray-400 italic py-1">Phiên chat này đã kết thúc</p>
          ) : (
            <>
              <input
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Nhập tin nhắn..."
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-500 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                disabled={loading || !sessionId}
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={loading || sending || !inputText.trim() || !sessionId}
                className="p-2.5 rounded-xl bg-orange-600 text-white disabled:opacity-40 hover:bg-orange-700"
              >
                <Send className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
