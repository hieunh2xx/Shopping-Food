import { Routes, Route } from 'react-router-dom';
import { ROUTES } from './routeConfig';
import { PrivateRoute } from './PrivateRoute';

// Layout
import { MainLayout, AdminLayout, SellerLayout } from '../components/layout';

// Pages
import {
  HomePage,
  LoginPage,
  RegisterPage,
  ProductsPage,
  ProductDetailPage,
  SellerDashboardPage,
  AdminDashboardPage,
  AdminPermissionsPage,
  SellerProductsPage,
  AdminUsersPage,
  NotFoundPage
} from '../pages';

/**
 * AppRoutes — centralized route definitions
 * Demonstrates clean separation of routing logic from components
 */
export function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path={ROUTES.LOGIN} element={<LoginPage />} />
      <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
      <Route path={ROUTES.REGISTER_SELLER} element={<RegisterPage isSeller />} />

      {/* Routes with layout */}
      <Route element={<MainLayout />}>
        <Route path={ROUTES.HOME} element={<HomePage />} />
        <Route path={ROUTES.PRODUCTS} element={<ProductsPage />} />
        <Route path={ROUTES.PRODUCT_DETAIL} element={<ProductDetailPage />} />

      </Route>

      {/* Seller routes - protected with SellerLayout */}
      <Route
        path={ROUTES.SELLER_DASHBOARD}
        element={
          <PrivateRoute allowedRoles={['Seller']}>
            <SellerLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<SellerDashboardPage />} />
        <Route path="products" element={<SellerProductsPage />} />
        <Route path="orders" element={<div className="p-8"><h2 className="text-2xl font-bold">Quản lý đơn hàng</h2><p className="mt-4 text-gray-500">Đang phát triển...</p></div>} />
        <Route path="settings" element={<div className="p-8"><h2 className="text-2xl font-bold">Cấu hình cửa hàng</h2><p className="mt-4 text-gray-500">Đang phát triển...</p></div>} />
      </Route>

      {/* Admin routes - protected with AdminLayout */}
      <Route
        path={ROUTES.ADMIN_DASHBOARD}
        element={
          <PrivateRoute allowedRoles={['Admin']}>
            <AdminLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="permissions" element={<AdminPermissionsPage />} />
        <Route path="approvals" element={<div className="p-8"><h2 className="text-2xl font-bold">Duyệt đối tác</h2><p className="mt-4 text-gray-500">Đang phát triển...</p></div>} />
        <Route path="settings" element={<div className="p-8"><h2 className="text-2xl font-bold">Cấu hình hệ thống</h2><p className="mt-4 text-gray-500">Đang phát triển...</p></div>} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
