import { httpClient } from './base/HttpClient';
import { BaseService } from './base/BaseService';
import { API_ENDPOINTS } from '../config/endpoints';
import type { IApiResponse, IUserDto, ILoginRequest, ILoginResponse, IRegisterRequest, IRegisterSellerRequest } from '../interfaces';

/**
 * Auth Service — handles authentication endpoints
 * 
 * Extends BaseService<IUserDto> and adds auth-specific methods.
 * Demonstrates OCP: extending base without modifying it.
 */
class AuthService extends BaseService<IUserDto, IRegisterRequest> {
  protected readonly endpoint = API_ENDPOINTS.USER.BASE;

  /**
   * POST /api/User/Login
   * Authenticates user and returns JWT token
   */
  async login(credentials: ILoginRequest): Promise<IApiResponse<ILoginResponse>> {
    return httpClient.post<IApiResponse<ILoginResponse>>(API_ENDPOINTS.AUTH.LOGIN, credentials);
  }

  async register(data: IRegisterRequest): Promise<IApiResponse<IUserDto>> {
    return httpClient.post<IApiResponse<IUserDto>>(API_ENDPOINTS.AUTH.REGISTER, data);
  }

  async registerSeller(data: IRegisterSellerRequest): Promise<IApiResponse<IUserDto>> {
    return httpClient.post<IApiResponse<IUserDto>>(API_ENDPOINTS.AUTH.REGISTER_SELLER, data);
  }
}

// Export singleton instance
export const authService = new AuthService();
