import { BaseService } from './base/BaseService';
import type { IMenuCategoryDto, IAddMenuCategoryRequest, IUpdateMenuCategoryRequest } from '../interfaces';

/**
 * Menu Category Service — handles menu category endpoints
 * 
 * Inherits CRUD from BaseService.
 * POST /api/MenuCategory and PUT /api/MenuCategory
 */
class MenuCategoryService extends BaseService<IMenuCategoryDto, IAddMenuCategoryRequest, IUpdateMenuCategoryRequest> {
  protected readonly endpoint = '/MenuCategory';
}

// Export singleton instance
export const menuCategoryService = new MenuCategoryService();
