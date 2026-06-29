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
  PRODUCTS: '/products',
  PRODUCT_DETAIL: '/products/:id',
  RESTAURANT_DETAIL: '/restaurant/:id',
  SELLER_DASHBOARD: '/seller',
  SELLER_APPLY: '/seller/apply',
  SELLER_APPEAL: '/seller/appeal',
  SELLER_PRODUCTS: '/seller/products',
  SELLER_CATEGORIES: '/seller/categories',
  SELLER_TOPPINGS: '/seller/toppings',
  ADMIN_DASHBOARD: '/admin',
  ADMIN_APPLICATIONS: '/admin/applications',
  ADMIN_PRODUCTS: '/admin/products',
  ADMIN_DISPATCH: '/admin/dispatch',
  ADMIN_SHIPPERS: '/admin/shippers',
  ADMIN_DISPATCH_HISTORY: '/admin/dispatch-history',
  PROFILE: '/profile',
  ORDERS: '/orders',
  SHIPPER_DASHBOARD: '/shipper',
  SHIPPER_HISTORY: '/shipper/history',
  SHIPPER_INCOME: '/shipper/income',
  SHIPPER_PROFILE: '/shipper/profile',
  COORDINATOR_DASHBOARD: '/coordinator',
  COORDINATOR_DISPATCH: '/coordinator/dispatch',
  COORDINATOR_SHIPPERS: '/coordinator/shippers',
  COORDINATOR_HISTORY: '/coordinator/history',
} as const;

/**
 * Generate product detail path from ID
 */
export function getProductDetailPath(id: string): string {
  return `/products/${id}`;
}
