/**
 * Type-safe environment configuration
 * Centralized access point for all environment variables
 */
export const ENV = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL as string,
  JWT_ISSUER: import.meta.env.VITE_JWT_ISSUER as string,
  APP_NAME: import.meta.env.VITE_APP_NAME as string,
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD,
} as const;
