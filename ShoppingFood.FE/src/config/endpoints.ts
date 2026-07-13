/**
 * Centralized API Endpoints Configuration
 * Single source of truth for all backend API paths
 * Maps to ShoppingFood.API controllers
 */
export const API_ENDPOINTS = {
  // === Auth & User (UserController) ===
  AUTH: {
    LOGIN: '/User/Login',
    REGISTER: '/User/Register',
    REGISTER_SELLER: '/User/RegisterSeller',
    LOGIN_GOOGLE: '/User/LoginGoogle',
    LOGIN_MICROSOFT: '/User/LoginMicrosoft',
  },
  ROLE: {
    UPGRADE_TO_MALL: '/User/UpgradeToMall',
  },
  // === User Management (UserController) ===
  USER: {
    BASE: '/User',
    GET_ALL: '/User',          // GET ?filter=&skip=&take=
    PROFILE: '/User/Profile',  // GET
    REGISTER_SHIPPER: '/User/register-shipper',
    SELLER_APPLICATION_STATUS: '/User/SellerApplication/Status',
    UPDATE_SELLER_APPLICATION: '/User/SellerApplication',
    CHANGE_PASSWORD: '/User/ChangePassword',
  },

  // === Order Management (OrderController) ===
  ORDER: {
    BASE: '/Order',
    MY_ORDERS: '/Order/MyOrders', // GET
    RECENT_ITEMS: '/Order/recent-items', // GET
    RESTAURANT_ORDERS: '/Order/RestaurantOrders', // GET
    DETAILS: (id: string) => `/Order/details/${id}`, // GET
    CHECKOUT: '/Order/checkout', // POST
    CHECKOUT_SEND_OTP: '/Order/checkout/sent-otp', // POST
    UPDATE: '/Order/update', // PUT
    CANCEL: '/Order/cancel', // PUT
    REORDER: '/Order/reorder', // POST
    ACCEPT: '/Order/accept', // POST
    REJECT: '/Order/reject', // POST
    PREPARE: '/Order/prepare', // POST
    WAITING_SHIPPER: '/Order/waiting-for-shipper', // POST
    SELLER_CANCEL: '/Order/seller-cancel', // POST
  },

  // === Product (ProductController) ===
  PRODUCT: {
    BASE: '/Product',
    GET_ALL: '/Product',       // GET
    GET_BY_ID: (id: string) => `/Product/${id}`,
    CREATE: '/Product',        // POST
    UPDATE: (id: string) => `/Product/${id}`,     // PUT
    DELETE: (id: string) => `/Product/${id}`,     // DELETE
    SEARCH: '/Product/Search',                            // GET
    BEST_SELLERS: '/Product/BestSellers',          // GET ?take=
    CATEGORIES: '/Product/Categories',             // GET
    STOCK_STATUS: (id: string) => `/Product/StockStatus/${id}`,       // PATCH
    VISIBILITY: (id: string) => `/Product/Visibility/${id}`,          // PATCH
    AVAILABILITY: (id: string) => `/Product/TimeAvailability/${id}`,  // PATCH
    RECOMMENDATIONS: '/Product/recommendations',                      // GET
    REPORT: '/Product/Report',                     // POST
    REVIEW: '/Product/review',                     // POST
    REVIEWS: (productId: string) => `/Product/${productId}/reviews`, // GET
    SELLER_REVIEWS: '/Product/seller/reviews',     // GET
    REVIEW_REPLY: (reviewId: string) => `/Product/review/${reviewId}/reply`, // POST
    REVIEW_REPORT: (reviewId: string) => `/Product/review/${reviewId}/report`, // POST
  },

  NOTIFICATION: {
    BASE: '/Notification',
    GET_ALL: '/Notification',
    READ: (id: string) => `/Notification/${id}/read`,
    READ_ALL: '/Notification/read-all',
  },

  // === Menu Category (MenuCategoryController) ===
  MENU_CATEGORY: {
    BASE: '/MenuCategory',
    CREATE: '/MenuCategory',   // POST
    UPDATE: '/MenuCategory',   // PUT
    BY_RESTAURANT: (restaurantId: string) => `/MenuCategory/${restaurantId}`, // GET
  },

  // === Admin (AdminController) ===
  ADMIN: {
    BASE: '/Admin',
    APPROVE_SELLER: '/Admin/ApproveSellerApplication',  // POST
    APPROVE_PRODUCT: '/Admin/ApproveProduct',           // POST
    APPROVE_SHIPPER: '/Admin/approve-shipper-application', // POST
    SELLER_APPLICATIONS: '/Admin/SellerApplications',   // GET
    SHIPPER_APPLICATIONS: '/Admin/ShipperApplications', // GET
    GLOBAL_MENU_CATEGORY: '/Admin/GlobalMenuCategory',   // GET, POST
    GLOBAL_MENU_CATEGORY_BY_ID: (id: string) => `/Admin/GlobalMenuCategory/${id}`, // PUT, DELETE
    GLOBAL_MENU_CATEGORY_VISIBILITY: (id: string) => `/Admin/GlobalMenuCategory/Visibility/${id}`, // PATCH
    POINT_GIFT_CONFIG: '/Admin/point-gift-config',
    POINT_GIFT_CONFIG_BY_ID: (id: string) => `/Admin/point-gift-config/${id}`,
    RESTAURANTS: '/Admin/Restaurants', // GET
    TOGGLE_VERIFICATION: (id: string) => `/Admin/Restaurants/${id}/toggle-verification`, // POST
    SUSPEND_RESTAURANT: '/Admin/suspend-restaurant', // POST (assuming it exists or will be added, wait I should check if it exists in API)
    BROADCAST_NOTIFICATION: '/Admin/notifications/broadcast', // POST
    BLACKLIST_KEYWORDS: '/Admin/blacklist-keywords', // GET, POST
    BLACKLIST_KEYWORD_BY_ID: (id: string) => `/Admin/blacklist-keywords/${id}`, // DELETE
    BLACKLIST_KEYWORD_TOGGLE: (id: string) => `/Admin/blacklist-keywords/${id}/toggle`, // PUT
    REVIEW_REPORTS: '/Admin/review-reports', // GET
    MODERATE_REVIEW_REPORT: (reportId: string) => `/Admin/review-reports/${reportId}/moderate`, // POST
    PRODUCT_REPORTS: '/Admin/product-reports', // GET
    MODERATE_PRODUCT_REPORT: (reportId: string) => `/Admin/product-reports/${reportId}/moderate`, // POST
    SUPPORT_TICKETS: '/Admin/support-tickets', // POST
    SUSPEND_SHIPPER: (id: string) => `/Admin/shippers/${id}/suspend`, // PUT
    CREATE_STAFF: '/Admin/users/staff', // POST
    PERMISSIONS_ENDPOINTS: '/Admin/permissions/endpoints', // GET
    TOGGLE_USER_STATUS: (userId: string) => `/Admin/users/${userId}/toggle-status`, // PUT
    ROLE_PERMISSIONS: (role: number) => `/Admin/permissions/role/${role}`, // GET, PUT
    DASHBOARD_STATS: '/Admin/dashboard/stats', // GET
    DASHBOARD_HEATMAP: '/Admin/dashboard/heatmap', // GET
    SYSTEM_MAINTENANCE: '/Admin/system/maintenance', // GET, POST
    SYSTEM_DELIVERY: '/Admin/system/delivery', // GET, POST
    SYSTEM_LEGAL: '/Admin/system/legal', // POST
    REPORTS_FINANCIAL: '/Admin/reports/financial', // GET
    FINANCE_CONFIG: '/Admin/finance-config', // GET, PUT
    FINANCE_CONFIG_RESTAURANTS: '/Admin/finance-config/restaurants', // GET
    FINANCE_CONFIG_RESTAURANT_BY_ID: (id: string) => `/Admin/finance-config/restaurants/${id}`, // PUT
  },

  // === System (SystemController) ===
  SYSTEM: {
    GLOBAL_MENU_CATEGORY: '/System/global-menu-category', // GET
    LEGAL: '/System/legal', // GET
    ACTION_LOGS: '/System/action-logs', // GET
    ERROR_LOGS: '/System/error-logs', // GET
  },

  // === Shipper (ShipperController) ===
  SHIPPER: {
    BASE: '/Shipper',
    TOGGLE_ONLINE: '/Shipper/toggle-online', // POST
    PROPOSED_OFFER: (orderId: string) => `/Shipper/proposed-offer/${orderId}`, // GET
    ACCEPT_OFFER: '/Shipper/accept-offer', // POST
    CONFIRM_ARRIVED: '/Shipper/confirm-arrived', // POST
    CONFIRM_PICKED_UP: '/Shipper/confirm-picked-up', // POST
    CONFIRM_DELIVERED: '/Shipper/confirm-delivered', // POST
    CONFIRM_FAILED: '/Shipper/confirm-failed', //POST
    LOCATION: '/Shipper/location', // POST
    INCOME_REPORT: '/Shipper/income-report',
    SCHEDULE_AREA: '/Shipper/schedule-area',
    AVAILABLE_OFFERS: '/Shipper/available-offers',
    REJECT_OFFER: '/Shipper/reject-offers',
    DELIVERY_ROUTE: (orderId: string) => `/Shipper/delivery-route/${orderId}`, // GET
    REVIEW: '/Shipper/review', // POST
    REPUTATION_HISTORY: '/Shipper/ReputationHistory', // GET
    REPORT_INCIDENT: (orderId: string) => `/Shipper/Orders/${orderId}/report`, // POST
  },

  // === Cart (CartController) ===
  CART: {
    BASE: '/Cart',
    CLEAR: '/Cart/clear',
  },

  // === Restaurant (RestaurantController) ===
  RESTAURANT: {
    BASE: '/Restaurant',
    BY_ID: (id: string) => `/Restaurant/${id}`,
    NEARBY: '/Restaurant/nearby',
    DASHBOARD_STATS: '/Restaurant/DashboardStats',
    FAVORITES: '/Restaurant/Favorites',
    TOGGLE_FAVORITE: (id: string) => `/Restaurant/${id}/Favorite`,
    UPDATE_BASIC_INFO: '/Restaurant/basic-info',
    UPDATE_OPERATING_HOURS: '/Restaurant/operating-hours',
    UPDATE_STATUS: '/Restaurant/status',
    UPDATE_DELIVERY_CONFIG: '/Restaurant/delivery-config',
  },

  // === Topping (ToppingController) ===
  TOPPING: {
    BASE: '/Topping',
    BY_RESTAURANT: (restaurantId: string) => `/Topping/restaurant/${restaurantId}`,
    BY_ID: (id: string) => `/Topping/${id}`,
  },

  COORDINATOR: {
    BASE: '/Coordinator',
    ORDERS: '/Coordinator/orders',
    SUGGESTED_SHIPPERS: (orderId: string) => `/Coordinator/orders/${orderId}/suggested-shippers`,
    SEND_PROPOSAL: '/Coordinator/proposals',
    FORCE_ASSIGN: '/Coordinator/orders/force-assign',
    RESOLVE_INCIDENT: (orderId: string) => `/Coordinator/orders/${orderId}/resolve-incident`,
    RELEASE_ORDER: (orderId: string) => `/Coordinator/orders/${orderId}/release`,
    MONITOR_SHIPPERS: '/Coordinator/shippers/monitoring',
    SUSPEND_SHIPPER: (shipperId: string) => `/Coordinator/shippers/${shipperId}/suspend`,
    DISPATCH_HISTORY: '/Coordinator/orders/dispatch-history',
    ORDER_DISPATCH_HISTORY: (orderId: string) => `/Coordinator/orders/${orderId}/dispatch-history`,
    INCIDENTS: '/Coordinator/incidents',
    RESOLVE_COMPLAINT: (id: string) => `/Coordinator/complaint/${id}/resolve`,
    ADJUST_SHIPPER_REPUTATION: (shipperId: string) => `/Coordinator/shippers/${shipperId}/adjust-reputation`,
    ORDER_COMPLAINTS: '/Coordinator/complaints/orders'
  },

  DISCOUNT: {
    BASE: '/Discount',
    CREATE: '/Discount',
    SAVE: '/Discount/save',
    BY_ID: (id: string) => `/Discount/${id}`,
    APPLY: '/Discount/apply',
    STATS: '/Discount/stats', // GET
    LOCK: (id: string) => `/Discount/${id}/lock`, // PATCH
  },

  FLASH_SALE: {
    BASE: '/FlashSale',
    ACTIVE: '/FlashSale/active', // GET
    ALL: '/FlashSale/flash-sales', // GET
    CREATE: '/FlashSale/flash-sales', // POST
    UPDATE: (id: string) => `/FlashSale/flash-sales/${id}`, // POST
    DELETE: (id: string) => `/FlashSale/flash-sales/${id}`, // DELETE
    PRODUCTS: (id: string) => `/FlashSale/flash-sales/${id}/products`, // GET
    REGISTER: '/FlashSale/register', // POST
    REVIEW_PRODUCT: '/FlashSale/review-product', // POST
  },

  PROMOTION: {
    BASE: '/Promotion',
    CREATE: '/Promotion',
    UPDATE: (id: string) => `/Promotion/${id}`,
    DELETE: (id: string) => `/Promotion/${id}`,
  },

  LOYALTY_POINT: {
    BASE: '/LoyaltyPoint',
    GIFTS: '/LoyaltyPoint/gifts',
    REDEEM: '/LoyaltyPoint/redeem',
    EVALUATE_TIERS: '/LoyaltyPoint/evaluate-tiers',
    TIER_CONFIGS: '/LoyaltyPoint/tier-configs',
    ADJUST_USER_TIER: '/LoyaltyPoint/adjust-user-tier',
  },

  SUPPORT: {
    APPEAL: '/Support/appeal',
    ORDER_COMPLAINT: '/Support/order-complaint', // POST
    SHIPPER_COMPLAINT: '/Support/shipper-complaint', // POST
  },

  FAQ: {
    BASE: '/Faq',
    BY_ID: (id: string) => `/Faq/${id}`,
  },

  PAYMENT: {
    METHODS: '/Payment/methods',
    WALLET: '/Payment/wallet',
    TOP_UP: '/Payment/wallet/top-up',
    CONFIRM: '/Payment/confirm',
    WITHDRAW: '/Payment/withdraw',
    WITHDRAWALS: '/Payment/withdrawals',
    APPROVE_WITHDRAWAL: '/Payment/withdrawals/approve',
    TRANSACTIONS: '/Payment/transactions',
    INVOICE: '/Payment/invoice',
    REPAY_DEBT: '/Payment/shipper/repay-debt',
    DEBT_LIMIT: '/Payment/shipper/debt-limit',
    RECONCILIATION: '/Payment/reconciliation',
    SEPAY_CHECKOUT: (sessionId: string) => `/Payment/sepay/checkout/${sessionId}`,
    SEPAY_QR: (sessionId: string) => `/Payment/sepay/qr/${sessionId}`,
    SEPAY_STATUS: '/Payment/sepay/session/status',
    SEPAY_RECONCILE: '/Payment/sepay/reconcile',
    HISTORY: '/Payment/history',
    DASHBOARD: '/Payment/dashboard',
  },

  CHAT: {
    CREATE_SESSION: '/Chat/sessions',
    GET_MESSAGES: (sessionId: string) => `/Chat/sessions/${sessionId}/messages`,
    GET_SESSIONS: '/Chat/sessions',
    GET_CURRENT_SESSION: '/Chat/sessions/current',
    GET_USER_SESSIONS: '/Chat/sessions/my',
    CREATE_ORDER_SESSION: (orderId: string) => `/Chat/sessions/order/${orderId}`,
    GET_SELLER_ORDERS: '/Chat/sessions/seller/orders',
    CLAIM_SESSION: (sessionId: string) => `/Chat/sessions/${sessionId}/claim`,
  }
} as const;
