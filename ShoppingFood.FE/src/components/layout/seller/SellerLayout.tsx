import { useNavigate, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  Settings,
  Store,
  Layers,
  ListPlus,
  ShieldAlert,
  Ticket,
  Gift,
  Zap,
  Star
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
    { name: 'Đánh giá & Nhận xét', path: '/seller/reviews', icon: Star },
    { name: 'Mã giảm giá', path: '/seller/discounts', icon: Ticket },
    { name: 'Mua X Tặng Y', path: '/seller/promotions', icon: Gift },
    { name: 'Flash Sale', path: ROUTES.SELLER_FLASH_SALES, icon: Zap },
    { name: 'Ví & Rút tiền', path: ROUTES.SELLER_WALLET, icon: Ticket },
    { name: 'Thông tin cửa hàng', path: '/seller/settings', icon: Settings },
  ];

  if (user?.sellerInfo?.status === 'Suspended') {
    navItems.push({ name: 'Gửi khiếu nại', path: ROUTES.SELLER_APPEAL, icon: ShieldAlert });
  }

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
      globalBanner={
        user?.sellerInfo?.status === 'Suspended' ? (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 m-4 rounded-r-lg shadow-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <ShieldAlert className="h-5 w-5 text-red-500" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-bold text-red-800">Cửa hàng của bạn đã bị khóa</h3>
                <p className="text-sm text-red-700 mt-1">
                  Hiện tại nhà hàng đang bị khóa do vi phạm chính sách của hệ thống. Khách hàng sẽ không thể nhìn thấy cửa hàng cũng như đặt món ăn của bạn.
                  Vui lòng chọn tính năng <Link to={ROUTES.SELLER_APPEAL} className="font-bold underline text-red-800 hover:text-red-900">Gửi Khiếu Nại</Link> (hoặc liên hệ Admin) để được hỗ trợ mở khóa.
                </p>
              </div>
            </div>
          </div>
        ) : null
      }
    />
  );
}
