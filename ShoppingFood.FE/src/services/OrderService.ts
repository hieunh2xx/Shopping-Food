import { httpClient } from './base/HttpClient';
import { API_ENDPOINTS } from '../config/endpoints';
import type { IApiResponse } from '../interfaces/IApiResponse';

export interface IOrderSummary {
  id: string;
  totalAmount: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
}

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

  public async checkout(data: any): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.ORDER.CHECKOUT, data);
  }

  public async sendCheckoutOtp(data: { contactEmail: string }): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.ORDER.CHECKOUT_SEND_OTP, data);
  }

  public async updateOrder(data: { id: string; deliveryAddress?: string; contactName?: string; contactPhone?: string; note?: string }): Promise<IApiResponse<any>> {
    return httpClient.put<IApiResponse<any>>(API_ENDPOINTS.ORDER.UPDATE, data);
  }

  public async cancelOrder(data: { orderId: string; cancellationReason?: string }): Promise<IApiResponse<any>> {
    return httpClient.put<IApiResponse<any>>(API_ENDPOINTS.ORDER.CANCEL, data);
  }

  public async reorder(data: { orderId: string }): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.ORDER.REORDER, data);
  }

  public async acceptOrder(data: { orderId: string }): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.ORDER.ACCEPT, data);
  }

  public async rejectOrder(data: { orderId: string; rejectionReason: string }): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.ORDER.REJECT, data);
  }

  public async prepareOrder(data: { orderId: string }): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.ORDER.PREPARE, data);
  }

  public async waitingForDriver(data: { orderId: string }): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.ORDER.WAITING_DRIVER, data);
  }

  public async sellerCancelOrder(data: { orderId: string; cancellationReason: string }): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.ORDER.SELLER_CANCEL, data);
  }
}

export const orderService = new OrderService();
