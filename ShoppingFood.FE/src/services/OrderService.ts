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

class OrderService {
  /**
   * Get orders for the current logged in user
   */
  public async getMyOrders(params?: { skip?: number; take?: number }): Promise<IApiResponse<IOrderSummary[]>> {
    return httpClient.get<IApiResponse<IOrderSummary[]>>(API_ENDPOINTS.ORDER.MY_ORDERS, { params });
  }

  /**
   * Get orders for a guest user
   */
  public async getGuestOrders(guestUserId: string, params?: { skip?: number; take?: number }): Promise<IApiResponse<IOrderSummary[]>> {
    return httpClient.get<IApiResponse<IOrderSummary[]>>(`${API_ENDPOINTS.ORDER.BASE}/GuestOrders/${guestUserId}`, { params });
  }

  /**
   * Get recently ordered items for the current user
   */
  public async getRecentItems(): Promise<IApiResponse<any[]>> {
    return httpClient.get<IApiResponse<any[]>>(API_ENDPOINTS.ORDER.RECENT_ITEMS);
  }

  /**
   * Get orders for the restaurant owned by the current seller
   */
  public async getRestaurantOrders(params?: { status?: string; skip?: number; take?: number; filter?: string }): Promise<IApiResponse<any[]>> {
    return httpClient.get<IApiResponse<any[]>>(API_ENDPOINTS.ORDER.RESTAURANT_ORDERS, { params });
  }

  public async getSellerShipperCancels(params?: { days?: number; skip?: number; take?: number }): Promise<IApiResponse<any>> {
    return httpClient.get<IApiResponse<any>>(API_ENDPOINTS.ORDER.SELLER_SHIPPER_CANCELS, { params });
  }

  public async getOrderDetails(id: string): Promise<IApiResponse<any>> {
    return httpClient.get<IApiResponse<any>>(API_ENDPOINTS.ORDER.DETAILS(id));
  }

  public async checkout(data: ICheckoutRequest): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.ORDER.CHECKOUT, data);
  }

  public async sendCheckoutOtp(data: ISendCheckoutOtpRequest): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.ORDER.CHECKOUT_SEND_OTP, data);
  }

  public async updateOrder(data: IUpdateOrderRequest): Promise<IApiResponse<any>> {
    return httpClient.put<IApiResponse<any>>(API_ENDPOINTS.ORDER.UPDATE, data);
  }

  public async cancelOrder(data: ICancelOrderRequest): Promise<IApiResponse<any>> {
    return httpClient.put<IApiResponse<any>>(API_ENDPOINTS.ORDER.CANCEL, data);
  }

  public async reorder(data: IReorderRequest): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.ORDER.REORDER, data);
  }

  public async acceptOrder(data: IAcceptOrderRequest): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.ORDER.ACCEPT, data);
  }

  public async rejectOrder(data: IRejectOrderRequest): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.ORDER.REJECT, data);
  }

  public async prepareOrder(data: IPrepareOrderRequest): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.ORDER.PREPARE, data);
  }

  public async waitingForShipper(data: IWaitingShipperOrderRequest): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.ORDER.WAITING_SHIPPER, data);
  }

  public async sellerCancelOrder(data: ISellerCancelOrderRequest): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(`${API_ENDPOINTS.ORDER.BASE}/seller-cancel`, data);
  }

  public async confirmSelfDelivery(orderId: string): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(`${API_ENDPOINTS.ORDER.BASE}/${orderId}/self-delivery/confirm-success`);
  }
}

export const orderService = new OrderService();
export default orderService;
