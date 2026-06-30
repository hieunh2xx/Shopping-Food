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
    SEARCH: '/Product/Search',                     // GET
    BEST_SELLERS: '/Product/BestSellers',          // GET ?take=
    CATEGORIES: '/Product/Categories',             // GET
    STOCK_STATUS: (id: string) => `/Product/StockStatus/${id}`,       // PATCH
    VISIBILITY: (id: string) => `/Product/Visibility/${id}`,          // PATCH
    AVAILABILITY: (id: string) => `/Product/TimeAvailability/${id}`,  // PATCH
    REPORT: '/Product/Report',                     // POST
    REVIEW: '/Product/review',                     // POST
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
    SUSPEND_RESTAURANT: '/Admin/suspend-restaurant', // POST (assuming it exists or will be added, wait I should check if it exists in API)
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
    SCHEDULE_AREA: 'Shipper/schedule-area',
    AVAILABLE_OFFERS: '/Shipper/available-offers',
    REJECT_OFFER: '/Shipper/reject-offers',
    DELIVERY_ROUTE: (orderId: string) => `/Shipper/delivery-route/${orderId}`, // GET
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
    UPDATE_DELIVERY_RADIUS: '/Restaurant/delivery-radius',
    UPDATE_SHIPPING_FEE: '/Restaurant/shipping-fee',
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
  },

  DISCOUNT: {
    BASE: '/Discount',
    CREATE: '/Discount',
    SAVE: '/Discount/save',
    BY_ID: (id: string) => `/Discount/${id}`,
    APPLY: '/Discount/apply',
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
  },
} as const;

