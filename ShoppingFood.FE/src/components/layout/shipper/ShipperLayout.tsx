import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  History, 
  TrendingUp, 
  User, 
  Bike,
  FileText
} from 'lucide-react';
import { useAuth } from '../../../hooks';
import { ROUTES } from '../../../routes/routeConfig';
import { DashboardLayout } from '../DashboardLayout';

export function ShipperLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate(ROUTES.LOGIN);
  };

  const navItems = [
    { name: 'Tổng quan', path: ROUTES.SHIPPER_DASHBOARD, icon: LayoutDashboard },
    { name: 'Lịch sử giao hàng', path: ROUTES.SHIPPER_HISTORY, icon: History },
    { name: 'Thu nhập', path: ROUTES.SHIPPER_INCOME, icon: TrendingUp },
    { name: 'Ví & Công nợ COD', path: ROUTES.SHIPPER_WALLET, icon: FileText },
    { name: 'Thông tin tài xế', path: ROUTES.SHIPPER_PROFILE, icon: User },
  ];

  return (
    <DashboardLayout
      navItems={navItems}
      brandName="Shipper Hub"
      brandIcon={Bike}
      brandPath={ROUTES.HOME}
      userRoleName="Đối tác giao hàng"
      onLogout={handleLogout}
    />
  );
}
