/**
 * Centralized route path constants
 * Single source of truth for all application routes
 */
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  REGISTER_SELLER: '/register/seller',
  PRODUCTS: '/products',
  PRODUCT_DETAIL: '/products/:id',
  SELLER_DASHBOARD: '/seller',
  SELLER_PRODUCTS: '/seller/products',
  SELLER_CATEGORIES: '/seller/categories',
  ADMIN_DASHBOARD: '/admin',
  ADMIN_APPLICATIONS: '/admin/applications',
  ADMIN_PRODUCTS: '/admin/products',
  PROFILE: '/profile',
  ORDERS: '/orders',
} as const;

/**
 * Generate product detail path from ID
 */
export function getProductDetailPath(id: string): string {
  return `/products/${id}`;
}
