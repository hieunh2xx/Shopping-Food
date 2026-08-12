import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  History,
  ShieldCheck,
  UserCheck,
  ShieldAlert,
  User,
  MessageSquare,
  CreditCard,
  Banknote
} from 'lucide-react';
import { useAuth, useSupportChatWatcher } from '../../../hooks';
import { ROUTES } from '../../../routes/routeConfig';
import { DashboardLayout } from '../DashboardLayout';

export function CoordinatorLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const unreadChatCount = useSupportChatWatcher(user?.role || null);

  const handleLogout = () => {
    logout();
    navigate(ROUTES.LOGIN);
  };

  const navItems = [
    { name: 'Bảng điều phối', path: ROUTES.COORDINATOR_DISPATCH, icon: LayoutDashboard },
    { name: 'Giám sát Shipper', path: ROUTES.COORDINATOR_SHIPPERS, icon: ShieldAlert },
    { name: 'Lịch sử điều phối', path: ROUTES.COORDINATOR_HISTORY, icon: History },
    { name: 'Sự cố điều phối', path: ROUTES.COORDINATOR_INCIDENTS, icon: ShieldCheck },
    { name: 'Duyệt nộp COD', path: ROUTES.COORDINATOR_COD_REMITTANCES, icon: Banknote },
    { name: 'Duyệt rút tiền', path: '/coordinator/withdrawals', icon: CreditCard },
    { name: 'Live Chat', path: ROUTES.COORDINATOR_CHAT, icon: MessageSquare, badge: unreadChatCount },
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
