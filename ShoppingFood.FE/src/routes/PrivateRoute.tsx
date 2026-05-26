

interface PrivateRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export function PrivateRoute({ children }: PrivateRouteProps) {
  // BYPASS BẢO MẬT ĐỂ TEST UI (XÓA KHI ĐƯA VÀO THỰC TẾ)
  // if (isLoading) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center">
  //       <Loading size="lg" text="Đang kiểm tra phân quyền..." />
  //     </div>
  //   );
  // }

  // if (!isAuthenticated) {
  //   return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  // }

  // if (allowedRoles && user && !allowedRoles.includes(user.role)) {
  //   return <Navigate to={ROUTES.HOME} replace />;
  // }

  return <>{children}</>;
}
