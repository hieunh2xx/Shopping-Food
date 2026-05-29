import { useState } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { authService } from '../services';
import type { ILoginRequest, IRegisterRequest, IRegisterSellerRequest, IUserDto } from '../interfaces';
import { StorageUtil } from '../utils/storage';
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
        const loginData = response.data;
        const userDto: IUserDto = {
          id: '',
          userName: loginData.username,
          fullName: loginData.fullName || loginData.username,
          role: loginData.role,
          status: 'Active',
          email: null,
          phone: null,
          avatarUrl: loginData.avatarUrl || null,
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

  const loginGoogle = async (credential: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.loginGoogle({ credential });
      if (!response.error && response.data) {
        const loginData = response.data;
        const userDto: IUserDto = {
          id: '',
          userName: loginData.username,
          fullName: loginData.fullName || loginData.username,
          role: loginData.role,
          status: 'Active',
          email: null,
          phone: null,
          avatarUrl: loginData.avatarUrl || null,
          createdAt: new Date().toISOString(),
        };
        ctxLogin(loginData.token, userDto);
        toast.success('Đăng nhập Google thành công!');
        return true;
      } else {
        setError(response.message);
        toast.error(response.message || 'Đăng nhập Google thất bại');
        return false;
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Đăng nhập Google thất bại';
      setError(message);
      toast.error(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const loginMicrosoft = async (code: string, redirectUri: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.loginMicrosoft({ code, redirectUri });
      if (!response.error && response.data) {
        const loginData = response.data;
        const userDto: IUserDto = {
          id: '',
          userName: loginData.username,
          fullName: loginData.fullName || loginData.username,
          role: loginData.role,
          status: 'Active',
          email: null,
          phone: null,
          avatarUrl: loginData.avatarUrl || null,
          createdAt: new Date().toISOString(),
        };
        ctxLogin(loginData.token, userDto);
        toast.success('Đăng nhập Microsoft thành công');
        return true;
      } else {
        setError(response.message);
        toast.error(response.message || 'Đăng nhập Microsoft thất bại');
        return false;
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Lỗi kết nối server';
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

  const upgradeToMall = async (reason: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.upgradeToMall(reason);
      if (!response.error) {
        toast.success(response.message || 'Yêu cầu lên Mall đã được gửi thành công.');
        return true;
      } else {
        setError(response.message);
        toast.error(response.message || 'Có lỗi xảy ra');
        return false;
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Lỗi không xác định';
      setError(message);
      toast.error(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (e) {
      console.warn("Logout request failed or network issue", e);
    }
    ctxLogout();
    toast.success('Đã đăng xuất');
  };

  return {
    user,
    isAuthenticated,
    isLoading: isLoading || ctxLoading,
    error,
    login,
    loginGoogle,
    loginMicrosoft,
    register,
    registerSeller,
    upgradeToMall,
    logout,
  };
}
