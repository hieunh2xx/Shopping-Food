import { BaseService } from './base/BaseService';
import { httpClient } from './base/HttpClient';
import { API_ENDPOINTS } from '../config/endpoints';
import type { IApiResponse, IPointGiftConfigDto, ICreatePointGiftConfigRequest, IUpdatePointGiftConfigRequest } from '../interfaces';

/**
 * Dịch vụ Cấu hình Quà tặng Điểm thưởng (PointGiftConfigService).
 * Quản lý các gói quà tặng, mã voucher có thể quy đổi từ điểm tích lũy thành viên.
 */
class PointGiftConfigService extends BaseService<IPointGiftConfigDto, ICreatePointGiftConfigRequest, IUpdatePointGiftConfigRequest> {
  protected readonly endpoint = API_ENDPOINTS.ADMIN.POINT_GIFT_CONFIG;

  /**
   * Lấy danh sách cấu hình quà tặng đổi điểm (dành cho Admin quản lý).
   * @param isActiveOnly - Chỉ lấy các gói quà đang kích hoạt
   */
  async getConfigs(isActiveOnly?: boolean): Promise<IApiResponse<IPointGiftConfigDto[]>> {
    return httpClient.get<IApiResponse<IPointGiftConfigDto[]>>(this.endpoint, {
      params: { isActiveOnly }
    });
  }

  /**
   * Tạo mới một gói quà đổi điểm.
   * @param data - Thông tin gói quà (tên, mô tả, số điểm cần đổi, voucher liên kết)
   */
  async createConfig(data: ICreatePointGiftConfigRequest): Promise<IApiResponse<string>> {
    return httpClient.post<IApiResponse<string>>(this.endpoint, data);
  }

  /**
   * Cập nhật cấu hình gói quà đổi điểm theo ID.
   * @param id - Mã cấu hình quà
   * @param data - Dữ liệu cập nhật
   */
  async updateConfig(id: string, data: IUpdatePointGiftConfigRequest): Promise<IApiResponse<any>> {
    return httpClient.put<IApiResponse<any>>(API_ENDPOINTS.ADMIN.POINT_GIFT_CONFIG_BY_ID(id), data);
  }

  /**
   * Xóa một gói quà đổi điểm khỏi hệ thống.
   * @param id - Mã cấu hình quà cần xóa
   */
  async deleteConfig(id: string): Promise<IApiResponse<any>> {
    return httpClient.delete<IApiResponse<any>>(API_ENDPOINTS.ADMIN.POINT_GIFT_CONFIG_BY_ID(id));
  }

  /**
   * Lấy danh sách quà tặng đang hoạt động cho Khách hàng xem và đổi điểm (Public API).
   */
  async getActiveGiftsForCustomer(): Promise<IApiResponse<IPointGiftConfigDto[]>> {
    return httpClient.get<IApiResponse<IPointGiftConfigDto[]>>(API_ENDPOINTS.LOYALTY_POINT.GIFTS);
  }
}

// Khởi tạo và xuất thể hiện duy nhất của PointGiftConfigService
export const pointGiftConfigService = new PointGiftConfigService();
