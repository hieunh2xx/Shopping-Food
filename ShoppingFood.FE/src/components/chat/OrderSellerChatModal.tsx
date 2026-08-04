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
}

export function OrderSellerChatModal({
  isOpen,
  onClose,
  orderId,
  sessionId: initialSessionId,
  restaurantId,
  title,
  isSeller = false,
  sessionStatus,
}: OrderSellerChatModalProps) {
  const { user, token } = useAuth();
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId ?? null);
  const [messages, setMessages] = useState<IChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleReceive = useCallback((message: IChatMessage) => {
    if (sessionId && message.sessionId !== sessionId) return;
    setMessages(prev => {
      if (prev.some(m => m.id === message.id)) return prev;
      return [...prev, message];
    });
  }, [sessionId]);

  useEffect(() => {
    if (!isOpen || !token || !user) return;

    let active = true;
    const setup = async () => {
      setLoading(true);
      try {
        await chatService.startConnection(token);
        if (isSeller && restaurantId) {
          await chatService.joinSellerInbox(restaurantId);
        }

        let sid = initialSessionId ?? sessionId;
        if (!sid && !isSeller) {
          const res = await chatService.createOrderSession(orderId);
          if (res.error || !res.data) {
            toast.error(res.message);
            return;
          }
          sid = res.data.id;
          setSessionId(sid);
          setMessages(res.data.messages || []);
        } else if (!sid && isSeller) {
          toast('Khách chưa gửi tin nhắn về đơn này.', { icon: '💬' });
          return;
        }

        if (sid && active) {
          setSessionId(sid);
          await chatService.joinSession(sid);
          const history = await chatService.getHistory(sid);
          if (!history.error && history.data) {
            setMessages(history.data);
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
      if (sessionId) chatService.leaveSession(sessionId).catch(() => undefined);
    };
  }, [isOpen, token, user, orderId, initialSessionId, isSeller, restaurantId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim() || !sessionId || !user || !token) return;
    const content = inputText.trim();
    setInputText('');
    setSending(true);
    try {
      await chatService.sendMessage(sessionId, user.id, user.role, content);
    } catch {
      toast.error('Gửi tin nhắn thất bại');
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
              const mine = m.senderId === user?.id;
              return (
                <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${mine ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-800'}`}>
                    {m.content}
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
                className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                disabled={loading || !sessionId}
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={loading || sending || !inputText.trim() || !sessionId}
                className="p-2.5 rounded-xl bg-orange-500 text-white disabled:opacity-50 hover:bg-orange-600"
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
