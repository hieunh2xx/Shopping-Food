import { httpClient } from './base/HttpClient';
import { API_ENDPOINTS } from '../config/endpoints';
import type { 
  IApiResponse, 
  IFlashSale, 
  IFlashSaleProduct, 
  ICreateFlashSaleRequest, 
  IUpdateFlashSaleRequest, 
  IRegisterFlashSaleRequest, 
  IReviewFlashSaleProductRequest 
} from '../interfaces';

/**
 * Dịch vụ Quản lý Chương trình Flash Sale (FlashSaleService).
 * Bao gồm: Quản lý các khung giờ Flash Sale (Admin), Đăng ký món tham gia Flash Sale (Seller), Phê duyệt món Flash Sale và hiển thị Flash Sale cho Khách hàng.
 */
class FlashSaleService {
  /**
   * Lấy danh sách các khung giờ Flash Sale hiện đang diễn ra hoặc sắp tới trong ngày.
   */
  public async getActiveFlashSales(): Promise<IApiResponse<IFlashSale[]>> {
    return httpClient.get<IApiResponse<IFlashSale[]>>(API_ENDPOINTS.FLASH_SALE.ACTIVE);
  }

  /**
   * Lấy toàn bộ danh sách các chiến dịch Flash Sale (dành cho Admin).
   */
  public async getAllFlashSales(): Promise<IApiResponse<IFlashSale[]>> {
    return httpClient.get<IApiResponse<IFlashSale[]>>(API_ENDPOINTS.FLASH_SALE.ALL);
  }

  /**
   * Tạo mới một khung giờ / sự kiện Flash Sale (dành cho Admin).
   * @param data - Thông tin tên chương trình, thời gian bắt đầu, kết thúc
   */
  public async createFlashSale(data: ICreateFlashSaleRequest): Promise<IApiResponse<IFlashSale>> {
    return httpClient.post<IApiResponse<IFlashSale>>(API_ENDPOINTS.FLASH_SALE.CREATE, data);
  }

  /**
   * Cập nhật thông tin khung giờ Flash Sale theo ID.
   * @param id - Mã Flash Sale
   * @param data - Dữ liệu cập nhật
   */
  public async updateFlashSale(id: string, data: IUpdateFlashSaleRequest): Promise<IApiResponse<IFlashSale>> {
    return httpClient.post<IApiResponse<IFlashSale>>(API_ENDPOINTS.FLASH_SALE.UPDATE(id), data);
  }

  /**
   * Xóa một sự kiện Flash Sale theo ID.
   * @param id - Mã Flash Sale cần xóa
   */
  public async deleteFlashSale(id: string): Promise<IApiResponse<any>> {
    return httpClient.delete<IApiResponse<any>>(API_ENDPOINTS.FLASH_SALE.DELETE(id));
  }

  /**
   * Đăng ký món ăn của nhà hàng tham gia vào khung giờ Flash Sale (dành cho Seller).
   * @param data - Mã Flash Sale, mã sản phẩm, giá flash sale và số lượng bán
   */
  public async registerFlashSale(data: IRegisterFlashSaleRequest): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.FLASH_SALE.REGISTER, data);
  }

  /**
   * Phê duyệt hoặc từ chối sản phẩm đăng ký tham gia Flash Sale của nhà hàng (dành cho Admin).
   * @param data - Quyết định duyệt và lý do nếu từ chối
   */
  public async reviewFlashSaleProduct(data: IReviewFlashSaleProductRequest): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.FLASH_SALE.REVIEW_PRODUCT, data);
  }

  /**
   * Lấy danh sách các sản phẩm thuộc một khung giờ Flash Sale cụ thể (có phân trang và lọc theo nhà hàng).
   * @param flashSaleId - Mã Flash Sale
   * @param skip - Vị trí bắt đầu
   * @param take - Số lượng lấy
   * @param restaurantId - Lọc theo nhà hàng
   */
  public async getFlashSaleProducts(flashSaleId: string, skip = 0, take = 50, restaurantId?: string): Promise<IApiResponse<{ total: number; data: IFlashSaleProduct[] }>> {
    return httpClient.get<IApiResponse<{ total: number; data: IFlashSaleProduct[] }>>(API_ENDPOINTS.FLASH_SALE.PRODUCTS(flashSaleId), {
      params: { skip, take, restaurantId }
    });
  }
}

// Khởi tạo và xuất thể hiện duy nhất của FlashSaleService
export const flashSaleService = new FlashSaleService();
