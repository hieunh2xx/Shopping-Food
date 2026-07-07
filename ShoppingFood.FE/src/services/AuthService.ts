import { httpClient } from './base/HttpClient';
import { BaseService } from './base/BaseService';
import { API_ENDPOINTS } from '../config/endpoints';
import type { IApiResponse, IUserDto, ILoginRequest, ILoginGoogleRequest, ILoginMicrosoftRequest, ILoginResponse, IRegisterRequest, IRegisterSellerRequest } from '../interfaces';

/**
 * Auth Service — handles authentication endpoints
 * 
 * Extends BaseService<IUserDto> and adds auth-specific methods.
 * Demonstrates OCP: extending base without modifying it.
 */
class AuthService extends BaseService<IUserDto, IRegisterRequest> {
  protected readonly endpoint = API_ENDPOINTS.USER.BASE;

  async login(credentials: ILoginRequest): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.AUTH.LOGIN, credentials);
  }

  async loginGoogle(credentials: ILoginGoogleRequest): Promise<IApiResponse<ILoginResponse>> {
    return httpClient.post<IApiResponse<ILoginResponse>>(API_ENDPOINTS.AUTH.LOGIN_GOOGLE, credentials);
  }

  async loginMicrosoft(credentials: ILoginMicrosoftRequest): Promise<IApiResponse<ILoginResponse>> {
    return httpClient.post<IApiResponse<ILoginResponse>>(API_ENDPOINTS.AUTH.LOGIN_MICROSOFT, credentials);
  }

  async loginFirebasePhone(data: { idToken: string }): Promise<IApiResponse<ILoginResponse>> {
    return httpClient.post<IApiResponse<ILoginResponse>>('/User/LoginFirebasePhone', data);
  }

  async sendLoginOtp(data: { preAuthToken: string, method: string }): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>('/User/SendLoginOtp', data);
  }

  async sendOtp(data: { phone: string }): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>('/User/SendOtp', data);
  }

  async verifyLoginOtp(data: { preAuthToken: string, otpCode: string }): Promise<IApiResponse<ILoginResponse>> {
    return httpClient.post<IApiResponse<ILoginResponse>>('/User/VerifyLoginOtp', data);
  }

  async refreshToken(token: string): Promise<IApiResponse<ILoginResponse>> {
    return httpClient.post<IApiResponse<ILoginResponse>>('/User/RefreshToken', { token, refreshToken: "" });
  }

  async logout(): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>('/User/Logout');
  }

  async register(data: IRegisterRequest): Promise<IApiResponse<IUserDto>> {
    return httpClient.post<IApiResponse<IUserDto>>(API_ENDPOINTS.AUTH.REGISTER, data);
  }

  async registerSeller(data: IRegisterSellerRequest): Promise<IApiResponse<IUserDto>> {
    return httpClient.post<IApiResponse<IUserDto>>(API_ENDPOINTS.AUTH.REGISTER_SELLER, data);
  }

  async registerShipper(data: any): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.USER.REGISTER_SHIPPER, data);
  }

  async applySeller(data: { businessName: string, businessAddress: string, contactInfo: string, businessLicenseUrl: string, shopImageUrl: string }): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>('/User/ApplySeller', data);
  }

  async applyShipper(data: any): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>('/User/apply-shipper', data);
  }

  async getSellerApplicationStatus(): Promise<IApiResponse<any>> {
    return httpClient.get<IApiResponse<any>>(API_ENDPOINTS.USER.SELLER_APPLICATION_STATUS);
  }

  async updateSellerApplication(data: { id: string; businessName: string; businessAddress: string; businessLicenseUrl: string; shopImageUrl: string; contactInfo: string }): Promise<IApiResponse<any>> {
    return httpClient.put<IApiResponse<any>>(API_ENDPOINTS.USER.UPDATE_SELLER_APPLICATION, data);
  }

  async upgradeToMall(reason: string): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.ROLE.UPGRADE_TO_MALL, { reason });
  }

  async getProfile(): Promise<IApiResponse<IUserDto>> {
    return httpClient.get<IApiResponse<IUserDto>>(API_ENDPOINTS.USER.PROFILE);
  }

  async uploadAvatar(file: File): Promise<IApiResponse<{ avatarUrl: string }>> {
    const formData = new FormData();
    formData.append('file', file);
    return httpClient.post<IApiResponse<{ avatarUrl: string }>>('/User/UploadAvatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  async uploadImage(file: File): Promise<IApiResponse<{ imageUrl: string }>> {
    const formData = new FormData();
    formData.append('file', file);
    return httpClient.post<IApiResponse<{ imageUrl: string }>>('/User/UploadImage', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  async forgotPassword(data: { email: string }): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>('/User/ForgotPassword', data);
  }

  async verifyResetOtp(data: { email: string; otpCode: string }): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>('/User/VerifyResetOtp', data);
  }

  async resetPassword(data: { email: string; otpCode: string; newPassword: string }): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>('/User/ResetPassword', data);
  }

  async changePassword(data: { oldPassword: string; newPassword: string }): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>('/User/ChangePassword', data);
  }

  async updateProfile(data: { fullName?: string; avatarUrl?: string; gender?: string; dateOfBirth?: string }): Promise<IApiResponse<any>> {
    return httpClient.put<IApiResponse<any>>('/User/UpdateProfile', data);
  }

  async requestUpdateContact(data: { newEmail?: string; newPhone?: string }): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>('/User/RequestUpdateContact', data);
  }

  async verifyUpdateContact(data: { newEmail?: string; newPhone?: string; otpCode: string }): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>('/User/VerifyUpdateContact', data);
  }

  async lockAccount(): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>('/User/LockAccount');
  }

  async verifyUnlockAccount(data: { preAuthToken: string; otpCode: string }): Promise<IApiResponse<ILoginResponse>> {
    return httpClient.post<IApiResponse<ILoginResponse>>('/User/VerifyUnlockAccount', data);
  }

  async requestDeletion(): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>('/User/RequestDeletion');
  }
}

// Export singleton instance
export const authService = new AuthService();
