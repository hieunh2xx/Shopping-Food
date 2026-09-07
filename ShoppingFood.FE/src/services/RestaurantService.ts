import { httpClient } from './base/HttpClient';
import { API_ENDPOINTS } from '../config/endpoints';
import type {
  IApiResponse,
  IRestaurantProfileDto,
  IUpdateRestaurantBasicInfo,
  IUpdateRestaurantOperatingHours,
  IUpdateRestaurantStatus,
  IUpdateRestaurantDeliveryConfig,
  INearbyRestaurantDto,
  IFavoriteRestaurantDto
} from '../interfaces';

/**
 * Dịch vụ Quản lý Nhà hàng & Cửa hàng (RestaurantService).
 * Phụ trách các thao tác: xem thông tin quán, quán ăn gần đây (Nearby), quán yêu thích (Favorites), thống kê doanh số và cập nhật cấu hình hoạt động của quán.
 */
class RestaurantService {
  /**
   * Lấy thông tin chi tiết hồ sơ nhà hàng theo ID (địa chỉ, giờ mở cửa, ảnh, thực đơn, đánh giá).
   * @param id - Mã nhà hàng
   */
  async getDetail(id: string): Promise<IApiResponse<IRestaurantProfileDto>> {
    return httpClient.get<IApiResponse<IRestaurantProfileDto>>(API_ENDPOINTS.RESTAURANT.BY_ID(id));
  }

  /**
   * Lấy số liệu thống kê Dashboard của nhà hàng (doanh thu, số lượng đơn, đánh giá) theo khoảng thời gian.
   * @param params - Ngày bắt đầu và ngày kết thúc
   */
  async getDashboardStats(params?: { startDate?: string; endDate?: string }): Promise<IApiResponse<any>> {
    return httpClient.get<IApiResponse<any>>(API_ENDPOINTS.RESTAURANT.DASHBOARD_STATS, { params });
  }

  /**
   * Lấy danh sách các nhà hàng ở gần vị trí người dùng trong bán kính nhất định (tính theo GPS).
   * @param params - Vĩ độ, kinh độ, bán kính (km), phân trang
   */
  async getNearby(params: { latitude: number; longitude: number; radiusInKm: number; skip?: number; take?: number }): Promise<IApiResponse<INearbyRestaurantDto[]>> {
    return httpClient.get<IApiResponse<INearbyRestaurantDto[]>>(API_ENDPOINTS.RESTAURANT.NEARBY, { params });
  }

  /**
   * Lấy danh sách các nhà hàng yêu thích đã được người dùng lưu lại.
   * @param params - Tham số phân trang
   */
  async getFavorites(params?: { skip?: number; take?: number }): Promise<IApiResponse<IFavoriteRestaurantDto[]>> {
    return httpClient.get<IApiResponse<IFavoriteRestaurantDto[]>>(API_ENDPOINTS.RESTAURANT.FAVORITES, {
      params,
    });
  }

  /**
   * Thêm hoặc bỏ một nhà hàng khỏi danh sách yêu thích của người dùng (Toggle Favorite).
   * @param id - Mã nhà hàng
   */
  async toggleFavorite(id: string): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.RESTAURANT.TOGGLE_FAVORITE(id), {});
  }

  /**
   * Cập nhật thông tin cơ bản của nhà hàng (Tên quán, địa chỉ, số điện thoại, mô tả, ảnh đại diện).
   * @param data - Thông tin cơ bản cập nhật
   */
  async updateBasicInfo(data: IUpdateRestaurantBasicInfo): Promise<IApiResponse<any>> {
    return httpClient.put<IApiResponse<any>>(API_ENDPOINTS.RESTAURANT.UPDATE_BASIC_INFO, data);
  }

  /**
   * Cập nhật khung giờ mở cửa / đóng cửa hàng ngày của quán.
   * @param data - Danh sách giờ hoạt động theo các ngày trong tuần
   */
  async updateOperatingHours(data: IUpdateRestaurantOperatingHours): Promise<IApiResponse<any>> {
    return httpClient.put<IApiResponse<any>>(API_ENDPOINTS.RESTAURANT.UPDATE_OPERATING_HOURS, data);
  }

  /**
   * Cập nhật trạng thái đóng / mở cửa của nhà hàng (Đang mở, Tạm nghỉ, Đóng cửa).
   * @param data - Trạng thái hoạt động mới
   */
  async updateStatus(data: IUpdateRestaurantStatus): Promise<IApiResponse<any>> {
    return httpClient.put<IApiResponse<any>>(API_ENDPOINTS.RESTAURANT.UPDATE_STATUS, data);
  }

  /**
   * Cập nhật cấu hình giao hàng riêng của quán (bán kính giao tối đa, phương thức tự giao hay dùng shipper sàn).
   * @param data - Cấu hình giao hàng
   */
  async updateDeliveryConfig(data: IUpdateRestaurantDeliveryConfig): Promise<IApiResponse<any>> {
    return httpClient.put<IApiResponse<any>>(API_ENDPOINTS.RESTAURANT.UPDATE_DELIVERY_CONFIG, data);
  }
}

// Khởi tạo và xuất thể hiện duy nhất của RestaurantService
export const restaurantService = new RestaurantService();
export default restaurantService;
