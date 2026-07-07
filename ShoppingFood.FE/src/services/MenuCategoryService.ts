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

  async getByRestaurant(restaurantId: string): Promise<IApiResponse<IMenuCategoryDto[]>> {
    return httpClient.get<IApiResponse<IMenuCategoryDto[]>>(API_ENDPOINTS.MENU_CATEGORY.BY_RESTAURANT(restaurantId));
  }

  async getGlobalCategories(): Promise<IApiResponse<any>> {
    return httpClient.get<IApiResponse<any>>(API_ENDPOINTS.SYSTEM.GLOBAL_MENU_CATEGORY);
  }

  override async update(id: string, data: IUpdateMenuCategoryRequest): Promise<IApiResponse<IMenuCategoryDto>> {
    return httpClient.put<IApiResponse<IMenuCategoryDto>>(this.endpoint, { ...data, id });
  }
}

// Export singleton instance
export const menuCategoryService = new MenuCategoryService();
