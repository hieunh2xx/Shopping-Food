import { BaseService } from './base/BaseService';
import { httpClient } from './base/HttpClient';
import { API_ENDPOINTS } from '../config/endpoints';
import type { IApiResponse, IMenuCategoryDto, IAddMenuCategoryRequest, IUpdateMenuCategoryRequest } from '../interfaces';

/**
 * Menu Category Service — handles menu category endpoints
 * 
 * Inherits CRUD from BaseService.
 * POST /api/MenuCategory and PUT /api/MenuCategory
 */
class MenuCategoryService extends BaseService<IMenuCategoryDto, IAddMenuCategoryRequest, IUpdateMenuCategoryRequest> {
  protected readonly endpoint = API_ENDPOINTS.MENU_CATEGORY.BASE;

  override async update(id: string, data: IUpdateMenuCategoryRequest): Promise<IApiResponse<IMenuCategoryDto>> {
    return httpClient.put<IApiResponse<IMenuCategoryDto>>(this.endpoint, { id, ...data });
  }
}

// Export singleton instance
export const menuCategoryService = new MenuCategoryService();
