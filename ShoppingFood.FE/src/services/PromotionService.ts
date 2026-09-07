import { httpClient } from './base/HttpClient';
import { BaseService } from './base/BaseService';
import { API_ENDPOINTS } from '../config/endpoints';
import type { IApiResponse, IBuyXGetYPromotionDto, ICreatePromotionRequest, IUpdatePromotionRequest, IGetPromotionsParams } from '../interfaces';

/**
 * Dịch vụ Quản lý Chương trình Khuyến mãi "Mua X Tặng Y" (PromotionService).
 * Kế thừa từ BaseService<IBuyXGetYPromotionDto> để quản lý các chương trình ưu đãi mua món chính tặng món kèm theo cho quán ăn.
 */
class PromotionService extends BaseService<IBuyXGetYPromotionDto, ICreatePromotionRequest, any> {
  protected readonly endpoint = API_ENDPOINTS.PROMOTION.BASE;

  /**
   * Lấy danh sách các chương trình khuyến mãi Mua X Tặng Y (có lọc theo nhà hàng, trạng thái).
   * @param params - Bộ lọc chương trình khuyến mãi
   */
  async getPromotions(params?: IGetPromotionsParams): Promise<IApiResponse<IBuyXGetYPromotionDto[]>> {
    return httpClient.get<IApiResponse<IBuyXGetYPromotionDto[]>>(this.endpoint, { params });
  }

  /**
   * Tạo mới một chương trình khuyến mãi Mua X Tặng Y (chọn món mua, số lượng yêu cầu, món tặng, số lượng tặng, thời gian áp dụng).
   * @param data - Dữ liệu chương trình khuyến mãi
   */
  async createPromotion(data: ICreatePromotionRequest): Promise<IApiResponse<IBuyXGetYPromotionDto>> {
    return httpClient.post<IApiResponse<IBuyXGetYPromotionDto>>(API_ENDPOINTS.PROMOTION.CREATE, data);
  }

  /**
   * Cập nhật thông tin chương trình khuyến mãi theo ID.
   * @param id - Mã chương trình khuyến mãi
   * @param data - Dữ liệu cập nhật
   */
  async updatePromotion(id: string, data: IUpdatePromotionRequest): Promise<IApiResponse<IBuyXGetYPromotionDto>> {
    return httpClient.post<IApiResponse<IBuyXGetYPromotionDto>>(API_ENDPOINTS.PROMOTION.UPDATE(id), data);
  }

  /**
   * Xóa một chương trình khuyến mãi Mua X Tặng Y theo ID.
   * @param id - Mã chương trình cần xóa
   */
  async deletePromotion(id: string): Promise<IApiResponse<any>> {
    return httpClient.delete<IApiResponse<any>>(API_ENDPOINTS.PROMOTION.DELETE(id));
  }
}

// Khởi tạo và xuất thể hiện duy nhất của PromotionService
export const promotionService = new PromotionService();
