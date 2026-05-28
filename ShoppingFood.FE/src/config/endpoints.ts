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
  ROLE:{
    UPGRADE_TO_MALL: '/User/UpgradeToMall',
  },
  // === User Management (UserController) ===
  USER: {
    BASE: '/User',
    GET_ALL: '/User',          // GET ?filter=&skip=&take=
    PROFILE: '/User/Profile',  // GET
  },

  // === Order Management (OrderController) ===
  ORDER: {
    MY_ORDERS: '/Order/MyOrders', // GET
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
  },

  // === Menu Category (MenuCategoryController) ===
  MENU_CATEGORY: {
    BASE: '/MenuCategory',
    CREATE: '/MenuCategory',   // POST
    UPDATE: '/MenuCategory',   // PUT
  },

  // === Admin (AdminController) ===
  ADMIN: {
    BASE: '/Admin',
    APPROVE_SELLER: '/Admin/ApproveSellerApplication',  // POST
    APPROVE_PRODUCT: '/Admin/ApproveProduct',           // POST
  },
} as const;
