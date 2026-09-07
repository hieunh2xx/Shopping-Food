import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { chatService } from '../services';
import { useAuth } from './useAuth';
import type { IChatMessage } from '../interfaces';

/**
 * Hook tùy chỉnh Theo dõi Tin nhắn Chưa đọc của Người bán hàng (useSellerChatWatcher).
 * Lắng nghe kênh SignalR theo nhà hàng (JoinSellerInbox) để hiển thị thông báo chấm đỏ/badge khi có tin nhắn hoặc đơn hàng chat mới.
 */
export function useSellerChatWatcher() {
  const [hasUnread, setHasUnread] = useState(false);
  const { token, user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const isSellerRole = user?.role === 'Seller' || user?.role === 'Mall';
    if (!token || !isSellerRole) return;

    let isSubscribed = true;

    /**
     * Khởi tạo kết nối SignalR, tham gia nhóm hộp thư nhà hàng và kiểm tra các cuộc trò chuyện chưa đọc.
     */
    const init = async () => {
      try {
        await chatService.startConnection(token);
        if (user?.sellerInfo?.restaurantId) {
          await chatService.joinSellerInbox(user.sellerInfo.restaurantId);
        }

        const res = await chatService.getSellerOrderChats();
        if (isSubscribed && res.data) {
          const storedLastRead = localStorage.getItem('seller_chat_last_read');
          let lastReadTimes: Record<string, string> = {};
          try {
            if (storedLastRead) lastReadTimes = JSON.parse(storedLastRead);
          } catch (e) {
            console.error('Lỗi khi đọc seller_chat_last_read từ localStorage', e);
          }

          // Kiểm tra xem có tin nhắn nào của Customer gửi mà quán chưa đọc không
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
        console.error('Lỗi khởi tạo SellerChatWatcher', error);
      }
    };

    init();

    /**
     * Xử lý khi có tin nhắn chat mới từ Khách hàng.
     */
    const handleReceive = (msg: IChatMessage) => {
      if (msg.senderRole === 'Customer') {
        if (location.pathname !== '/seller/chat') {
          setHasUnread(true);
        }
      }
    };

    /**
     * Xử lý khi có phiên chat theo đơn hàng mới được tạo.
     */
    const handleNewOrderChat = () => {
      if (location.pathname !== '/seller/chat') {
        setHasUnread(true);
      }
      init();
    };

    const checkStorage = () => {
      init();
    };
    window.addEventListener('seller_chat_read_updated', checkStorage);

    chatService.onOrderChatMessage(handleReceive);
    chatService.onReceiveMessage(handleReceive);
    chatService.onNewOrderChat(handleNewOrderChat);

    return () => {
      isSubscribed = false;
      chatService.offOrderChatMessage(handleReceive);
      chatService.offReceiveMessage(handleReceive);
      chatService.offNewOrderChat(handleNewOrderChat);
      window.removeEventListener('seller_chat_read_updated', checkStorage);
    };
  }, [token, user, location.pathname]);

  return hasUnread;
}
