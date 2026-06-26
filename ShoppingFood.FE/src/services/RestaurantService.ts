import { httpClient } from './base/HttpClient';
import { API_ENDPOINTS } from '../config/endpoints';
import type { 
  IApiResponse, 
  IRestaurantProfileDto, 
  IUpdateRestaurantBasicInfo, 
  IUpdateRestaurantOperatingHours, 
  IUpdateRestaurantStatus, 
  IUpdateRestaurantDeliveryRadius, 
  IUpdateRestaurantShippingFee 
} from '../interfaces';

class RestaurantService {
  async getDetail(id: string): Promise<IApiResponse<IRestaurantProfileDto>> {
    return httpClient.get<IApiResponse<IRestaurantProfileDto>>(API_ENDPOINTS.RESTAURANT.BY_ID(id));
  }

  async getDashboardStats(params?: { startDate?: string; endDate?: string }): Promise<IApiResponse<any>> {
    return httpClient.get<IApiResponse<any>>(API_ENDPOINTS.RESTAURANT.DASHBOARD_STATS, { params });
  }

  async getFavorites(params?: { skip?: number; take?: number }): Promise<IApiResponse<IRestaurantProfileDto[]>> {
    return httpClient.get<IApiResponse<IRestaurantProfileDto[]>>(API_ENDPOINTS.RESTAURANT.FAVORITES, {
      params,
    });
  }

  async toggleFavorite(id: string): Promise<IApiResponse<any>> {
    // Note: backend ToggleFavorite has ToggleFavoriteRestaurantCommand command as parameter but id maps to RestaurantId in route
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.RESTAURANT.TOGGLE_FAVORITE(id), {});
  }

  async updateBasicInfo(data: IUpdateRestaurantBasicInfo): Promise<IApiResponse<any>> {
    return httpClient.put<IApiResponse<any>>(API_ENDPOINTS.RESTAURANT.UPDATE_BASIC_INFO, data);
  }

  async updateOperatingHours(data: IUpdateRestaurantOperatingHours): Promise<IApiResponse<any>> {
    return httpClient.put<IApiResponse<any>>(API_ENDPOINTS.RESTAURANT.UPDATE_OPERATING_HOURS, data);
  }

  async updateStatus(data: IUpdateRestaurantStatus): Promise<IApiResponse<any>> {
    return httpClient.put<IApiResponse<any>>(API_ENDPOINTS.RESTAURANT.UPDATE_STATUS, data);
  }

  async updateDeliveryRadius(data: IUpdateRestaurantDeliveryRadius): Promise<IApiResponse<any>> {
    return httpClient.put<IApiResponse<any>>(API_ENDPOINTS.RESTAURANT.UPDATE_DELIVERY_RADIUS, data);
  }

  async updateShippingFee(data: IUpdateRestaurantShippingFee): Promise<IApiResponse<any>> {
    return httpClient.put<IApiResponse<any>>(API_ENDPOINTS.RESTAURANT.UPDATE_SHIPPING_FEE, data);
  }
}

export const restaurantService = new RestaurantService();
export default restaurantService;
