import { useState } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { authService } from '../services';
import type { ILoginRequest, IRegisterRequest, IRegisterSellerRequest, IUserDto } from '../interfaces';
import toast from 'react-hot-toast';
import { StorageUtil } from '../utils/storage';

/**
 * Trích xuất thông điệp báo lỗi từ response Axios hoặc trả về câu thông báo mặc định.
 * @param err - Đối tượng lỗi
 * @param fallback - Câu thông báo dự phòng
 */
const extractErrorMessage = (err: any, fallback: string): string => {
  let message = err?.response?.data?.message || err?.response?.data?.title;
  if (!message) {
    message = (err?.message && !err.message.includes('status code')) ? err.message : fallback;
  }
  return message;
};

/**
 * Hook tùy chỉnh Xác thực và Quản lý Phiên đăng nhập (useAuth).
 * Tuân thủ nguyên lý Single Responsibility Principle (SRP) — đóng gói toàn bộ logic đăng nhập, đăng ký, xác thực OAuth/Firebase và lấy thông tin hồ sơ.
 */
export function useAuth() {
  const { login: ctxLogin, logout: ctxLogout, user, token, isAuthenticated, isLoading: ctxLoading } = useAuthContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Tải và thiết lập thông tin hồ sơ cá nhân sau khi nhận JWT token từ máy chủ.
   * @param loginData - Dữ liệu trả về từ API login
   */
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
      // Dự phòng nếu không lấy được chi tiết hồ sơ
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

  /**
   * Đăng nhập tài khoản bằng tên đăng nhập và mật khẩu thông thường.
   * @param credentials - Thông tin đăng nhập
   */
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
        toast.error(response.message);
        return { success: false, message: response.message };
      }
    } catch (err: any) {
      let message = err.response?.data?.message || err.response?.data?.title;
      if (!message) {
        message = (err.message && !err.message.includes('status code')) ? err.message : 'Đăng nhập thất bại';
      }
      setError(message);
      toast.error(message);
      return { success: false, message };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Đăng nhập tài khoản Google thông qua Google Identity Services ID token.
   * @param credential - JWT credential token từ Google
   */
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
        toast.error(response.message);
        return { success: false };
      }
    } catch (err: any) {
      const message = extractErrorMessage(err, 'Đăng nhập Google thất bại');
      setError(message);
      toast.error(message);
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Đăng nhập tài khoản Microsoft Office365 / Entra ID thông qua mã xác thực code.
   * @param code - Authorization code từ Microsoft
   * @param redirectUri - URI chuyển hướng
   */
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
        toast.error(response.message);
        return { success: false };
      }
    } catch (err: any) {
      const message = extractErrorMessage(err, 'Lỗi kết nối server');
      setError(message);
      toast.error(message);
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Đăng nhập nhanh bằng mã OTP số điện thoại xác thực qua Firebase Phone Auth.
   * @param idToken - Firebase idToken
   */
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
        toast.error(response.message);
        return { success: false };
      }
    } catch (err: any) {
      const message = extractErrorMessage(err, 'Lỗi kết nối server');
      setError(message);
      toast.error(message);
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Đăng ký tài khoản khách hàng thông thường mới.
   * @param data - Thông tin đăng ký
   */
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
        toast.error(response.message);
        return { success: false, errors: (response as any).errors };
      }
    } catch (err: any) {
      let message = err.response?.data?.message || err.response?.data?.title;
      if (!message) {
        message = (err.message && !err.message.includes('status code')) ? err.message : 'Dữ liệu không hợp lệ hoặc đã tồn tại';
      }
      const validationErrors = err.response?.data?.errors;
      setError(message);
      toast.error(message);
      return { success: false, errors: validationErrors };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Đăng ký mở gian hàng đối tác Người bán hàng (Seller).
   * @param data - Hồ sơ quán ăn, giấy phép, CCCD
   */
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
        toast.error(response.message);
        return { success: false, errors: (response as any).errors };
      }
    } catch (err: any) {
      let message = err.response?.data?.message || err.response?.data?.title;
      if (!message) {
        message = (err.message && !err.message.includes('status code')) ? err.message : 'Dữ liệu không hợp lệ hoặc đã tồn tại';
      }
      const validationErrors = err.response?.data?.errors;
      setError(message);
      toast.error(message);
      return { success: false, errors: validationErrors };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Gửi yêu cầu nâng cấp tài khoản cửa hàng lên danh hiệu Mall chính hãng.
   * @param reason - Lý do và chứng nhận đính kèm
   */
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
        toast.error(response.message);
        return false;
      }
    } catch (err: any) {
      const message = extractErrorMessage(err, 'Lỗi không xác định');
      setError(message);
      toast.error(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Đăng xuất tài khoản khỏi hệ thống.
   */
  const logout = async () => {
    try {
      await authService.logout();
    } catch (e) {
      console.warn("Logout request failed or network issue", e);
    }
    ctxLogout();
    toast.success('Đã đăng xuất');
  };

  /**
   * Gửi mã OTP xác thực 2 bước qua Email hoặc SMS khi đăng nhập.
   * @param preAuthToken - Token tạm
   * @param method - Phương thức gửi (Email/Sms)
   */
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
        toast.error(response.message);
        return false;
      }
    } catch (err: any) {
      const message = extractErrorMessage(err, 'Gửi OTP thất bại');
      setError(message);
      toast.error(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Xác thực mã OTP 2 bước để hoàn tất đăng nhập.
   * @param preAuthToken - Token tạm
   * @param otpCode - Mã 6 chữ số
   */
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
        toast.error(response.message);
        return { success: false };
      }
    } catch (err: any) {
      const message = extractErrorMessage(err, 'Xác thực OTP thất bại');
      setError(message);
      toast.error(message);
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Xác thực mã OTP để mở khóa tài khoản bị tạm khóa do nhập sai mật khẩu nhiều lần.
   * @param preAuthToken - Token tạm
   * @param otpCode - Mã OTP mở khóa
   */
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
        toast.error(response.message);
        return { success: false };
      }
    } catch (err: any) {
      const message = extractErrorMessage(err, 'Xác thực OTP mở khóa thất bại');
      setError(message);
      toast.error(message);
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Gửi mã OTP xác thực tới số điện thoại.
   * @param phone - Số điện thoại
   */
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
        toast.error(response.message);
        return false;
      }
    } catch (err: any) {
      const message = extractErrorMessage(err, 'Gửi OTP thất bại');
      setError(message);
      toast.error(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    user,
    token,
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
