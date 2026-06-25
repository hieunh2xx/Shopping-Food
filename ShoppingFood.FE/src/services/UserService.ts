import { httpClient } from './base/HttpClient';
import { BaseService } from './base/BaseService';
import { API_ENDPOINTS } from '../config/endpoints';
import type { IUserDto, IRegisterRequest, IChangePasswordRequest, IApiResponse } from '../interfaces';

/**
 * User Service — handles user management endpoints
 * 
 * Inherits full CRUD from BaseService.
 * GET /api/User?filter=&skip=&take= is handled by base getAll()
 */
class UserService extends BaseService<IUserDto, IRegisterRequest> {
  protected readonly endpoint = API_ENDPOINTS.USER.BASE;

  async changePassword(data: IChangePasswordRequest): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.USER.CHANGE_PASSWORD, data);
  }
}

// Export singleton instance
export const userService = new UserService();
