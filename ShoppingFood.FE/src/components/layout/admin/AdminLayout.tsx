import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Settings,
  Store,
  ChefHat,
  ShieldCheck,
  History,
  Truck,
  ShieldAlert,
  Tag,
  Award,
  Zap,
  BellRing,
  User,
  HelpCircle,
  MessageSquare,
  DollarSign,
  CreditCard,
  ServerCog,
  MessageSquareWarning,
  ShieldBan
} from 'lucide-react';
import { useAuth, useSupportChatWatcher } from '../../../hooks';
import { ROUTES } from '../../../routes/routeConfig';
import { DashboardLayout } from '../DashboardLayout';

export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const unreadChatCount = useSupportChatWatcher(user?.role || null);

  const handleLogout = () => {
    logout();
    navigate(ROUTES.LOGIN);
  };

  const navItems = [
    // Chung
    { name: 'Tổng quan', path: ROUTES.ADMIN_DASHBOARD, icon: LayoutDashboard, group: 'Chung' },
    { name: 'Hồ sơ cá nhân', path: '/admin/profile', icon: User, group: 'Chung' },

    // Quản lý tài khoản
    { name: 'Người dùng', path: '/admin/users', icon: Users, group: 'Quản lý tài khoản' },
    { name: 'Phân quyền', path: '/admin/permissions', icon: ShieldCheck, group: 'Quản lý tài khoản' },

    // Quản lý đối tác
    { name: 'Duyệt đối tác', path: '/admin/approvals', icon: Store, group: 'Quản lý đối tác' },
    { name: 'Quản lý Nhà hàng', path: '/admin/restaurants', icon: Store, group: 'Quản lý đối tác' },
    { name: 'Giám sát Shipper', path: ROUTES.ADMIN_SHIPPERS, icon: Truck, group: 'Quản lý đối tác' },

    // Vận hành
    { name: 'Lịch sử điều phối', path: ROUTES.ADMIN_DISPATCH_HISTORY, icon: History, group: 'Vận hành' },
    { name: 'Xử lý khiếu nại', path: ROUTES.ADMIN_INCIDENTS, icon: ShieldAlert, group: 'Vận hành' },
    { name: 'Live Chat', path: ROUTES.ADMIN_CHAT, icon: MessageSquare, group: 'Vận hành', badge: unreadChatCount },
    { name: 'Báo cáo Bình luận', path: '/admin/review-reports', icon: MessageSquareWarning, group: 'Vận hành' },
    { name: 'Báo cáo Sản phẩm', path: '/admin/product-reports', icon: ShieldAlert, group: 'Vận hành' },
    { name: 'Từ khóa bị cấm', path: '/admin/blacklist', icon: ShieldBan, group: 'Vận hành' },

    // Marketing & Ưu đãi
    { name: 'Khuyến mãi hệ thống', path: '/admin/discounts', icon: Tag, group: 'Marketing & Ưu đãi' },
    { name: 'Flash Sale', path: ROUTES.ADMIN_FLASH_SALES, icon: Zap, group: 'Marketing & Ưu đãi' },
    { name: 'Cấu hình Điểm', path: '/admin/loyalty', icon: Award, group: 'Marketing & Ưu đãi' },

    // Tài chính & Thanh toán
    { name: 'Tài chính', path: ROUTES.ADMIN_FINANCE, icon: DollarSign, group: 'Tài chính & Thanh toán' },
    { name: 'Thanh toán', path: ROUTES.ADMIN_PAYMENTS, icon: CreditCard, group: 'Tài chính & Thanh toán' },

    // Hệ thống
    { name: 'Cấu hình TC/Vận hành', path: '/admin/finance-config', icon: Settings, group: 'Hệ thống' },
    { name: 'Cấu hình Menu hệ thống', path: '/admin/settings', icon: Settings, group: 'Hệ thống' },
    { name: 'Thiết lập hệ thống', path: '/admin/system-config', icon: ServerCog, group: 'Hệ thống' },
    { name: 'Gửi thông báo', path: ROUTES.ADMIN_NOTIFICATIONS, icon: BellRing, group: 'Hệ thống' },
    { name: 'Quản lý FAQ', path: ROUTES.ADMIN_FAQ, icon: HelpCircle, group: 'Hệ thống' },
    { name: 'Chính sách & Pháp lý', path: '/admin/legal-settings', icon: ShieldCheck, group: 'Hệ thống' },
  ];

  return (
    <DashboardLayout
      navItems={navItems}
      brandName="Admin Panel"
      brandIcon={ChefHat}
      brandPath={ROUTES.HOME}
      userRoleName="Quản trị viên"
      onLogout={handleLogout}
    />
  );
}
