import { Routes, Route } from 'react-router-dom';
import { ROUTES } from './routeConfig';
import { PrivateRoute } from './PrivateRoute';

// Layout
import { MainLayout } from '../components/layout';

// Pages
import {
  HomePage,
  LoginPage,
  RegisterPage,
  ProductsPage,
  ProductDetailPage,
  SellerDashboardPage,
  AdminDashboardPage,
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

        {/* Seller routes - protected */}
        <Route
          path={ROUTES.SELLER_DASHBOARD}
          element={
            <PrivateRoute requiredRole="Seller">
              <SellerDashboardPage />
            </PrivateRoute>
          }
        />

        {/* Admin routes - protected */}
        <Route
          path={ROUTES.ADMIN_DASHBOARD}
          element={
            <PrivateRoute requiredRole="Admin">
              <AdminDashboardPage />
            </PrivateRoute>
          }
        />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
