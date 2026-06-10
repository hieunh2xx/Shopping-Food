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
  IWaitingDriverOrderRequest,
  ISellerCancelOrderRequest
} from '../interfaces';

class OrderService {
  /**
   * Get orders for the current logged in user
   */
  public async getMyOrders(): Promise<IApiResponse<IOrderSummary[]>> {
    return httpClient.get<IApiResponse<IOrderSummary[]>>(API_ENDPOINTS.ORDER.MY_ORDERS);
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

  public async waitingForDriver(data: IWaitingDriverOrderRequest): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.ORDER.WAITING_DRIVER, data);
  }

  public async sellerCancelOrder(data: ISellerCancelOrderRequest): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.ORDER.SELLER_CANCEL, data);
  }
}

export const orderService = new OrderService();
export default orderService;
