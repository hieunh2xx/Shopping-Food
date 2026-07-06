import { Routes, Route } from 'react-router-dom';
import { ROUTES } from './routeConfig';
import { PrivateRoute } from './PrivateRoute';

// Layout
import { MainLayout, AdminLayout, SellerLayout, UserLayout, ShipperLayout, CoordinatorLayout } from '../components/layout';

// Pages
import {
  HomePage,
  LoginPage,
  RegisterPage,
  ProductsPage,
  ProductDetailPage,
  RestaurantDetailPage,
  SellerDashboardPage,
  AdminDashboardPage,
  AdminPermissionsPage,
  SellerProductsPage,
  SellerOrdersPage,
  SellerSettingsPage,
  SellerCategoriesPage,
  SellerToppingsPage,
  SellerDiscountsPage,
  SellerPromotionsPage,
  AdminUsersPage,
  AdminRestaurantsPage,
  AdminSettingsPage,
  AdminSystemConfigPage,
  AdminLegalSettingsPage,
  AdminApprovalsPage,
  AdminDiscountsPage,
  AdminLoyaltyConfigPage,
  AdminFaqPage,
  AdminChatPage,
  AdminFinancePage,
  SellerWalletPage,
  ShipperWalletPage,
  NotFoundPage,
  ProfilePage,
  OrdersPage,
  SellerApplyPage,
  ShipperApplyPage,
  ShipperDashboard,
  ShipperHistoryPage,
  ShipperIncomePage,
  ShipperProfilePage,
  SellerAppealPage,
  DispatchHistoryPage,
  DispatchBoardPage,
  MonitorShippersPage,
  CoordinatorIncidentsPage,
  CoordinatorChatPage,
  AdminReviewReportsPage,
  CheckoutPage,
  GuestOrderTrackingPage,
  RestaurantsPage,
  PromotionsPage,
  HelpCenterPage,
  TermsOfUsePage,
  PrivacyPolicyPage,
  AdminFlashSalePage,
  AdminNotificationsPage,
  SellerFlashSalesPage,
  AuthShipperApplyPage,
  DashboardProfilePage,
  UserReportIncidentPage,
  SepayRedirectPage,
  PaymentSuccessPage,
  PaymentErrorPage,
  PaymentCancelPage,
  PaymentHistoryPage,
  AdminPaymentDashboardPage,
  MaintenancePage,
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
      <Route path={ROUTES.REGISTER_SHIPPER} element={<ShipperApplyPage />} />
      <Route path="/maintenance" element={<MaintenancePage />} />

      {/* Routes with layout */}
      <Route element={<MainLayout />}>
        <Route path={ROUTES.HOME} element={<HomePage />} />
        <Route path={ROUTES.PRODUCTS} element={<ProductsPage />} />
        <Route path={ROUTES.PRODUCT_DETAIL} element={<ProductDetailPage />} />
        <Route path={ROUTES.RESTAURANTS} element={<RestaurantsPage />} />
        <Route path={ROUTES.RESTAURANT_DETAIL} element={<RestaurantDetailPage />} />
        <Route path={ROUTES.PROMOTIONS} element={<PromotionsPage />} />
        <Route path={ROUTES.CHECKOUT} element={<CheckoutPage />} />
        <Route path={ROUTES.PAYMENT_SEPAY} element={<PrivateRoute><SepayRedirectPage /></PrivateRoute>} />
        <Route path={ROUTES.PAYMENT_SUCCESS} element={<PaymentSuccessPage />} />
        <Route path={ROUTES.PAYMENT_ERROR} element={<PaymentErrorPage />} />
        <Route path={ROUTES.PAYMENT_CANCEL} element={<PaymentCancelPage />} />
        <Route path={ROUTES.PAYMENT_HISTORY} element={
          <PrivateRoute allowedRoles={['Customer', 'Seller', 'Admin', 'Mall', 'Shipper', 'Coordinator']}>
            <PaymentHistoryPage />
          </PrivateRoute>
        } />
        <Route path={ROUTES.GUEST_ORDER_TRACKING} element={<GuestOrderTrackingPage />} />
        <Route path={ROUTES.HELP_CENTER} element={<HelpCenterPage />} />
        <Route path={ROUTES.REPORT_INCIDENT} element={<PrivateRoute><UserReportIncidentPage /></PrivateRoute>} />
        <Route path={ROUTES.TERMS_OF_USE} element={<TermsOfUsePage />} />
        <Route path={ROUTES.PRIVACY_POLICY} element={<PrivacyPolicyPage />} />
        
        {/* Protected Client Routes inside UserLayout */}
        <Route element={<UserLayout />}>
          <Route path={ROUTES.PROFILE} element={
            <PrivateRoute allowedRoles={['Customer', 'Seller', 'Admin', 'Mall', 'Shipper', 'Coordinator']}>
              <ProfilePage />
            </PrivateRoute>
          } />
          <Route path={ROUTES.ORDERS} element={
            <PrivateRoute allowedRoles={['Customer', 'Seller', 'Admin', 'Mall', 'Shipper', 'Coordinator']}>
              <OrdersPage />
            </PrivateRoute>
          } />
          <Route path={ROUTES.SELLER_APPLY} element={
            <PrivateRoute allowedRoles={['Customer']}>
              <SellerApplyPage />
            </PrivateRoute>
          } />
          <Route path={ROUTES.SHIPPER_APPLY} element={
            <PrivateRoute allowedRoles={['Customer', 'Seller', 'Mall']}>
              <AuthShipperApplyPage />
            </PrivateRoute>
          } />
        </Route>
      </Route>

      {/* Seller routes - protected with SellerLayout */}
      <Route
        path={ROUTES.SELLER_DASHBOARD}
        element={
          <PrivateRoute allowedRoles={['Seller', 'Mall']}>
            <SellerLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<SellerDashboardPage />} />
        <Route path="products" element={<SellerProductsPage />} />
        <Route path="orders" element={<SellerOrdersPage />} />
        <Route path="settings" element={<SellerSettingsPage />} />
        <Route path="categories" element={<SellerCategoriesPage />} />
        <Route path="toppings" element={<SellerToppingsPage />} />
        <Route path="discounts" element={<SellerDiscountsPage />} />
        <Route path="promotions" element={<SellerPromotionsPage />} />
        <Route path="flash-sales" element={<SellerFlashSalesPage />} />
        <Route path="wallet" element={<SellerWalletPage />} />
        <Route path="appeal" element={<SellerAppealPage />} />
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
        <Route path="restaurants" element={<AdminRestaurantsPage />} />
        <Route path="permissions" element={<AdminPermissionsPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
        <Route path="system-config" element={<AdminSystemConfigPage />} />
        <Route path="legal-settings" element={<AdminLegalSettingsPage />} />
        <Route path="approvals" element={<AdminApprovalsPage />} />
        <Route path="discounts" element={<AdminDiscountsPage />} />
        <Route path="loyalty" element={<AdminLoyaltyConfigPage />} />
        <Route path="dispatch" element={<DispatchBoardPage />} />
        <Route path="shippers" element={<MonitorShippersPage />} />
        <Route path="dispatch-history" element={<DispatchHistoryPage />} />
        <Route path="flash-sales" element={<AdminFlashSalePage />} />
        <Route path="notifications" element={<AdminNotificationsPage />} />
        <Route path="review-reports" element={<AdminReviewReportsPage />} />
        <Route path="incidents" element={<CoordinatorIncidentsPage />} />
        <Route path="faq" element={<AdminFaqPage />} />
        <Route path="chat" element={<AdminChatPage />} />
        <Route path="finance" element={<AdminFinancePage />} />
        <Route path="payments" element={<AdminPaymentDashboardPage />} />
        <Route path="profile" element={<DashboardProfilePage />} />
      </Route>

      {/* Coordinator routes - protected with CoordinatorLayout */}
      <Route
        path={ROUTES.COORDINATOR_DASHBOARD}
        element={
          <PrivateRoute allowedRoles={['Coordinator', 'Admin']}>
            <CoordinatorLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<DispatchBoardPage />} />
        <Route path="dispatch" element={<DispatchBoardPage />} />
        <Route path="shippers" element={<MonitorShippersPage />} />
        <Route path="history" element={<DispatchHistoryPage />} />
        <Route path="incidents" element={<CoordinatorIncidentsPage />} />
        <Route path="chat" element={<CoordinatorChatPage />} />
        <Route path="profile" element={<DashboardProfilePage />} />
      </Route>

      {/* Shipper routes - protected with ShipperLayout */}
      <Route
        path={ROUTES.SHIPPER_DASHBOARD}
        element={
          <PrivateRoute allowedRoles={['Shipper']}>
            <ShipperLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<ShipperDashboard />} />
        <Route path="history" element={<ShipperHistoryPage />} />
        <Route path="income" element={<ShipperIncomePage />} />
        <Route path="wallet" element={<ShipperWalletPage />} />
        <Route path="profile" element={<ShipperProfilePage />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
