
/**
 * Quản lý các biến môi trường của ứng dụng Vite Frontend.
 */
export const ENV = {
  /** Địa chỉ gốc của RESTful API backend */
  API_BASE_URL: (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:5091/api',
  /** JWT Issuer xác thực */
  JWT_ISSUER: import.meta.env.VITE_JWT_ISSUER as string,
  /** JWT Audience xác thực */
  JWT_AUDIENCE: import.meta.env.VITE_JWT_AUDIENCE as string,
  /** Tên ứng dụng */
  APP_NAME: import.meta.env.VITE_APP_NAME as string,
  /** Client ID đăng nhập Google OAuth */
  GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID as string,
  /** Cờ kiểm tra môi trường Development */
  IS_DEV: import.meta.env.DEV,
  /** Cờ kiểm tra môi trường Production */
  IS_PROD: import.meta.env.PROD,
} as const;
