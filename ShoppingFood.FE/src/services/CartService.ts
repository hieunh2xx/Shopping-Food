import { httpClient } from './base/HttpClient';
import { API_ENDPOINTS } from '../config/endpoints';
import type { IApiResponse, IAddToCartRequest, IUpdateCartItemQuantityRequest, IRemoveCartItemParams, IClearCartParams } from '../interfaces';

/**
 * Dịch vụ Quản lý Giỏ hàng (CartService) — Chuyên trách các thao tác với giỏ hàng.
 * Hỗ trợ cả người dùng đã đăng nhập (User ID từ Token) và khách vãng lai (Guest User ID).
 */
class CartService {
  /**
   * Thêm một món ăn vào giỏ hàng kèm theo kích cỡ (size) và danh sách topping đã chọn.
   * @param data - Thông tin món ăn, số lượng, size và topping
   */
  async addToCart(data: IAddToCartRequest): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.CART.BASE, data);
  }

  /**
   * Lấy dữ liệu giỏ hàng hiện tại của người dùng hoặc khách vãng lai.
   * @param guestUserId - Mã định danh khách vãng lai (nếu chưa đăng nhập)
   * @returns Chi tiết giỏ hàng và danh sách món
   */
  async getCart(guestUserId?: string): Promise<IApiResponse<any>> {
    return httpClient.get<IApiResponse<any>>(API_ENDPOINTS.CART.BASE, {
      params: guestUserId ? { guestUserId } : {},
    });
  }

  /**
   * Cập nhật số lượng của một món ăn cụ thể trong giỏ hàng.
   * @param data - Mã món trong giỏ và số lượng mới
   */
  async updateQuantity(data: IUpdateCartItemQuantityRequest): Promise<IApiResponse<any>> {
    return httpClient.put<IApiResponse<any>>(API_ENDPOINTS.CART.BASE, data);
  }

  /**
   * Xóa một món ăn khỏi giỏ hàng.
   * @param params - Mã mục giỏ hàng cần xóa
   */
  async removeCartItem(params: IRemoveCartItemParams): Promise<IApiResponse<any>> {
    return httpClient.delete<IApiResponse<any>>(API_ENDPOINTS.CART.BASE, {
      params,
    });
  }

  /**
   * Xóa sạch toàn bộ các món trong giỏ hàng.
   * @param params - Thông tin người dùng hoặc guestUserId cần dọn giỏ
   */
  async clearCart(params: IClearCartParams): Promise<IApiResponse<any>> {
    return httpClient.delete<IApiResponse<any>>(API_ENDPOINTS.CART.CLEAR, {
      params,
    });
  }
}

// Khởi tạo và xuất thể hiện duy nhất của CartService
export const cartService = new CartService();
export default cartService;
