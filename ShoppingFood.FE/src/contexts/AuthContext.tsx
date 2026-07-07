import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { IAuthContext, IUserDto } from '../interfaces';
import { StorageUtil } from '../utils/storage';
import { authService } from '../services/AuthService';

/**
 * Auth Context — DIP (Dependency Inversion)
 * Components depend on this context abstraction, not concrete services
 */
const AuthContext = createContext<IAuthContext | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Auth Provider — manages authentication state globally
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<IUserDto | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore auth state from localStorage on mount
  useEffect(() => {
    const savedToken = StorageUtil.getToken();
    const savedUser = StorageUtil.getUser();
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(savedUser);
    }
    setIsLoading(false);
  }, []);

  // Lắng nghe sự kiện thông báo hệ thống để tự động tải lại Profile (ví dụ khi được phê duyệt làm người bán)
  useEffect(() => {
    const handleNotification = async (e: CustomEvent) => {
      // Có thể lọc các thông báo cụ thể (e.g. e.detail.title chứa 'phê duyệt')
      // Nhưng để an toàn và luôn cập nhật, ta fetch lại profile mỗi khi có thông báo hệ thống
      if (token) {
        try {
          const res = await authService.getProfile();
          if (!res.error && res.data) {
            setUser(res.data);
            StorageUtil.setUser(res.data);
          }
        } catch (error) {
          // Ignore
        }
      }
    };

    window.addEventListener('ON_REALTIME_NOTIFICATION', handleNotification as EventListener);
    return () => window.removeEventListener('ON_REALTIME_NOTIFICATION', handleNotification as EventListener);
  }, [token]);

  const login = useCallback((newToken: string, newUser: IUserDto) => {
    setToken(newToken);
    setUser(newUser);
    StorageUtil.setToken(newToken);
    StorageUtil.setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    StorageUtil.clearAuth();
  }, []);

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
 * Hook to access auth context — throws if used outside provider
 */
export function useAuthContext(): IAuthContext {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
