import { useState, useEffect } from 'react';
import { chatService } from '../services';
import { useAuth } from './useAuth';
import type { IChatMessage } from '../interfaces';

/**
 * Hook tùy chỉnh Theo dõi Tin nhắn Hỗ trợ Khách hàng (useSupportChatWatcher).
 * Dành cho Admin và Nhân viên Điều phối (Coordinator) để nhận biết có phiên chat hỗ trợ mới hoặc tin nhắn khiếu nại chưa đọc từ khách hàng.
 * @param role - Vai trò của người dùng ('Admin' | 'Coordinator')
 */
export function useSupportChatWatcher(role: string | null) {
  const [hasUnread, setHasUnread] = useState(false);
  const { token } = useAuth();

  useEffect(() => {
    if (!token || (role !== 'Admin' && role !== 'Coordinator')) return;

    let isSubscribed = true;

    /**
     * Khởi tạo kết nối SignalR, tham gia nhóm hỗ trợ Admin/Coordinator và kiểm tra tin nhắn chưa xử lý.
     */
    const init = async () => {
      try {
        await chatService.startConnection(token);
        if (role === 'Admin') await chatService.joinAdminGroup();
        else if (role === 'Coordinator') await chatService.joinCoordinatorGroup();

        const res = await chatService.getOpenSessions();
        if (isSubscribed && res.data) {
          const storedLastRead = localStorage.getItem('chat_last_read');
          const lastReadTimes = storedLastRead ? JSON.parse(storedLastRead) : {};

          const hasUnreadMessages = res.data.some(s => {
            if (!s.supportId) return true;
            if (!s.messages) return false;
            const lastRead = lastReadTimes[s.id];
            return s.messages.some(m => {
              const msgDate = m.createdAt.endsWith('Z') ? new Date(m.createdAt) : new Date(m.createdAt + 'Z');
              return m.senderRole === 'Customer' && (!lastRead || msgDate > new Date(lastRead));
            });
          });

          setHasUnread(hasUnreadMessages);
        }
      } catch (error) {
        console.error('SupportChatWatcher init failed', error);
      }
    };

    init();

    /**
     * Xử lý khi có tin nhắn chat mới được gửi tới từ người dùng.
     */
    const handleReceive = (msg: IChatMessage) => {
      if (msg.senderRole !== 'Admin' && msg.senderRole !== 'Coordinator') {
        setHasUnread(true);
      }
    };

    /**
     * Xử lý khi có phiên hỗ trợ chat mới mở.
     */
    const handleNewSession = () => {
      setHasUnread(true);
    };

    chatService.onReceiveMessage(handleReceive);
    chatService.onNewSession(handleNewSession);

    const checkStorage = () => {
      init();
    };
    window.addEventListener('chat_read_updated', checkStorage);

    return () => {
      isSubscribed = false;
      chatService.offReceiveMessage(handleReceive);
      chatService.offNewSession(handleNewSession);
      window.removeEventListener('chat_read_updated', checkStorage);
    };
  }, [token, role]);

  return hasUnread;
}
