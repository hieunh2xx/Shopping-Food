import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  Settings,
  Store
} from 'lucide-react';
import { useAuth } from '../../../hooks';
import { ROUTES } from '../../../routes/routeConfig';
import { DashboardLayout } from '../DashboardLayout';

export function SellerLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate(ROUTES.LOGIN);
  };

  const navItems = [
    { name: 'Tổng quan', path: ROUTES.SELLER_DASHBOARD, icon: LayoutDashboard },
    { name: 'Quản lý đơn hàng', path: '/seller/orders', icon: ShoppingBag },
    { name: 'Thực đơn', path: ROUTES.SELLER_PRODUCTS, icon: Package },
    { name: 'Thông tin cửa hàng', path: '/seller/settings', icon: Settings },
  ];

  return (
    <DashboardLayout
      navItems={navItems}
      brandName="Seller Center"
      brandIcon={Store}
      brandPath={ROUTES.HOME}
      userRoleName="Đối tác bán hàng"
      onLogout={handleLogout}
    />
  );
}
