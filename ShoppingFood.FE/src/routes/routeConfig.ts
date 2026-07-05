/**
 * Centralized route path constants
 * Single source of truth for all application routes
 */
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  REGISTER_SELLER: '/register/seller',
  REGISTER_SHIPPER: '/register/shipper',
  CHECKOUT: '/checkout',
  GUEST_ORDER_TRACKING: '/order-tracking',
  PRODUCTS: '/products',
  PROMOTIONS: '/promotions',
  PRODUCT_DETAIL: '/products/:id',
  RESTAURANTS: '/restaurants',
  HELP_CENTER: '/help',
  REPORT_INCIDENT: '/support/report',
  TERMS_OF_USE: '/terms',
  PRIVACY_POLICY: '/privacy',
  RESTAURANT_DETAIL: '/restaurant/:id',
  SELLER_DASHBOARD: '/seller',
  SELLER_APPLY: '/seller/apply',
  SELLER_APPEAL: '/seller/appeal',
  SELLER_PRODUCTS: '/seller/products',
  SELLER_CATEGORIES: '/seller/categories',
  SELLER_TOPPINGS: '/seller/toppings',
  SELLER_FLASH_SALES: '/seller/flash-sales',
  SELLER_REVIEWS: '/seller/reviews',
  ADMIN_DASHBOARD: '/admin',
  ADMIN_APPLICATIONS: '/admin/applications',
  ADMIN_PRODUCTS: '/admin/products',
  ADMIN_DISPATCH: '/admin/dispatch',
  ADMIN_SHIPPERS: '/admin/shippers',
  ADMIN_DISPATCH_HISTORY: '/admin/dispatch-history',
  ADMIN_FLASH_SALES: '/admin/flash-sales',
  ADMIN_NOTIFICATIONS: '/admin/notifications',
  ADMIN_REVIEW_REPORTS: '/admin/review-reports',
  ADMIN_INCIDENTS: '/admin/incidents',
  ADMIN_FAQ: '/admin/faq',
  ADMIN_CHAT: '/admin/chat',
  PROFILE: '/profile',
  ORDERS: '/orders',
  SHIPPER_APPLY: '/shipper/apply',
  SHIPPER_DASHBOARD: '/shipper',
  SHIPPER_HISTORY: '/shipper/history',
  SHIPPER_INCOME: '/shipper/income',
  SHIPPER_PROFILE: '/shipper/profile',
  COORDINATOR_DASHBOARD: '/coordinator',
  COORDINATOR_DISPATCH: '/coordinator/dispatch',
  COORDINATOR_SHIPPERS: '/coordinator/shippers',
  COORDINATOR_HISTORY: '/coordinator/history',
  COORDINATOR_INCIDENTS: '/coordinator/incidents',
  COORDINATOR_CHAT: '/coordinator/chat',
} as const;

/**
 * Generate product detail path from ID
 */
export function getProductDetailPath(id: string): string {
  return `/products/${id}`;
}
