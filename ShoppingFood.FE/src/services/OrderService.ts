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
}

export const orderService = new OrderService();
