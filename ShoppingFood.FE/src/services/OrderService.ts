import { httpClient } from './base/HttpClient';
import { API_ENDPOINTS } from '../config/endpoints';
import type { IApiResponse } from '../interfaces/IApiResponse';
import type {
  IOrderSummary,
  ISendCheckoutOtpRequest,
  ICheckoutRequest,
  IUpdateOrderRequest,
  ICancelOrderRequest,
  IReorderRequest,
  IAcceptOrderRequest,
  IRejectOrderRequest,
  IPrepareOrderRequest,
  IWaitingShipperOrderRequest,
  ISellerCancelOrderRequest
} from '../interfaces';

/**
 * Dịch vụ Quản lý Đơn hàng (OrderService).
 * Phụ trách toàn bộ vòng đời của đơn hàng: tạo đơn (Checkout), xác thực OTP, nhận/từ chối đơn (Seller), chuẩn bị món, giao hàng và đặt lại đơn (Reorder).
 */
class OrderService {
  /**
   * Lấy danh sách các đơn hàng đã đặt của người dùng đang đăng nhập (có phân trang).
   * @param params - Tham số phân trang (skip, take)
   */
  public async getMyOrders(params?: { skip?: number; take?: number }): Promise<IApiResponse<IOrderSummary[]>> {
    return httpClient.get<IApiResponse<IOrderSummary[]>>(API_ENDPOINTS.ORDER.MY_ORDERS, { params });
  }

  /**
   * Lấy danh sách đơn hàng đã đặt của khách vãng lai theo mã định danh guestUserId.
   * @param guestUserId - Mã định danh khách vãng lai
   * @param params - Tham số phân trang
   */
  public async getGuestOrders(guestUserId: string, params?: { skip?: number; take?: number }): Promise<IApiResponse<IOrderSummary[]>> {
    return httpClient.get<IApiResponse<IOrderSummary[]>>(`${API_ENDPOINTS.ORDER.BASE}/GuestOrders/${guestUserId}`, { params });
  }

  /**
   * Lấy danh sách các món ăn đã được người dùng đặt gần đây để tiện đặt lại nhanh.
   */
  public async getRecentItems(): Promise<IApiResponse<any[]>> {
    return httpClient.get<IApiResponse<any[]>>(API_ENDPOINTS.ORDER.RECENT_ITEMS);
  }

  /**
   * Lấy danh sách các đơn hàng thuộc về nhà hàng của Người bán (hỗ trợ lọc theo trạng thái, tìm kiếm, phân trang).
   * @param params - Bộ lọc đơn hàng nhà hàng
   */
  public async getRestaurantOrders(params?: { status?: string; skip?: number; take?: number; filter?: string }): Promise<IApiResponse<any[]>> {
    return httpClient.get<IApiResponse<any[]>>(API_ENDPOINTS.ORDER.RESTAURANT_ORDERS, { params });
  }

  /**
   * Lấy danh sách các đơn hàng bị tài xế hủy (Seller Shipper Cancels) để Người bán theo dõi và tìm tài xế mới.
   * @param params - Số ngày và phân trang
   */
  public async getSellerShipperCancels(params?: { days?: number; skip?: number; take?: number }): Promise<IApiResponse<any>> {
    return httpClient.get<IApiResponse<any>>(API_ENDPOINTS.ORDER.SELLER_SHIPPER_CANCELS, { params });
  }

  /**
   * Lấy thông tin chi tiết đầy đủ của một đơn hàng theo mã đơn (gồm món ăn, topping, địa chỉ, người giao, thanh toán).
   * @param id - Mã đơn hàng
   */
  public async getOrderDetails(id: string): Promise<IApiResponse<any>> {
    return httpClient.get<IApiResponse<any>>(API_ENDPOINTS.ORDER.DETAILS(id));
  }

  /**
   * Tạo đơn hàng mới từ giỏ hàng và tiến hành thanh toán (Checkout).
   * @param data - Thông tin thanh toán, địa chỉ nhận hàng, phương thức thanh toán, mã OTP
   */
  public async checkout(data: ICheckoutRequest): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.ORDER.CHECKOUT, data);
  }

  /**
   * Gửi mã OTP xác thực đơn hàng khi thanh toán (dành cho đơn thanh toán bảo mật).
   * @param data - Thông tin gửi OTP thanh toán
   */
  public async sendCheckoutOtp(data: ISendCheckoutOtpRequest): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.ORDER.CHECKOUT_SEND_OTP, data);
  }

  /**
   * Cập nhật thông tin đơn hàng khi đơn còn ở trạng thái Pending (địa chỉ, ghi chú).
   * @param data - Dữ liệu cập nhật đơn
   */
  public async updateOrder(data: IUpdateOrderRequest): Promise<IApiResponse<any>> {
    return httpClient.put<IApiResponse<any>>(API_ENDPOINTS.ORDER.UPDATE, data);
  }

  /**
   * Khách hàng hủy đơn hàng (khi đơn đang chờ xác nhận).
   * @param data - Mã đơn và lý do hủy
   */
  public async cancelOrder(data: ICancelOrderRequest): Promise<IApiResponse<any>> {
    return httpClient.put<IApiResponse<any>>(API_ENDPOINTS.ORDER.CANCEL, data);
  }

  /**
   * Đặt lại đơn hàng cũ (Reorder) — tự động thêm các món còn khả dụng vào giỏ hàng.
   * @param data - Mã đơn hàng cũ
   */
  public async reorder(data: IReorderRequest): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.ORDER.REORDER, data);
  }

  /**
   * Người bán chấp nhận tiếp nhận đơn hàng mới (Pending -> Confirmed).
   * @param data - Mã đơn hàng
   */
  public async acceptOrder(data: IAcceptOrderRequest): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.ORDER.ACCEPT, data);
  }

  /**
   * Người bán từ chối nhận đơn hàng mới.
   * @param data - Mã đơn và lý do từ chối
   */
  public async rejectOrder(data: IRejectOrderRequest): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.ORDER.REJECT, data);
  }

  /**
   * Người bán bắt đầu làm món (Confirmed -> Preparing).
   * @param data - Mã đơn hàng
   */
  public async prepareOrder(data: IPrepareOrderRequest): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.ORDER.PREPARE, data);
  }

  /**
   * Người bán đã làm xong món và chuyển trạng thái chờ tài xế đến lấy (Preparing -> WaitingForShipper).
   * @param data - Mã đơn hàng
   */
  public async waitingForShipper(data: IWaitingShipperOrderRequest): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.ORDER.WAITING_SHIPPER, data);
  }

  /**
   * Người bán chủ động hủy đơn hàng (do hết món, đóng cửa đột xuất).
   * @param data - Mã đơn và lý do hủy của quán
   */
  public async sellerCancelOrder(data: ISellerCancelOrderRequest): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(`${API_ENDPOINTS.ORDER.BASE}/seller-cancel`, data);
  }

  /**
   * Người bán xác nhận đã tự giao hàng thành công (áp dụng cho quán tự vận chuyển, không qua shipper nền tảng).
   * @param orderId - Mã đơn hàng
   */
  public async confirmSelfDelivery(orderId: string): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(`${API_ENDPOINTS.ORDER.BASE}/${orderId}/self-delivery/confirm-success`);
  }
}

// Khởi tạo và xuất thể hiện duy nhất của OrderService
export const orderService = new OrderService();
export default orderService;
