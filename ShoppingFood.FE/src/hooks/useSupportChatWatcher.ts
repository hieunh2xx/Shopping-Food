import { useState, useEffect } from 'react';
import { chatService } from '../services';
import { useAuth } from './useAuth';
import type { IChatMessage } from '../interfaces';

export function useSupportChatWatcher(role: string | null) {
  const [hasUnread, setHasUnread] = useState(false);
  const { token } = useAuth();

  useEffect(() => {
    if (!token || (role !== 'Admin' && role !== 'Coordinator')) return;

    let isSubscribed = true;

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

    const handleReceive = (msg: IChatMessage) => {
      if (msg.senderRole !== 'Admin' && msg.senderRole !== 'Coordinator') {
        setHasUnread(true);
      }
    };

    const handleNewSession = () => {
      setHasUnread(true);
    };

    chatService.onReceiveMessage(handleReceive);
    chatService.onNewSession(handleNewSession);

    const checkStorage = () => {
      // We can trigger re-check here if needed
      // For now, if chat_last_read updates, we assume a session was read.
      // We should really re-evaluate all sessions, but to avoid API spam, we can just fetch if we want.
      init(); // Just re-init to be accurate
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
