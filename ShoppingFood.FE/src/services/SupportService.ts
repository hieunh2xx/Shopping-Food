import { httpClient } from './base/HttpClient';
import { API_ENDPOINTS } from '../config/endpoints';
import type {
  IApiResponse,
  ISubmitAppealRequest,
  ISubmitOrderComplaintRequest,
  ISubmitShipperComplaintRequest,
} from '../interfaces';

/**
 * Dịch vụ Hỗ trợ khách hàng & Cài đặt hệ thống (SupportService).
 * Phụ trách việc gửi đơn kháng cáo (Appeal), khiếu nại đơn hàng, khiếu nại tài xế, lấy văn bản pháp lý và các số liệu thống kê nền tảng.
 */
export class SupportService {
  /**
   * Người bán gửi đơn kháng cáo quyết định kỷ luật hoặc tạm khóa quán từ Admin.
   * @param data - Nội dung và tài liệu kháng cáo
   */
  public async submitAppeal(data: ISubmitAppealRequest): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.SUPPORT.APPEAL, data);
  }

  /**
   * Khách hàng gửi khiếu nại về chất lượng đơn hàng (sai món, thiếu món, đồ ăn hỏng).
   * @param data - Mã đơn, lý do khiếu nại và hình ảnh bằng chứng
   */
  public async submitOrderComplaint(data: ISubmitOrderComplaintRequest): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.SUPPORT.ORDER_COMPLAINT, data);
  }

  /**
   * Khách hàng gửi khiếu nại về thái độ hoặc hành vi của tài xế giao hàng.
   * @param data - Mã đơn, lý do và mô tả khiếu nại tài xế
   */
  public async submitShipperComplaint(data: ISubmitShipperComplaintRequest): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.SUPPORT.SHIPPER_COMPLAINT, data);
  }

  /**
   * Lấy nội dung các văn bản chính sách pháp lý công khai của sàn.
   */
  public async getLegalSettings(): Promise<IApiResponse<any>> {
    return httpClient.get<IApiResponse<any>>(API_ENDPOINTS.SYSTEM.LEGAL);
  }

  /**
   * Lấy danh mục thực đơn chung toàn hệ thống (Public API).
   */
  public async getGlobalMenuCategories(): Promise<IApiResponse<any[]>> {
    return httpClient.get(API_ENDPOINTS.SYSTEM.GLOBAL_MENU_CATEGORY);
  }

  /**
   * Lấy các cấu hình cài đặt giao hàng của hệ thống (phí ship, khoảng cách freeship, hệ số giờ cao điểm).
   */
  public async getDeliverySettings(): Promise<IApiResponse<{
    maxDeliveryRadiusKm?: number | null;
    freeDeliveryRadiusKm?: number;
    freeShippingMinimumOrder?: number;
    shippingFee?: number;
    feePerKm?: number;
    shipperBaseFee?: number;
    shipperFeePerKm?: number;
    rushHourMultiplier?: number;
    rushHourStartTime?: string;
    rushHourEndTime?: string;
    includedKmInBaseFee?: number;
  }>> {
    return httpClient.get(API_ENDPOINTS.SYSTEM.DELIVERY_SETTINGS);
  }

  /**
   * Lấy số liệu thống kê công khai của nền tảng (số nhà hàng, khách hàng, món ăn, đơn hàng hoàn thành).
   */
  public async getPlatformStats(): Promise<IApiResponse<{
    restaurantCount: number;
    customerCount: number;
    productCount: number;
    orderCount: number;
    averageRating: number;
    reviewCount: number;
    shippingFee: number;
    freeShippingMinimumOrder: number;
    freeDeliveryRadiusKm: number;
    maxDeliveryRadiusKm?: number | null;
  }>> {
    return httpClient.get(API_ENDPOINTS.SYSTEM.PLATFORM_STATS);
  }
}

// Khởi tạo và xuất thể hiện duy nhất của SupportService
export const supportService = new SupportService();
