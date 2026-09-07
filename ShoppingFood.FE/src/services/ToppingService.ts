import { httpClient } from './base/HttpClient';
import { API_ENDPOINTS } from '../config/endpoints';
import type { IApiResponse, IToppingDto, ICreateToppingRequest, IUpdateToppingRequest } from '../interfaces';

/**
 * Dịch vụ Quản lý Topping / Món ăn kèm (ToppingService).
 * Phụ trách các thao tác CRUD danh sách topping của từng nhà hàng (ví dụ: trân châu, phô mai, thêm trứng).
 */
class ToppingService {
  /**
   * Lấy danh sách toàn bộ các món topping thuộc về một nhà hàng cụ thể.
   * @param restaurantId - Mã nhà hàng
   */
  async getByRestaurantId(restaurantId: string): Promise<IApiResponse<IToppingDto[]>> {
    return httpClient.get<IApiResponse<IToppingDto[]>>(API_ENDPOINTS.TOPPING.BY_RESTAURANT(restaurantId));
  }

  /**
   * Tạo mới một món topping cho nhà hàng.
   * @param data - Tên topping, giá tiền, mô tả
   */
  async create(data: ICreateToppingRequest): Promise<IApiResponse<IToppingDto>> {
    return httpClient.post<IApiResponse<IToppingDto>>(API_ENDPOINTS.TOPPING.BASE, data);
  }

  /**
   * Cập nhật thông tin topping theo ID.
   * @param id - Mã topping
   * @param data - Dữ liệu cập nhật
   */
  async update(id: string, data: IUpdateToppingRequest): Promise<IApiResponse<IToppingDto>> {
    return httpClient.put<IApiResponse<IToppingDto>>(API_ENDPOINTS.TOPPING.BY_ID(id), data);
  }

  /**
   * Xóa một món topping khỏi thực đơn của quán.
   * @param id - Mã topping cần xóa
   */
  async delete(id: string): Promise<IApiResponse<any>> {
    return httpClient.delete<IApiResponse<any>>(API_ENDPOINTS.TOPPING.BY_ID(id));
  }
}

// Khởi tạo và xuất thể hiện duy nhất của ToppingService
export const toppingService = new ToppingService();
export default toppingService;
