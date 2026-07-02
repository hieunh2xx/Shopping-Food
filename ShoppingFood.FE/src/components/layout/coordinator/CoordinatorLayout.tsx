import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  History,
  ShieldCheck,
  UserCheck,
  ShieldAlert,
  User
} from 'lucide-react';
import { useAuth } from '../../../hooks';
import { ROUTES } from '../../../routes/routeConfig';
import { DashboardLayout } from '../DashboardLayout';

export function CoordinatorLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate(ROUTES.LOGIN);
  };

  const navItems = [
    { name: 'Bảng điều phối', path: ROUTES.COORDINATOR_DISPATCH, icon: LayoutDashboard },
    { name: 'Giám sát Shipper', path: ROUTES.COORDINATOR_SHIPPERS, icon: ShieldAlert },
    { name: 'Lịch sử điều phối', path: ROUTES.COORDINATOR_HISTORY, icon: History },
    { name: 'Xử lý khiếu nại', path: ROUTES.COORDINATOR_INCIDENTS, icon: ShieldCheck },
    { name: 'Hồ sơ cá nhân', path: '/coordinator/profile', icon: User },
  ];

  return (
    <DashboardLayout
      navItems={navItems}
      brandName="Coordinator Panel"
      brandIcon={UserCheck}
      brandPath={ROUTES.HOME}
      userRoleName="Điều phối viên"
      onLogout={handleLogout}
    />
  );
}
