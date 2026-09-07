import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks';
import { ROUTES } from './routeConfig';
import { Loading } from '../components/common';

interface PrivateRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

/**
 * Tuyến Đường Bảo Vệ Phân Quyền (PrivateRoute).
 * Kiểm tra trạng thái xác thực và vai trò (Role) của người dùng:
 * - Đang tải: Hiển thị màn hình chờ "Đang kiểm tra phân quyền..."
 * - Chưa đăng nhập: Tự động chuyển hướng về trang Đăng nhập kèm lưu lại vị trí trước đó
 * - Vai trò không phù hợp: Chuyển hướng về Trang chủ
 * - Hợp lệ: Cho phép truy cập và render các component con (`children`).
 */
export function PrivateRoute({ children, allowedRoles }: PrivateRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" text="Đang kiểm tra phân quyền..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  return <>{children}</>;
}

