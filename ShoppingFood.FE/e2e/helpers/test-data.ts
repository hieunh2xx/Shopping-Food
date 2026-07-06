/**
 * Centralized test data constants and helpers for E2E tests.
 */

// ============================
// Test Account Credentials
// ============================
export const TEST_ACCOUNTS = {
  customer: {
    username: process.env.TEST_CUSTOMER_USERNAME || 'testcustomer',
    password: process.env.TEST_CUSTOMER_PASSWORD || 'Test@123',
  },
  seller: {
    username: process.env.TEST_SELLER_USERNAME || 'testseller',
    password: process.env.TEST_SELLER_PASSWORD || 'Test@123',
  },
  admin: {
    username: process.env.TEST_ADMIN_USERNAME || 'admin',
    password: process.env.TEST_ADMIN_PASSWORD || 'Admin@123',
  },
  shipper: {
    username: process.env.TEST_SHIPPER_USERNAME || 'testshipper',
    password: process.env.TEST_SHIPPER_PASSWORD || 'Test@123',
  },
  coordinator: {
    username: process.env.TEST_COORDINATOR_USERNAME || 'testcoord',
    password: process.env.TEST_COORDINATOR_PASSWORD || 'Test@123',
  },
};

// ============================
// Random Data Generators
// ============================
const timestamp = () => Date.now().toString(36);

export function randomUsername(): string {
  return `testuser_${timestamp()}`;
}

export function randomEmail(): string {
  return `test_${timestamp()}@example.com`;
}

export function randomPhone(): string {
  return `09${Math.floor(10000000 + Math.random() * 90000000)}`;
}

export function randomFullName(): string {
  const firstNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng'];
  const lastNames = ['Văn A', 'Thị B', 'Minh C', 'Hữu D', 'Thanh E'];
  return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
}

// ============================
// Test Data for Registration
// ============================
export function generateRegisterData() {
  return {
    userName: randomUsername(),
    fullName: randomFullName(),
    email: randomEmail(),
    phone: randomPhone(),
    password: 'Test@123',
    confirmPassword: 'Test@123',
  };
}

// ============================
// Route Constants (mirrors routeConfig.ts)
// ============================
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  REGISTER_SELLER: '/register/seller',
  PRODUCTS: '/products',
  RESTAURANTS: '/restaurants',
  PROMOTIONS: '/promotions',
  CHECKOUT: '/checkout',
  HELP_CENTER: '/help',
  TERMS: '/terms',
  PRIVACY: '/privacy',
  PROFILE: '/profile',
  ORDERS: '/orders',
  SELLER_DASHBOARD: '/seller',
  SELLER_PRODUCTS: '/seller/products',
  SELLER_ORDERS: '/seller/orders',
  SELLER_CATEGORIES: '/seller/categories',
  SELLER_TOPPINGS: '/seller/toppings',
  SELLER_DISCOUNTS: '/seller/discounts',
  SELLER_SETTINGS: '/seller/settings',
  ADMIN_DASHBOARD: '/admin',
  ADMIN_USERS: '/admin/users',
  ADMIN_RESTAURANTS: '/admin/restaurants',
  ADMIN_APPROVALS: '/admin/approvals',
  ADMIN_PERMISSIONS: '/admin/permissions',
  ADMIN_SETTINGS: '/admin/settings',
  SHIPPER_DASHBOARD: '/shipper',
  ADMIN_FAQ: '/admin/faq',
  ADMIN_FINANCE: '/admin/finance',
  ADMIN_APPLICATIONS: '/admin/approvals',
  REGISTER_SHIPPER: '/register/shipper',
  SELLER_WALLET: '/seller/wallet',
  SELLER_PROMOTIONS: '/seller/promotions',
  SELLER_APPLY: '/seller/apply',
  SHIPPER_APPLY: '/shipper/apply',
  SHIPPER_WALLET: '/shipper/wallet',
  SHIPPER_INCOME: '/shipper/income',
  SHIPPER_HISTORY: '/shipper/history',
  REPORT_INCIDENT: '/support/report',
  GUEST_ORDER_TRACKING: '/order-tracking',
  COORDINATOR_DASHBOARD: '/coordinator',
} as const;
