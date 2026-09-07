import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { IAuthContext, IUserDto } from '../interfaces';
import { StorageUtil } from '../utils/storage';
import { authService } from '../services/AuthService';

/**
 * Context Xác thực & Thông tin Người dùng (AuthContext).
 * Áp dụng nguyên lý DIP (Dependency Inversion) để các component UI phụ thuộc vào abstraction này.
 */
const AuthContext = createContext<IAuthContext | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Provider Quản lý trạng thái đăng nhập toàn cục (AuthProvider).
 * Duy trì thông tin người dùng, token, trạng thái loading và tự động đồng bộ hóa với localStorage.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<IUserDto | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Khôi phục trạng thái đăng nhập từ localStorage khi ứng dụng khởi chạy
  useEffect(() => {
    const savedToken = StorageUtil.getToken();
    const savedUser = StorageUtil.getUser();
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(savedUser);
    }
    setIsLoading(false);
  }, []);

  // Lắng nghe sự kiện thông báo thời gian thực để tự động tải lại hồ sơ (ví dụ khi được phê duyệt làm người bán / shipper)
  useEffect(() => {
    const handleNotification = async (_e: Event) => {
      if (token) {
        try {
          const res = await authService.getProfile();
          if (!res.error && res.data) {
            setUser(res.data);
            StorageUtil.setUser(res.data);
          }
        } catch (error) {
          // Bỏ qua nếu lỗi mạng tạm thời
        }
      }
    };

    window.addEventListener('ON_REALTIME_NOTIFICATION', handleNotification);
    return () => window.removeEventListener('ON_REALTIME_NOTIFICATION', handleNotification);
  }, [token]);

  /**
   * Lưu thông tin đăng nhập mới và cập nhật localStorage.
   * @param newToken - JWT access token
   * @param newUser - Thông tin tài khoản người dùng
   */
  const login = useCallback((newToken: string, newUser: IUserDto) => {
    setToken(newToken);
    setUser(newUser);
    StorageUtil.setToken(newToken);
    StorageUtil.setUser(newUser);
  }, []);

  /**
   * Đăng xuất tài khoản, xóa sạch token và thông tin người dùng khỏi state và localStorage.
   */
  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    StorageUtil.clearAuth();
  }, []);

  /**
   * Cập nhật thông tin tài khoản người dùng trong state và localStorage mà không cần đăng nhập lại.
   * @param updatedUser - Thông tin người dùng mới
   */
  const updateUser = useCallback((updatedUser: IUserDto) => {
    setUser(updatedUser);
    StorageUtil.setUser(updatedUser);
  }, []);

  const value: IAuthContext = {
    user,
    token,
    isAuthenticated: !!token,
    isLoading,
    login,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook tùy chỉnh để truy cập AuthContext. Báo lỗi nếu gọi ngoài AuthProvider.
 */
export function useAuthContext(): IAuthContext {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
