import { httpClient } from './base/HttpClient';
import { API_ENDPOINTS } from '../config/endpoints';
import type {
  IApiResponse,
  ISubmitAppealRequest,
  ISubmitOrderComplaintRequest,
  ISubmitShipperComplaintRequest,
} from '../interfaces';

export class SupportService {
  public async submitAppeal(data: ISubmitAppealRequest): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.SUPPORT.APPEAL, data);
  }

  public async submitOrderComplaint(data: ISubmitOrderComplaintRequest): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.SUPPORT.ORDER_COMPLAINT, data);
  }

  public async submitShipperComplaint(data: ISubmitShipperComplaintRequest): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.SUPPORT.SHIPPER_COMPLAINT, data);
  }

  public async getLegalSettings(): Promise<IApiResponse<any>> {
    return httpClient.get<IApiResponse<any>>(API_ENDPOINTS.SYSTEM.LEGAL);
  }

  public async getGlobalMenuCategories(): Promise<IApiResponse<any[]>> {
    return httpClient.get(API_ENDPOINTS.SYSTEM.GLOBAL_MENU_CATEGORY);
  }

  public async getDeliverySettings(): Promise<IApiResponse<{
    maxDeliveryRadiusKm?: number | null;
    freeDeliveryRadiusKm?: number;
    freeShippingMinimumOrder?: number;
    shippingFee?: number;
  }>> {
    return httpClient.get(API_ENDPOINTS.SYSTEM.DELIVERY_SETTINGS);
  }

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

export const supportService = new SupportService();
