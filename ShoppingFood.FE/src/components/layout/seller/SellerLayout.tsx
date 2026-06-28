import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  Settings,
  Store,
  Layers,
  ListPlus
} from 'lucide-react';
import { useAuth } from '../../../hooks';
import { ROUTES } from '../../../routes/routeConfig';
import { DashboardLayout } from '../DashboardLayout';

export function SellerLayout() {
  const { user, logout, upgradeToMall } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate(ROUTES.LOGIN);
  };

  const navItems = [
    { name: 'Tổng quan', path: ROUTES.SELLER_DASHBOARD, icon: LayoutDashboard },
    { name: 'Quản lý đơn hàng', path: '/seller/orders', icon: ShoppingBag },
    { name: 'Thực đơn', path: ROUTES.SELLER_PRODUCTS, icon: Package },
    { name: 'Danh mục thực đơn', path: '/seller/categories', icon: Layers },
    { name: 'Tùy chọn Topping', path: '/seller/toppings', icon: ListPlus },
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
      extraAction={
        user?.role === 'Seller' && (
          <button 
            onClick={() => {
              const reason = window.prompt('Nhập lý do muốn lên Mall:');
              if (reason) upgradeToMall(reason);
            }}
            className="w-full flex items-center gap-2 mt-4 px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors"
          >
            Đăng ký lên Mall
          </button>
        )
      }
    />
  );
}
