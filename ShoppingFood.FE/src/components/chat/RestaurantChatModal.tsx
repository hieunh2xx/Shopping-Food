import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { useAuth } from '../../hooks';
import { chatService } from '../../services/ChatService';
import type { IChatMessage } from '../../interfaces';
import toast from 'react-hot-toast';

export interface RestaurantChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantId: string;
  restaurantName?: string;
}

/**
 * Modal Chat Hỏi Đáp Trực Tiếp Với Nhà Hàng (RestaurantChatModal).
 * Phục vụ khách hàng trao đổi trực tiếp với quán khi đang xem menu (hỏi món, giờ mở cửa, giảm giá, topping...).
 */
export function RestaurantChatModal({
  isOpen,
  onClose,
  restaurantId,
  restaurantName,
}: RestaurantChatModalProps) {
  const { user, token } = useAuth();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<IChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeSessionRef = useRef<string | null>(null);

  /**
   * Callback nhận tin nhắn từ SignalR và cập nhật tin nhắn hiển thị.
   */
  const handleReceive = useCallback((message: IChatMessage) => {
    const activeSid = activeSessionRef.current;
    if (activeSid && message.sessionId !== activeSid) return;
    setMessages((prev) => {
      if (prev.some((m) => m.id === message.id)) return prev;
      const withoutTemp = prev.filter(
        (m) => !(m.id.startsWith('temp-') && m.content === message.content && m.senderId === message.senderId)
      );
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
    if (!token || !user || !restaurantId) return;

    let active = true;
    let joinedSid: string | null = null;

    const setup = async () => {
      setLoading(true);
      setMessages([]);
      try {
        await chatService.startConnection(token);
        const res = await chatService.createRestaurantSession(restaurantId);
        if (res.error || !res.data) {
          toast.error(res.message || 'Không tạo được phiên chat với cửa hàng');
          return;
        }
        const sid = res.data.id;
        if (!active) return;
        setSessionId(sid);
        setMessages(res.data.messages || []);
        activeSessionRef.current = sid;
        await chatService.joinSession(sid);
        joinedSid = sid;
        chatService.onOrderChatMessage(handleReceive);
        chatService.onReceiveMessage(handleReceive);
      } catch {
        toast.error('Không kết nối được chat.');
      } finally {
        if (active) setLoading(false);
      }
    };

    setup();

    return () => {
      active = false;
      chatService.offOrderChatMessage(handleReceive);
      chatService.offReceiveMessage(handleReceive);
      if (joinedSid) {
        chatService.leaveSession(joinedSid).catch(() => undefined);
      }
    };
  }, [isOpen, token, user, restaurantId, handleReceive]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /**
   * Xử lý gửi tin nhắn của khách hàng tới nhà hàng.
   * @param e - Sự kiện FormEvent
   */
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !sessionId || !user || !token) return;
    const content = inputText.trim();
    const tempId = `temp-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        sessionId,
        senderId: user.id,
        senderRole: user.role as IChatMessage['senderRole'],
        content,
        createdAt: new Date().toISOString(),
      },
    ]);
    setInputText('');
    setSending(true);
    try {
      await chatService.sendMessage(sessionId, user.id, user.role, content);
    } catch {
      toast.error('Gửi tin thất bại');
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={restaurantName ? `Chat · ${restaurantName}` : 'Nhắn tin với cửa hàng'}
      size="md"
    >
      <div className="flex flex-col h-[420px]">
        <div className="flex-1 overflow-y-auto space-y-3 p-1 mb-3">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
            </div>
          ) : messages.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-10">
              Hỏi cửa hàng về món, giờ mở cửa, khuyến mãi…
            </p>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderId?.toLowerCase() === user?.id?.toLowerCase();
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm font-medium whitespace-pre-wrap shadow-sm ${
                      isMe
                        ? 'bg-orange-600 text-white rounded-br-sm'
                        : 'bg-white text-slate-900 border border-slate-200 rounded-bl-sm'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={handleSend} className="flex gap-2 border-t border-gray-100 pt-3">
          <input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Nhập tin nhắn…"
            className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-500 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/40"
            disabled={loading || !sessionId}
          />
          <button
            type="submit"
            disabled={sending || loading || !inputText.trim() || !sessionId}
            className="px-4 py-2.5 rounded-xl bg-orange-600 text-white disabled:opacity-40 hover:bg-orange-700"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </Modal>
  );
}
