import { useState, useEffect, useRef } from 'react';
import { Bell, Check, Loader2, Info, ShieldCheck, Heart, ChevronRight } from 'lucide-react';
import { notificationService } from '../../services';
import { notificationRealtimeService } from '../../services/NotificationRealtimeService';
import { useAuth } from '../../hooks';
import type { INotificationDto } from '../../interfaces';
import { Modal } from '../common';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../routes/routeConfig';

/**
 * Thành phần Chuông Thông báo Thời gian thực (NotificationBell).
 * Nhận thông báo qua SignalR, đếm số lượng chưa đọc, hiển thị danh sách dạng dropdown menu, xem chi tiết trong modal và điều hướng thông minh theo từng loại sự kiện (đơn hàng, khiếu nại, duyệt hồ sơ, nộp COD).
 */
export function NotificationBell() {
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState<INotificationDto[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<INotificationDto | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Đóng dropdown khi click ra ngoài vùng hiển thị
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /**
   * Tải danh sách toàn bộ thông báo của người dùng từ API.
   */
  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const res = await notificationService.getAll();
      if (!res.error && res.data) {
        setNotifications(res.data);
        setUnreadCount(res.data.filter(n => !n.isRead).length);
      }
    } catch {
      // Bỏ qua lỗi
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id && token) {
      fetchNotifications();
    }

    if (!user?.id || !token) {
      return;
    }

    /**
     * Xử lý nhận thông báo Realtime từ SignalR Hub.
     */
    const onRealtime = (n: INotificationDto) => {
      setNotifications(prev => [n, ...prev.filter(x => x.id !== n.id)]);
      setUnreadCount(prev => prev + 1);
      toast(
        () => (
          <div style={{ maxWidth: 320 }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>{n.title}</div>
            {n.message ? (
              <div style={{ fontSize: 13, lineHeight: 1.4, opacity: 0.9 }}>
                {n.message.length > 160 ? `${n.message.slice(0, 160)}…` : n.message}
              </div>
            ) : null}
          </div>
        ),
        { icon: '🔔', duration: 5000 }
      );

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

  /**
   * Đóng/mở dropdown danh sách thông báo.
   */
  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      fetchNotifications();
    }
  };

  /**
   * Đánh dấu một thông báo cụ thể là đã đọc.
   * @param id - Mã thông báo
   */
  const handleMarkAsRead = async (id: string) => {
    try {
      // Cập nhật giao diện ngay lập tức (Optimistic UI)
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));

      const res = await notificationService.markAsRead(id);
      if (res.error) {
        fetchNotifications();
      }
    } catch {
      fetchNotifications();
    }
  };

  /**
   * Đánh dấu toàn bộ thông báo trong hộp thư là đã đọc.
   */
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

  /**
   * Định dạng chuỗi thời gian thông báo dạng tương đối (Vừa xong, X phút trước, X giờ trước).
   * @param dateStr - Chuỗi ngày tháng ISO
   */
  const formatTime = (dateStr: string) => {
    if (!dateStr) return '';
    try {
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

  /**
   * Trả về icon phù hợp với từng phân loại thông báo (Hệ thống, Đơn hàng, Giao hàng, Đánh giá).
   * @param type - Loại thông báo
   */
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

  /**
   * Kiểm tra thông báo có phải liên quan đến tin nhắn chat hay không.
   */
  const isChatNotification = (n: INotificationDto) =>
    (n.title || '').toLowerCase().includes('tin nhắn');

  /**
   * Xác định đường dẫn điều hướng URL khi người dùng nhấn vào thông báo dựa trên vai trò và nội dung.
   * @param n - Dữ liệu thông báo
   */
  const getNotificationUrl = (n: INotificationDto): string | null => {
    const role = user?.role;
    const chatNotif = isChatNotification(n);

    // Tin nhắn đơn hàng → trang/hộp chat
    if (chatNotif) {
      if (role === 'Seller' || role === 'Mall') {
        return n.targetId
          ? `${ROUTES.SELLER_CHAT}?orderId=${n.targetId}`
          : ROUTES.SELLER_CHAT;
      }
      if (role === 'Customer' && n.targetId) {
        return `${ROUTES.MESSAGES}?orderId=${n.targetId}`;
      }
    }

    switch (n.notificationType) {
      case 'Order':
        if (role === 'Customer') return null;
        if (role === 'Seller' || role === 'Mall') {
          const lower = n.title?.toLowerCase() || '';
          if (lower.includes('tài xế hủy') || lower.includes('hủy giao')) {
            return n.targetId
              ? `${ROUTES.SELLER_SHIPPER_CANCELS}?orderId=${n.targetId}`
              : ROUTES.SELLER_SHIPPER_CANCELS;
          }
          return n.targetId
            ? `${ROUTES.SELLER_ORDERS}?orderId=${n.targetId}`
            : ROUTES.SELLER_ORDERS;
        }
        if (role === 'Shipper') return ROUTES.SHIPPER_DASHBOARD;
        if (role === 'Admin') {
          const lower = n.title?.toLowerCase() || '';
          if (lower.includes('khiếu nại') || lower.includes('sự cố') || lower.includes('giải trình')) {
            return n.targetId
              ? `${ROUTES.ADMIN_INCIDENTS}?orderId=${n.targetId}`
              : ROUTES.ADMIN_INCIDENTS;
          }
          return ROUTES.ADMIN_DASHBOARD;
        }
        if (role === 'Coordinator') {
          const lower = n.title?.toLowerCase() || '';
          if (lower.includes('khiếu nại') || lower.includes('sự cố') || lower.includes('báo cáo') || lower.includes('giải trình')) {
            return n.targetId
              ? `${ROUTES.COORDINATOR_INCIDENTS}?orderId=${n.targetId}`
              : ROUTES.COORDINATOR_INCIDENTS;
          }
          return ROUTES.COORDINATOR_DASHBOARD;
        }
        return null;
      case 'Delivery':
        if (role === 'Customer') return null;
        if (role === 'Shipper') return ROUTES.SHIPPER_DASHBOARD;
        if (role === 'Admin') {
          const lower = n.title?.toLowerCase() || '';
          if (lower.includes('khiếu nại') || lower.includes('sự cố') || lower.includes('giải trình')) {
            return n.targetId
              ? `${ROUTES.ADMIN_INCIDENTS}?orderId=${n.targetId}`
              : ROUTES.ADMIN_INCIDENTS;
          }
          return ROUTES.ADMIN_DASHBOARD;
        }
        if (role === 'Coordinator') {
          const lower = n.title?.toLowerCase() || '';
          if (lower.includes('khiếu nại') || lower.includes('sự cố') || lower.includes('giải trình')) {
            return n.targetId
              ? `${ROUTES.COORDINATOR_INCIDENTS}?orderId=${n.targetId}`
              : ROUTES.COORDINATOR_INCIDENTS;
          }
          return ROUTES.COORDINATOR_DASHBOARD;
        }
        return null;
      case 'Review':
        if (role === 'Seller' || role === 'Mall') {
          const lower = n.title?.toLowerCase() || '';
          if (lower.includes('flash sale')) return ROUTES.SELLER_FLASH_SALES;
          return ROUTES.SELLER_REVIEWS;
        }
        if (role === 'Customer' && n.targetId) return `/products/${n.targetId}`;
        if (role === 'Admin') {
          const lower = n.title?.toLowerCase() || '';
          if (lower.includes('flash sale')) return ROUTES.ADMIN_FLASH_SALES;
          return ROUTES.ADMIN_REVIEW_REPORTS;
        }
        return null;
      case 'Loyalty':
        if (role === 'Customer') return `${ROUTES.PROFILE}?tab=loyalty`;
        if (role === 'Admin') return ROUTES.ADMIN_MEMBER_RANKS;
        return null;
      case 'System': {
        const lower = n.title?.toLowerCase() || '';
        const msgLower = n.message?.toLowerCase() || '';
        const isApplicationSupplement =
          lower.includes('bổ sung') ||
          msgLower.includes('hồ sơ → lịch sử đăng ký') ||
          msgLower.includes('bổ sung thông tin') ||
          lower.includes('nâng cấp mall cần bổ sung') ||
          lower.includes('yêu cầu đối tác cần bổ sung') ||
          lower.includes('đăng ký tài xế cần bổ sung');

        if (role === 'Admin') {
          if (lower.includes('nộp cod') || lower.includes('cod từ tài xế') || lower.includes('yêu cầu nộp cod')) {
            return ROUTES.ADMIN_COD_REMITTANCES;
          }
          if (lower.includes('hạng thành viên') || lower.includes('xếp hạng')) {
            return ROUTES.ADMIN_MEMBER_RANKS;
          }
          if (lower.includes('đăng ký') || lower.includes('yêu cầu') || lower.includes('ứng tuyển') || lower.includes('bổ sung')) {
            return ROUTES.ADMIN_APPLICATIONS;
          }
          if (lower.includes('sản phẩm')) {
            return ROUTES.ADMIN_PRODUCTS;
          }
          if (lower.includes('đánh giá')) {
            return ROUTES.ADMIN_REVIEW_REPORTS;
          }
          if (lower.includes('sự cố') || lower.includes('khiếu nại') || lower.includes('báo cáo') || lower.includes('giải trình')) {
            return n.targetId
              ? `${ROUTES.ADMIN_INCIDENTS}?orderId=${n.targetId}`
              : ROUTES.ADMIN_INCIDENTS;
          }
          return null;
        }

        // Người nộp đơn: Bổ sung hồ sơ
        if (isApplicationSupplement) {
          if ((lower.includes('mall') || msgLower.includes('mall')) && (role === 'Seller' || role === 'Mall')) {
            return ROUTES.SELLER_MALL_APPLICATION;
          }
          return `${ROUTES.PROFILE}?tab=applications`;
        }

        if (role === 'Shipper') {
          if (lower.includes('nộp cod') || lower.includes('cod')) return ROUTES.SHIPPER_WALLET;
          if (lower.includes('uy tín')) return ROUTES.SHIPPER_PROFILE + '?tab=reputation';
          if (lower.includes('giải trình') && n.targetId) {
            return `${ROUTES.SHIPPER_DASHBOARD}?explanationOrderId=${n.targetId}`;
          }
          return null;
        }
        if (role === 'Seller' || role === 'Mall') {
          if (lower.includes('tài xế') || lower.includes('hủy giao') || (lower.includes('đơn hàng') && lower.includes('hủy'))) {
            return n.targetId
              ? `${ROUTES.SELLER_SHIPPER_CANCELS}?orderId=${n.targetId}`
              : ROUTES.SELLER_SHIPPER_CANCELS;
          }
          if (lower.includes('đơn hàng') || lower.includes('sự cố')) {
            return n.targetId
              ? `${ROUTES.SELLER_ORDERS}?orderId=${n.targetId}&status=Cancelled`
              : ROUTES.SELLER_ORDERS;
          }
          return null;
        }
        if (role === 'Coordinator') {
          if (lower.includes('nộp cod') || lower.includes('cod từ tài xế') || lower.includes('yêu cầu nộp cod')) {
            return ROUTES.COORDINATOR_COD_REMITTANCES;
          }
          if (lower.includes('sự cố') || lower.includes('khiếu nại') || lower.includes('báo cáo') || lower.includes('giải trình')) {
            return n.targetId
              ? `${ROUTES.COORDINATOR_INCIDENTS}?orderId=${n.targetId}`
              : ROUTES.COORDINATOR_INCIDENTS;
          }
          return ROUTES.COORDINATOR_DASHBOARD;
        }
        return null;
      }
      default:
        return null;
    }
  };

  /**
   * Kiểm tra thông báo có phải là thông báo đơn hàng của khách hàng hay không.
   */
  const isCustomerOrderNav = (n: INotificationDto, role?: string) => {
    if (role !== 'Customer') return false;
    if (n.notificationType === 'Order' || n.notificationType === 'Delivery') return true;
    if (n.notificationType === 'System' && (n.title?.toLowerCase() || '').includes('đơn hàng')) return true;
    return false;
  };

  /**
   * Xử lý khi nhấn vào một thông báo trong danh sách: đánh dấu đã đọc và mở modal chi tiết.
   * @param n - Dữ liệu thông báo
   */
  const handleNotificationClick = (n: INotificationDto) => {
    if (!n.isRead) handleMarkAsRead(n.id);
    setSelectedNotification(n);
  };

  /**
   * Chuyển hướng tới trang liên quan từ modal chi tiết thông báo.
   */
  const handleNavigateFromModal = () => {
    if (!selectedNotification) return;
    const role = user?.role;
    const targetId = selectedNotification.targetId;
    const chatNotif = isChatNotification(selectedNotification);

    // Customer: tin nhắn → trang Tin nhắn; đơn hàng → drawer đơn
    if (role === 'Customer' && chatNotif && targetId) {
      setIsOpen(false);
      setSelectedNotification(null);
      navigate(`${ROUTES.MESSAGES}?orderId=${targetId}`);
      return;
    }

    if (role === 'Customer' && isCustomerOrderNav(selectedNotification, role) && targetId) {
      setIsOpen(false);
      setSelectedNotification(null);
      window.dispatchEvent(new CustomEvent('openOrdersTabWithDetail', {
        detail: { orderId: targetId, openChat: false },
      }));
      navigate(`${ROUTES.HOME}?track=true&orderId=${targetId}`);
      return;
    }

    const url = getNotificationUrl(selectedNotification);
    if (url) {
      setIsOpen(false);
      setSelectedNotification(null);
      navigate(url);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Nút Chuông */}
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

      {/* Menu Dropdown */}
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

          {/* Danh sách thông báo */}
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
                  onClick={() => handleNotificationClick(n)}
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
                    <p className="text-[11px] text-gray-500 leading-normal line-clamp-3">
                      {n.message}
                    </p>
                    <p className="text-[9px] text-gray-400 font-semibold mt-1">
                      {formatTime(n.createAt)}
                    </p>
                  </div>

                  {/* Unread Status Dot or Nav Arrow */}
                  <div className="flex flex-col justify-center items-end gap-1 flex-shrink-0">
                    {!n.isRead && (
                      <div className="w-2 h-2 rounded-full bg-orange-500" />
                    )}
                    {getNotificationUrl(n)
                      || isCustomerOrderNav(n, user?.role)
                      || isChatNotification(n) ? (
                      <ChevronRight className="w-4 h-4 text-gray-300" />
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Modal Chi tiết Thông báo */}
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

            <div className="pt-4 flex justify-end gap-3">
              <button
                onClick={() => setSelectedNotification(null)}
                className="px-6 py-2.5 bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-200 transition-all active:scale-95"
              >
                Đóng
              </button>
              {(getNotificationUrl(selectedNotification)
                || isCustomerOrderNav(selectedNotification, user?.role)
                || isChatNotification(selectedNotification)) && (
                <button
                  onClick={handleNavigateFromModal}
                  className="px-6 py-2.5 bg-orange-500 text-white text-sm font-semibold rounded-xl hover:bg-orange-600 transition-all active:scale-95 flex items-center gap-2"
                >
                  Đi đến trang <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
