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
  ServerCog
} from 'lucide-react';
import { useAuth } from '../../../hooks';
import { ROUTES } from '../../../routes/routeConfig';
import { DashboardLayout } from '../DashboardLayout';

export function AdminLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate(ROUTES.LOGIN);
  };

  const navItems = [
    { name: 'Tổng quan', path: ROUTES.ADMIN_DASHBOARD, icon: LayoutDashboard },
    { name: 'Người dùng', path: '/admin/users', icon: Users },
    { name: 'Quản lý Nhà hàng', path: '/admin/restaurants', icon: Store },
    { name: 'Bảng điều phối', path: ROUTES.ADMIN_DISPATCH, icon: Truck },
    { name: 'Giám sát Shipper', path: ROUTES.ADMIN_SHIPPERS, icon: ShieldAlert },
    { name: 'Lịch sử điều phối', path: ROUTES.ADMIN_DISPATCH_HISTORY, icon: History },
    { name: 'Phân quyền', path: '/admin/permissions', icon: ShieldCheck },
    { name: 'Duyệt đối tác', path: '/admin/approvals', icon: Store },
    { name: 'Khuyến mãi hệ thống', path: '/admin/discounts', icon: Tag },
    { name: 'Flash Sale', path: ROUTES.ADMIN_FLASH_SALES, icon: Zap },
    { name: 'Cấu hình Điểm', path: '/admin/loyalty', icon: Award },
    { name: 'Gửi thông báo', path: ROUTES.ADMIN_NOTIFICATIONS, icon: BellRing },
    { name: 'Xử lý khiếu nại', path: ROUTES.ADMIN_INCIDENTS, icon: ShieldAlert },
    { name: 'Quản lý FAQ', path: ROUTES.ADMIN_FAQ, icon: HelpCircle },
    { name: 'Live Chat', path: ROUTES.ADMIN_CHAT, icon: MessageSquare },
    { name: 'Cấu hình danh mục', path: '/admin/settings', icon: Settings },
    { name: 'Thiết lập hệ thống', path: '/admin/system-config', icon: ServerCog },
    { name: 'Chính sách & Pháp lý', path: '/admin/legal-settings', icon: ShieldCheck },
    { name: 'Hồ sơ cá nhân', path: '/admin/profile', icon: User },
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
