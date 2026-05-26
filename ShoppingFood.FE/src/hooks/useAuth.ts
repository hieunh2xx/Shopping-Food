import { useState } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { authService } from '../services';
import type { ILoginRequest, IRegisterRequest, IRegisterSellerRequest, IUserDto } from '../interfaces';
import toast from 'react-hot-toast';

/**
 * useAuth hook — encapsulates all auth-related logic
 * SRP: UI components don't need to know about authService directly
 */
export function useAuth() {
  const { login: ctxLogin, logout: ctxLogout, user, isAuthenticated, isLoading: ctxLoading } = useAuthContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (credentials: ILoginRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.login(credentials);
      if (!response.error && response.data) {
        // After login, we need to construct a minimal user object from login response
        const loginData = response.data;
        const userDto: IUserDto = {
          id: '',
          userName: loginData.username,
          fullName: loginData.username,
          role: loginData.role,
          status: 'Active',
          email: null,
          phone: null,
          avatarUrl: null,
          createdAt: new Date().toISOString(),
        };
        ctxLogin(loginData.token, userDto);
        toast.success('Đăng nhập thành công!');
        return true;
      } else {
        setError(response.message);
        toast.error(response.message || 'Đăng nhập thất bại');
        return false;
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Đăng nhập thất bại';
      setError(message);
      toast.error(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: IRegisterRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.register(data);
      if (!response.error) {
        toast.success('Đăng ký thành công! Vui lòng đăng nhập.');
        return true;
      } else {
        setError(response.message);
        toast.error(response.message || 'Đăng ký thất bại');
        return false;
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Đăng ký thất bại';
      setError(message);
      toast.error(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const registerSeller = async (data: IRegisterSellerRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.registerSeller(data);
      if (!response.error) {
        toast.success('Đăng ký đối tác thành công! Hồ sơ đang được xét duyệt.');
        return true;
      } else {
        setError(response.message);
        toast.error(response.message || 'Đăng ký thất bại');
        return false;
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Đăng ký thất bại';
      setError(message);
      toast.error(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    ctxLogout();
    toast.success('Đã đăng xuất');
  };

  return {
    user,
    isAuthenticated,
    isLoading: isLoading || ctxLoading,
    error,
    login,
    register,
    registerSeller,
    logout,
  };
}
