import { httpClient } from './base/HttpClient';
import { API_ENDPOINTS } from '../config/endpoints';
import type { IApiResponse, IAddToCartRequest, IUpdateCartItemQuantityRequest, IRemoveCartItemParams, IClearCartParams } from '../interfaces';

class CartService {
  async addToCart(data: IAddToCartRequest): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.CART.BASE, data);
  }

  async getCart(guestUserId?: string): Promise<IApiResponse<any>> {
    return httpClient.get<IApiResponse<any>>(API_ENDPOINTS.CART.BASE, {
      params: guestUserId ? { guestUserId } : {},
    });
  }

  async updateQuantity(data: IUpdateCartItemQuantityRequest): Promise<IApiResponse<any>> {
    return httpClient.put<IApiResponse<any>>(API_ENDPOINTS.CART.BASE, data);
  }

  async removeCartItem(params: IRemoveCartItemParams): Promise<IApiResponse<any>> {
    return httpClient.delete<IApiResponse<any>>(API_ENDPOINTS.CART.BASE, {
      params,
    });
  }

  async clearCart(params: IClearCartParams): Promise<IApiResponse<any>> {
    return httpClient.delete<IApiResponse<any>>(API_ENDPOINTS.CART.CLEAR, {
      params,
    });
  }
}

export const cartService = new CartService();
export default cartService;
