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

  async login(credentials: ILoginRequest): Promise<IApiResponse<ILoginResponse>> {
    return httpClient.post<IApiResponse<ILoginResponse>>(API_ENDPOINTS.AUTH.LOGIN, credentials);
  }

  async loginGoogle(credentials: ILoginGoogleRequest): Promise<IApiResponse<ILoginResponse>> {
    return httpClient.post<IApiResponse<ILoginResponse>>(API_ENDPOINTS.AUTH.LOGIN_GOOGLE, credentials);
  }

  async loginMicrosoft(credentials: ILoginMicrosoftRequest): Promise<IApiResponse<ILoginResponse>> {
    return httpClient.post<IApiResponse<ILoginResponse>>(API_ENDPOINTS.AUTH.LOGIN_MICROSOFT, credentials);
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

  async upgradeToMall(reason: string): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.ROLE.UPGRADE_TO_MALL, { reason });
  }

  async getProfile(): Promise<IApiResponse<IUserDto>> {
    return httpClient.get<IApiResponse<IUserDto>>(API_ENDPOINTS.USER.PROFILE);
  }
}

// Export singleton instance
export const authService = new AuthService();
