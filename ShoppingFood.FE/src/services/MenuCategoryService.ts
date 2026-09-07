import { BaseService } from './base/BaseService';
import { httpClient } from './base/HttpClient';
import { API_ENDPOINTS } from '../config/endpoints';
import type { IApiResponse, IMenuCategoryDto, IAddMenuCategoryRequest, IUpdateMenuCategoryRequest } from '../interfaces';

/**
 * Dịch vụ Quản lý Danh mục Thực đơn (MenuCategoryService).
 * Kế thừa từ BaseService<IMenuCategoryDto> để cung cấp các thao tác CRUD danh mục món của từng quán và danh mục toàn hệ thống.
 */
class MenuCategoryService extends BaseService<IMenuCategoryDto, IAddMenuCategoryRequest, IUpdateMenuCategoryRequest> {
  protected readonly endpoint = API_ENDPOINTS.MENU_CATEGORY.BASE;

  /**
   * Lấy danh sách toàn bộ các danh mục thực đơn thuộc về một nhà hàng cụ thể.
   * @param restaurantId - Mã nhà hàng
   * @returns Danh sách danh mục món ăn
   */
  async getByRestaurant(restaurantId: string): Promise<IApiResponse<IMenuCategoryDto[]>> {
    return httpClient.get<IApiResponse<IMenuCategoryDto[]>>(API_ENDPOINTS.MENU_CATEGORY.BY_RESTAURANT(restaurantId));
  }

  /**
   * Lấy danh sách các danh mục thực đơn chung toàn sàn (Global Categories).
   */
  async getGlobalCategories(): Promise<IApiResponse<any>> {
    return httpClient.get<IApiResponse<any>>(API_ENDPOINTS.SYSTEM.GLOBAL_MENU_CATEGORY);
  }

  /**
   * Cập nhật thông tin danh mục thực đơn của nhà hàng (Ghi đè phương thức base update để truyền ID trong body).
   * @param id - Mã danh mục
   * @param data - Dữ liệu cập nhật
   */
  override async update(id: string, data: IUpdateMenuCategoryRequest): Promise<IApiResponse<IMenuCategoryDto>> {
    return httpClient.put<IApiResponse<IMenuCategoryDto>>(this.endpoint, { ...data, id });
  }
}

// Khởi tạo và xuất thể hiện duy nhất của MenuCategoryService
export const menuCategoryService = new MenuCategoryService();
