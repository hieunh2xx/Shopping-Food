import axios, { type AxiosInstance, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios';
import { ENV } from '../../config/env';
import { StorageUtil } from '../../utils/storage';
import { authService } from '../AuthService';

/**
 * Singleton HTTP Client wrapper around Axios
 * 
 * Responsibilities (SRP):
 * - Manage single Axios instance
 * - Auto-attach Bearer token via request interceptor
 * - Handle 401 responses via response interceptor
 */
class HttpClient {
  private static instance: HttpClient;
  private axiosInstance: AxiosInstance;
  private isRefreshing = false;
  private refreshSubscribers: ((token: string) => void)[] = [];

  private constructor() {
    this.axiosInstance = axios.create({
      baseURL: ENV.API_BASE_URL,
      timeout: 30000,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  /**
   * Get singleton instance (Singleton Pattern)
   */
  public static getInstance(): HttpClient {
    if (!HttpClient.instance) {
      HttpClient.instance = new HttpClient();
    }
    return HttpClient.instance;
  }

  /**
   * Setup request & response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor: attach Bearer token
    this.axiosInstance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = StorageUtil.getToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Helper to detect if a message is purely English (lacks Vietnamese diacritics)
    const isEnglish = (msg: string) => {
      if (!msg || typeof msg !== 'string') return false;
      const viRegex = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
      // If it contains letters but NO Vietnamese characters, treat as English
      return /[a-zA-Z]/.test(msg) && !viRegex.test(msg);
    };

    // Response interceptor: handle 401 unauthorized and filter English messages
    this.axiosInstance.interceptors.response.use(
      (response) => {
        const msg = response.data && response.data.message;
        if (msg && isEnglish(msg) && msg !== 'AccountLocked' && msg !== 'RequireOtp') {
          response.data.message = ''; // Clear so components use their Vietnamese fallbacks
        }
        return response;
      },
      async (error) => {
        if (error.response?.data?.message && isEnglish(error.response.data.message)) {
          error.response.data.message = ''; // Clear English error messages
        }
        const originalRequest = error.config;
        
        // Do not attempt to refresh token for auth endpoints
        const isAuthEndpoint = originalRequest.url?.includes('/User/Login') || 
                               originalRequest.url?.includes('/User/Register') ||
                               originalRequest.url?.includes('/User/Send');
                               
        if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
          if (this.isRefreshing) {
            return new Promise((resolve) => {
              this.refreshSubscribers.push((token: string) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                resolve(this.axiosInstance(originalRequest));
              });
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const token = StorageUtil.getToken();
            if (!token) {
              throw new Error('No access token available');
            }

            const response = await authService.refreshToken(token);
            if (!response.error && response.data) {
              StorageUtil.setToken(response.data.token);

              // Update authorization header for current request
              originalRequest.headers.Authorization = `Bearer ${response.data.token}`;
              
              // Notify all subscribers
              this.refreshSubscribers.forEach((cb) => cb(response.data.token));
              this.refreshSubscribers = [];

              return this.axiosInstance(originalRequest);
            } else {
              throw new Error('Failed to refresh token');
            }
          } catch (refreshError) {
            StorageUtil.clearAuth();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Expose the Axios instance for services to use
   */
  public getAxios(): AxiosInstance {
    return this.axiosInstance;
  }

  /**
   * Generic GET request
   */
  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.get<T>(url, config);
    return response.data;
  }

  /**
   * Generic POST request
   */
  public async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.post<T>(url, data, config);
    return response.data;
  }

  /**
   * Generic PUT request
   */
  public async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.put<T>(url, data, config);
    return response.data;
  }

  /**
   * Generic PATCH request
   */
  public async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.patch<T>(url, data, config);
    return response.data;
  }

  /**
   * Generic DELETE request
   */
  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.delete<T>(url, config);
    return response.data;
  }
}

// Export singleton instance
export const httpClient = HttpClient.getInstance();
export default HttpClient;
