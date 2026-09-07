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

/**
 * Layout Kênh Hoạt động của Tài xế Giao hàng (ShipperLayout).
 * Dành cho Shipper để thực hiện các chức năng:
 * - Tổng quan & Bật/Tắt trạng thái sẵn sàng nhận đơn, nhận đơn hàng gần nhất
 * - Lịch sử các đơn đã giao thành công/thất bại
 * - Báo cáo thu nhập theo ngày/tuần
 * - Ví tiền, công nợ COD và lịch sử nộp COD
 * - Hồ sơ tài xế, phương tiện và điểm uy tín.
 */
export function ShipperLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  /**
   * Xử lý đăng xuất tài khoản Tài xế.
   */
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
