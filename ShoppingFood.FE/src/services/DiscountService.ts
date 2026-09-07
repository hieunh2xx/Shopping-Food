import { httpClient } from './base/HttpClient';
import { BaseService } from './base/BaseService';
import { API_ENDPOINTS } from '../config/endpoints';
import type { IApiResponse, ICreateDiscountRequest, ISaveDiscountRequest, IDiscountDto, IGetDiscountsParams, IUpdateDiscountRequest, IApplyDiscountRequest, IApplyDiscountResponse } from '../interfaces';

/**
 * Dịch vụ Quản lý Mã giảm giá (DiscountService).
 * Cung cấp các thao tác CRUD mã khuyến mãi cho Người bán, lưu voucher vào ví khách hàng và áp dụng mã khi thanh toán đơn hàng.
 */
class DiscountService extends BaseService<IDiscountDto, ICreateDiscountRequest, any> {
  protected readonly endpoint = API_ENDPOINTS.DISCOUNT.BASE;

  /**
   * Lấy danh sách các mã giảm giá theo bộ lọc (theo nhà hàng, mã code, trạng thái kích hoạt).
   * @param params - Tham số lọc mã giảm giá
   */
  async getDiscounts(params?: IGetDiscountsParams): Promise<IApiResponse<IDiscountDto[]>> {
    return httpClient.get<IApiResponse<IDiscountDto[]>>(this.endpoint, { params });
  }

  /**
   * Tạo mới một mã giảm giá cho nhà hàng.
   * @param data - Thông tin mã giảm (loại giảm %, giảm cố định, đơn tối thiểu, hạn dùng,...)
   */
  async createDiscount(data: ICreateDiscountRequest): Promise<IApiResponse<IDiscountDto>> {
    return httpClient.post<IApiResponse<IDiscountDto>>(API_ENDPOINTS.DISCOUNT.CREATE, data);
  }

  /**
   * Lưu mã giảm giá vào ví voucher cá nhân của người dùng.
   * @param data - Mã code hoặc discountId cần lưu
   */
  async saveDiscount(data: ISaveDiscountRequest): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.DISCOUNT.SAVE, data);
  }

  /**
   * Lấy thông tin chi tiết một mã giảm giá theo ID.
   * @param id - Mã định danh giảm giá
   */
  async getDiscountById(id: string): Promise<IApiResponse<IDiscountDto>> {
    return httpClient.get<IApiResponse<IDiscountDto>>(API_ENDPOINTS.DISCOUNT.BY_ID(id));
  }
  
  /**
   * Cập nhật thông tin mã giảm giá hiện có.
   * @param id - Mã giảm giá
   * @param data - Dữ liệu cập nhật
   */
  async updateDiscount(id: string, data: IUpdateDiscountRequest): Promise<IApiResponse<IDiscountDto>> {
    return httpClient.post<IApiResponse<IDiscountDto>>(API_ENDPOINTS.DISCOUNT.BY_ID(id), data);
  }

  /**
   * Xóa một mã giảm giá khỏi hệ thống.
   * @param id - Mã giảm giá cần xóa
   */
  async deleteDiscount(id: string): Promise<IApiResponse<any>> {
    return httpClient.delete<IApiResponse<any>>(API_ENDPOINTS.DISCOUNT.BY_ID(id));
  }

  /**
   * Áp dụng mã giảm giá vào đơn hàng để kiểm tra tính hợp lệ và tính số tiền được chiết khấu.
   * @param data - Mã voucher, tổng tiền đơn và danh sách món
   */
  async applyDiscount(data: IApplyDiscountRequest): Promise<IApiResponse<IApplyDiscountResponse>> { 
    return httpClient.post<IApiResponse<IApplyDiscountResponse>>(API_ENDPOINTS.DISCOUNT.APPLY, data);
  }

  /**
   * Lấy số liệu thống kê hiệu quả sử dụng mã giảm giá (dành cho Người bán hàng).
   */
  async getDiscountStats(): Promise<IApiResponse<any>> {
    return httpClient.get<IApiResponse<any>>(API_ENDPOINTS.DISCOUNT.STATS);
  }

  /**
   * Khóa hoặc mở khóa mã giảm giá (tạm dừng áp dụng).
   * @param id - Mã giảm giá
   */
  async lockDiscount(id: string): Promise<IApiResponse<any>> {
    return httpClient.patch<IApiResponse<any>>(API_ENDPOINTS.DISCOUNT.LOCK(id));
  }
}

// Khởi tạo và xuất thể hiện duy nhất của DiscountService
export const discountService = new DiscountService();
