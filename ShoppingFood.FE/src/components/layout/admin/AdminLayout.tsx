import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  Store,
  ChefHat,
  ShieldCheck
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
    { name: 'Phân quyền', path: '/admin/permissions', icon: ShieldCheck },
    { name: 'Duyệt đối tác', path: '/admin/approvals', icon: Store },
    { name: 'Cấu hình hệ thống', path: '/admin/settings', icon: Settings },
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
