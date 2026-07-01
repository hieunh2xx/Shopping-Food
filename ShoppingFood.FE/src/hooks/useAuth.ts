import { useState } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { authService } from '../services';
import type { ILoginRequest, IRegisterRequest, IRegisterSellerRequest, IUserDto } from '../interfaces';
import toast from 'react-hot-toast';
import { StorageUtil } from '../utils/storage';

/**
 * useAuth hook — encapsulates all auth-related logic
 * SRP: UI components don't need to know about authService directly
 */
export function useAuth() {
  const { login: ctxLogin, logout: ctxLogout, user, isAuthenticated, isLoading: ctxLoading } = useAuthContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAndSetProfile = async (loginData: any) => {
    StorageUtil.setToken(loginData.token);
    try {
      const profileRes = await authService.getProfile();
      if (!profileRes.error && profileRes.data) {
        ctxLogin(loginData.token, profileRes.data);
      } else {
        throw new Error("Cannot fetch profile");
      }
    } catch {
      // Fallback
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
    }
  };

  const login = async (credentials: ILoginRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.login(credentials);
      if (!response.error && response.data) {
        if (response.message === "RequireOtp") {
           return { success: true, requireOtp: true, data: response.data };
        }
        if (response.message === "AccountLocked") {
           return { success: true, isLocked: true, requireOtp: true, data: response.data };
        }
        const loginData = response.data;
        await fetchAndSetProfile(loginData);
        
        toast.success('Đăng nhập thành công!');
        return { success: true, requireOtp: false, role: loginData.role };
      } else {
        setError(response.message);
        toast.error(response.message || 'Đăng nhập thất bại');
        return { success: false, message: response.message };
      }
    } catch (err: any) {
      const message = err.response?.data?.message || err.response?.data?.title || err.message || 'Đăng nhập thất bại';
      setError(message);
      toast.error(message);
      return { success: false, message };
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
        await fetchAndSetProfile(loginData);
        toast.success('Đăng nhập Google thành công!');
        return { success: true, role: loginData.role };
      } else {
        setError(response.message);
        toast.error(response.message || 'Đăng nhập Google thất bại');
        return { success: false };
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Đăng nhập Google thất bại';
      setError(message);
      toast.error(message);
      return { success: false };
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
        await fetchAndSetProfile(loginData);
        toast.success('Đăng nhập Microsoft thành công');
        return { success: true, role: loginData.role };
      } else {
        setError(response.message);
        toast.error(response.message || 'Đăng nhập Microsoft thất bại');
        return { success: false };
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Lỗi kết nối server';
      setError(message);
      toast.error(message);
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  const loginFirebasePhone = async (idToken: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.loginFirebasePhone({ idToken });
      if (!response.error && response.data) {
        const loginData = response.data;
        await fetchAndSetProfile(loginData);
        toast.success('Đăng nhập bằng số điện thoại thành công!');
        return { success: true, role: loginData.role };
      } else {
        setError(response.message);
        toast.error(response.message || 'Đăng nhập thất bại');
        return { success: false };
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Lỗi kết nối server';
      setError(message);
      toast.error(message);
      return { success: false };
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
        return { success: true };
      } else {
        setError(response.message);
        toast.error(response.message || 'Đăng ký thất bại');
        return { success: false, errors: (response as any).errors };
      }
    } catch (err: any) {
      const message = err.response?.data?.message || err.response?.data?.title || err.message || 'Lỗi kết nối server';
      const validationErrors = err.response?.data?.errors;
      setError(message);
      toast.error(message);
      return { success: false, errors: validationErrors };
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
        toast.success('Đăng ký cửa hàng thành công! Đang chờ duyệt.');
        return { success: true };
      } else {
        setError(response.message);
        toast.error(response.message || 'Đăng ký thất bại');
        return { success: false, errors: (response as any).errors };
      }
    } catch (err: any) {
      const message = err.response?.data?.message || err.response?.data?.title || err.message || 'Lỗi kết nối server';
      const validationErrors = err.response?.data?.errors;
      setError(message);
      toast.error(message);
      return { success: false, errors: validationErrors };
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

  const sendLoginOtp = async (preAuthToken: string, method: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.sendLoginOtp({ preAuthToken, method });
      if (!response.error) {
        toast.success('Mã OTP đã được gửi!');
        return true;
      } else {
        setError(response.message);
        toast.error(response.message || 'Gửi OTP thất bại');
        return false;
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gửi OTP thất bại';
      setError(message);
      toast.error(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyLoginOtp = async (preAuthToken: string, otpCode: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.verifyLoginOtp({ preAuthToken, otpCode });
      if (!response.error && response.data) {
        const loginData = response.data;
        await fetchAndSetProfile(loginData);
        toast.success('Đăng nhập thành công!');
        return { success: true, role: loginData.role };
      } else {
        setError(response.message);
        toast.error(response.message || 'Xác thực OTP thất bại');
        return { success: false };
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Xác thực OTP thất bại';
      setError(message);
      toast.error(message);
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  const verifyUnlockAccount = async (preAuthToken: string, otpCode: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.verifyUnlockAccount({ preAuthToken, otpCode });
      if (!response.error && response.data) {
        const loginData = response.data;
        await fetchAndSetProfile(loginData);
        toast.success('Mở khóa và đăng nhập thành công!');
        return { success: true, role: loginData.role };
      } else {
        setError(response.message);
        toast.error(response.message || 'Xác thực OTP mở khóa thất bại');
        return { success: false };
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Xác thực OTP mở khóa thất bại';
      setError(message);
      toast.error(message);
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  const sendOtp = async (phone: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.sendOtp({ phone });
      if (!response.error) {
        toast.success('Mã OTP đã được gửi!');
        return true;
      } else {
        setError(response.message);
        toast.error(response.message || 'Gửi OTP thất bại');
        return false;
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gửi OTP thất bại';
      setError(message);
      toast.error(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    user,
    isAuthenticated,
    isLoading: isLoading || ctxLoading,
    error,
    login,
    loginFirebasePhone,
    sendLoginOtp,
    verifyLoginOtp,
    verifyUnlockAccount,
    sendOtp,
    loginGoogle,
    loginMicrosoft,
    register,
    registerSeller,
    upgradeToMall,
    logout,
  };
}
