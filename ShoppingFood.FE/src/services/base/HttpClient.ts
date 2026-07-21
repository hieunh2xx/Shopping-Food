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

    const translateError = (msg: string): string => {
      if (!msg) return '';
      const lower = msg.toLowerCase();
      // Auth & Account
      if (lower.includes('user already exists') || lower.includes('username already exists') || lower.includes('email already exists') || lower.includes('already exists')) return 'Thông tin tài khoản đã tồn tại';
      if (lower.includes('invalid credential') || lower.includes('invalid password') || lower.includes('wrong password')) return 'Thông tin đăng nhập không chính xác';
      if (lower.includes('not found') || lower.includes('does not exist')) return 'Không tìm thấy dữ liệu';
      if (lower.includes('locked')) return 'Tài khoản đã bị khóa';
      if (lower.includes('unauthorized') || lower.includes('forbidden') || lower.includes('access denied') || lower.includes('permission')) return 'Tài khoản của bạn không có quyền truy cập hoặc thực hiện thao tác này';
      if (lower.includes('token expired') || lower.includes('token is invalid')) return 'Phiên đăng nhập đã hết hạn';

      // Validation & General
      if (lower.includes('validation') || lower.includes('one or more validation errors')) return 'Dữ liệu không hợp lệ, vui lòng kiểm tra lại';
      if (lower.includes('required') || lower.includes('not empty')) return 'Trường này không được bỏ trống';
      if (lower.includes('valid e-mail') || lower.includes('invalid email')) return 'Email không hợp lệ';
      if (lower.includes('at least')) return 'Dữ liệu quá ngắn';
      if (lower.includes('exceed') || lower.includes('maximum')) return 'Dữ liệu quá dài';
      if (lower.includes('do not match')) return 'Dữ liệu không khớp';
      if (lower.includes('already in use') || lower.includes('taken')) return 'Đã được sử dụng';
      if (lower.includes('format') || lower.includes('must contain') || lower.includes('digits')) return 'Định dạng không hợp lệ';
      if (lower.includes('valid image') || lower.includes('image file')) return 'Chỉ chấp nhận file ảnh hợp lệ (.jpg, .jpeg, .png, .webp)';
      if (lower.includes('between')) return 'Giá trị không nằm trong khoảng cho phép';

      // Complaint & Appeal
      if (lower.includes('only customers')) return 'Chỉ khách hàng mới có quyền gửi khiếu nại.';
      if (lower.includes('your own orders')) return 'Bạn chỉ có thể khiếu nại đơn hàng của chính mình.';
      if (lower.includes('delivered order')) return 'Bạn chỉ có thể gửi khiếu nại cho đơn hàng đã giao thành công.';
      if (lower.includes('within 24 hours')) return 'Thời gian gửi khiếu nại phải trong vòng 24 giờ sau khi nhận hàng. Đơn hàng này đã quá hạn.';
      if (lower.includes('already been submitted')) return 'Đơn hàng hoặc yêu cầu này đã được gửi khiếu nại trước đó.';
      if (lower.includes('complaint not found')) return 'Không tìm thấy sự cố/khiếu nại này.';
      if (lower.includes('already been processed')) return 'Sự cố/khiếu nại này đã được xử lý trước đó.';
      if (lower.includes('save failed')) return 'Lỗi hệ thống: Không thể lưu quyết định xử lý.';

      // Axios generic errors
      if (lower.includes('request failed with status code 403')) return 'Tài khoản của bạn không có quyền thực hiện thao tác này';
      if (lower.includes('request failed with status code 401')) return 'Vui lòng đăng nhập lại';
      if (lower.includes('network error')) return 'Lỗi kết nối mạng, vui lòng kiểm tra lại';

      return msg; // Return original if not translated to avoid empty strings
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
        if (error.response?.data) {
          if (error.response.data.message && isEnglish(error.response.data.message)) {
            const translated = translateError(error.response.data.message);
            error.response.data.message = translated;
          }
          if (error.response.data.title && isEnglish(error.response.data.title)) {
            const translated = translateError(error.response.data.title);
            error.response.data.title = translated;
          }
          if (error.response.data.errors) {
            Object.keys(error.response.data.errors).forEach(key => {
              if (Array.isArray(error.response.data.errors[key])) {
                error.response.data.errors[key] = error.response.data.errors[key].map((errItem: string) =>
                  isEnglish(errItem) ? translateError(errItem) : errItem
                );
              }
            });
          } else if (Array.isArray(error.response.data.data) && error.response.data.data.length > 0 && error.response.data.data[0].property) {
            // Map custom ApiResponse validation array into the errors dictionary
            const mappedErrors: Record<string, string[]> = {};
            error.response.data.data.forEach((item: any) => {
              if (item.property && item.error) {
                mappedErrors[item.property] = [isEnglish(item.error) ? translateError(item.error) : item.error];
              }
            });
            error.response.data.errors = mappedErrors;
          }
        }
        const originalRequest = error.config;

        // Do not attempt to refresh token for auth endpoints
        const urlLower = originalRequest.url?.toLowerCase() || '';
        const isAuthEndpoint = urlLower.includes('/user/login') ||
          urlLower.includes('/user/register') ||
          urlLower.includes('/user/send') ||
          urlLower.includes('/user/uploadimage');

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

        // Handle 503 Service Unavailable (Maintenance Mode)
        if (error.response?.status === 503 && window.location.pathname !== '/maintenance') {
          window.location.href = '/maintenance';
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
