import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { chatService } from '../services';
import { useAuth } from './useAuth';
import type { IChatMessage } from '../interfaces';

export function useSellerChatWatcher() {
  const [hasUnread, setHasUnread] = useState(false);
  const { token, user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!token || user?.role !== 'Seller') return;

    let isSubscribed = true;

    const init = async () => {
      try {
        await chatService.startConnection(token);
        if (user?.restaurantId) {
          await chatService.joinSellerInbox(user.restaurantId);
        }

        const res = await chatService.getSellerOrderChats();
        if (isSubscribed && res.data) {
          const storedLastRead = localStorage.getItem('seller_chat_last_read');
          let lastReadTimes: Record<string, string> = {};
          try {
            if (storedLastRead) lastReadTimes = JSON.parse(storedLastRead);
          } catch (e) {
            console.error('Failed to parse seller_chat_last_read', e);
          }

          // Kiểm tra xem có tin nhắn nào của Customer mà chưa đọc không
          const hasUnreadMessages = res.data.some(s => {
            const lastRead = lastReadTimes[s.id];
            if (!s.lastMessageAt) return false;
            
            const msgDateStr = String(s.lastMessageAt);
            const msgDate = msgDateStr.endsWith('Z') ? new Date(msgDateStr) : new Date(msgDateStr + 'Z');
            return !lastRead || msgDate > new Date(lastRead);
          });

          if (location.pathname !== '/seller/chat') {
            setHasUnread(hasUnreadMessages);
          } else {
            setHasUnread(false);
          }
        }
      } catch (error) {
        console.error('SellerChatWatcher init failed', error);
      }
    };

    init();

    const handleReceive = (msg: IChatMessage) => {
      if (msg.senderRole === 'Customer') {
        if (location.pathname !== '/seller/chat') {
          setHasUnread(true);
        }
      }
    };

    const checkStorage = () => {
      init();
    };
    window.addEventListener('seller_chat_read_updated', checkStorage);

    chatService.onOrderChatMessage(handleReceive);
    chatService.onReceiveMessage(handleReceive);

    return () => {
      isSubscribed = false;
      chatService.offOrderChatMessage(handleReceive);
      chatService.offReceiveMessage(handleReceive);
      window.removeEventListener('seller_chat_read_updated', checkStorage);
    };
  }, [token, user, location.pathname]);

  return hasUnread;
}
