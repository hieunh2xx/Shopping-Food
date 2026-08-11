import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { chatService } from '../services';
import { useAuth } from './useAuth';
import type { IChatMessage } from '../interfaces';
import { ROUTES } from '../routes/routeConfig';
import {
  CUSTOMER_CHAT_READ_EVENT,
  getCustomerTotalUnread,
  incrementCustomerSessionUnread,
  syncCustomerUnreadFromSessions,
} from '../utils/customerChatUnread';

/** Session đang mở trên trang Tin nhắn — watcher bỏ qua tăng unread. */
let activeCustomerChatSessionId: string | null = null;
let activeCustomerRelatedSessionIds: string[] = [];

export function setActiveCustomerChatSession(
  sessionId: string | null,
  relatedSessionIds: string[] = []
) {
  activeCustomerChatSessionId = sessionId;
  activeCustomerRelatedSessionIds = relatedSessionIds;
}

function isActiveCustomerThread(sessionId: string) {
  if (!sessionId || !activeCustomerChatSessionId) return false;
  if (sessionId === activeCustomerChatSessionId) return true;
  return activeCustomerRelatedSessionIds.includes(sessionId);
}

export function useCustomerChatWatcher() {
  const [unreadCount, setUnreadCount] = useState(0);
  const { token, user, isAuthenticated } = useAuth();
  const location = useLocation();

  const refreshCount = useCallback(() => {
    setUnreadCount(getCustomerTotalUnread());
  }, []);

  useEffect(() => {
    if (!token || !isAuthenticated || user?.role !== 'Customer') {
      setUnreadCount(0);
      return;
    }

    let isSubscribed = true;

    const init = async () => {
      try {
        await chatService.startConnection(token);
        const res = await chatService.getCustomerChats();
        if (!isSubscribed) return;
        if (res.data) {
          syncCustomerUnreadFromSessions(res.data);
        }
        refreshCount();
      } catch (error) {
        console.error('CustomerChatWatcher init failed', error);
        refreshCount();
      }
    };

    void init();

    const handleReceive = (msg: IChatMessage) => {
      const fromStore = msg.senderRole === 'Seller' || msg.senderRole === 'Mall';
      if (!fromStore) return;

      // Đang xem đúng đoạn chat → coi như đã đọc (page sẽ markRead)
      if (location.pathname === ROUTES.MESSAGES && isActiveCustomerThread(msg.sessionId)) {
        refreshCount();
        return;
      }

      incrementCustomerSessionUnread(msg.sessionId, 1);
      refreshCount();
    };

    const onReadUpdated = () => refreshCount();

    window.addEventListener(CUSTOMER_CHAT_READ_EVENT, onReadUpdated);
    chatService.onOrderChatMessage(handleReceive);
    chatService.onReceiveMessage(handleReceive);

    return () => {
      isSubscribed = false;
      window.removeEventListener(CUSTOMER_CHAT_READ_EVENT, onReadUpdated);
      chatService.offOrderChatMessage(handleReceive);
      chatService.offReceiveMessage(handleReceive);
    };
  }, [token, isAuthenticated, user?.role, location.pathname, refreshCount]);

  return { unreadCount, hasUnread: unreadCount > 0 };
}
