import { BaseService } from './base/BaseService';
import type { IUserDto, IRegisterRequest } from '../interfaces';

/**
 * User Service — handles user management endpoints
 * 
 * Inherits full CRUD from BaseService.
 * GET /api/User?filter=&skip=&take= is handled by base getAll()
 */
class UserService extends BaseService<IUserDto, IRegisterRequest> {
  protected readonly endpoint = '/User';
}

// Export singleton instance
export const userService = new UserService();
