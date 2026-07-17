import { useState, useEffect, useRef } from 'react';
import { Bell, Check, Loader2, Info, ShieldCheck, Heart } from 'lucide-react';
import { notificationService } from '../../services';
import { notificationRealtimeService } from '../../services/NotificationRealtimeService';
import { useAuth } from '../../hooks';
import type { INotificationDto } from '../../interfaces';
import { Modal } from '../common';
import toast from 'react-hot-toast';

export function NotificationBell() {
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState<INotificationDto[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<INotificationDto | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch notifications
  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const res = await notificationService.getAll();
      if (!res.error && res.data) {
        setNotifications(res.data);
        setUnreadCount(res.data.filter(n => !n.isRead).length);
      }
    } catch {
      // Fail silently
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    if (!user?.id || !token) {
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }

    const onRealtime = (n: INotificationDto) => {
      setNotifications(prev => [n, ...prev.filter(x => x.id !== n.id)]);
      setUnreadCount(prev => prev + 1);
      toast(n.title, { icon: '🔔' });

      // Phát sự kiện toàn cục để các trang có thể lắng nghe và cập nhật UI (vd: trạng thái duyệt sản phẩm)
      window.dispatchEvent(new CustomEvent('ON_REALTIME_NOTIFICATION', { detail: n }));
    };

    notificationRealtimeService.onNotification(onRealtime);
    notificationRealtimeService.startConnection(token, user.id).catch(() => undefined);

    return () => {
      notificationRealtimeService.offNotification(onRealtime);
      notificationRealtimeService.stopConnection().catch(() => undefined);
    };
  }, [user?.id, token]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      fetchNotifications();
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      // Optimistic UI update
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));

      const res = await notificationService.markAsRead(id);
      if (res.error) {
        // Revert on error
        fetchNotifications();
      }
    } catch {
      fetchNotifications();
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      
      const res = await notificationService.markAllAsRead();
      if (!res.error) {
        toast.success('Đã đọc toàn bộ thông báo');
      } else {
        fetchNotifications();
      }
    } catch {
      fetchNotifications();
    }
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      // Fix EF Core datetime2 stripping UTC kind: append Z if no timezone is provided
      let parseStr = dateStr;
      if (!parseStr.endsWith('Z') && !parseStr.includes('+') && parseStr.indexOf('-', 11) === -1) {
        parseStr += 'Z';
      }
      const date = new Date(parseStr);
      const diffMs = new Date().getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Vừa xong';
      if (diffMins < 60) return `${diffMins} phút trước`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours} giờ trước`;
      return date.toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' });
    } catch {
      return '';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'System':
        return <Info className="w-4 h-4 text-blue-500" />;
      case 'Order':
        return <ShieldCheck className="w-4 h-4 text-orange-500" />;
      case 'Delivery':
        return <Info className="w-4 h-4 text-purple-500" />;
      case 'Review':
        return <Heart className="w-4 h-4 text-rose-500" />;
      default:
        return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button 
        onClick={handleToggle}
        className="relative p-2.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
        title="Thông báo"
      >
        <Bell className="w-5.5 h-5.5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white ring-2 ring-white animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden z-50 transform origin-top-right transition-all">
          {/* Header */}
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <span className="font-bold text-gray-900 text-sm">Thông báo</span>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllAsRead}
                className="text-xs text-orange-600 hover:text-orange-700 font-semibold flex items-center gap-0.5 hover:underline"
              >
                <Check className="w-3.5 h-3.5" />
                Đọc tất cả
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
            {isLoading && notifications.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-gray-400">
                <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 text-center text-sm text-gray-400">
                Không có thông báo nào
              </div>
            ) : (
              notifications.map((n) => (
                <div 
                  key={n.id} 
                  onClick={() => {
                    if (!n.isRead) handleMarkAsRead(n.id);
                    setSelectedNotification(n);
                  }}
                  className={`p-4 flex gap-3 cursor-pointer transition-colors ${
                    n.isRead ? 'hover:bg-gray-50/50' : 'bg-orange-50/30 hover:bg-orange-50/50'
                  }`}
                >
                  {/* Type Icon */}
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex-shrink-0 flex items-center justify-center border border-gray-100">
                    {getNotificationIcon(n.notificationType)}
                  </div>

                  {/* Body */}
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className={`text-xs text-gray-900 leading-snug truncate ${!n.isRead ? 'font-bold text-gray-950' : 'font-medium'}`}>
                      {n.title}
                    </p>
                    <p className="text-[11px] text-gray-500 leading-normal line-clamp-2">
                      {n.message}
                    </p>
                    <p className="text-[9px] text-gray-400 font-semibold mt-1">
                      {formatTime(n.createAt)}
                    </p>
                  </div>

                  {/* Unread Status Dot */}
                  {!n.isRead && (
                    <div className="w-2 h-2 rounded-full bg-orange-500 mt-1.5 flex-shrink-0" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Notification Detail Modal */}
      <Modal
        isOpen={!!selectedNotification}
        onClose={() => setSelectedNotification(null)}
        title="Chi tiết thông báo"
      >
        {selectedNotification && (
          <div className="space-y-4 text-gray-900 mt-2">
            <div className="flex items-center gap-3 mb-4">
               <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100 shrink-0">
                 {getNotificationIcon(selectedNotification.notificationType)}
               </div>
               <div>
                  <h3 className="font-bold text-lg leading-tight">{selectedNotification.title}</h3>
                  <p className="text-xs text-gray-500 font-medium mt-1">
                    {formatTime(selectedNotification.createAt)}
                  </p>
               </div>
            </div>
            
            <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100 text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">
              {selectedNotification.message}
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={() => setSelectedNotification(null)}
                className="px-6 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-all active:scale-95"
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
