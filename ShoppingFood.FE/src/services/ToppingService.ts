import { httpClient } from './base/HttpClient';
import { API_ENDPOINTS } from '../config/endpoints';
import type { IApiResponse, IToppingDto, ICreateToppingRequest, IUpdateToppingRequest } from '../interfaces';

class ToppingService {
  async getByRestaurantId(restaurantId: string): Promise<IApiResponse<IToppingDto[]>> {
    return httpClient.get<IApiResponse<IToppingDto[]>>(API_ENDPOINTS.TOPPING.BY_RESTAURANT(restaurantId));
  }

  async create(data: ICreateToppingRequest): Promise<IApiResponse<IToppingDto>> {
    return httpClient.post<IApiResponse<IToppingDto>>(API_ENDPOINTS.TOPPING.BASE, data);
  }

  async update(id: string, data: IUpdateToppingRequest): Promise<IApiResponse<IToppingDto>> {
    return httpClient.put<IApiResponse<IToppingDto>>(API_ENDPOINTS.TOPPING.BY_ID(id), data);
  }

  async delete(id: string): Promise<IApiResponse<any>> {
    return httpClient.delete<IApiResponse<any>>(API_ENDPOINTS.TOPPING.BY_ID(id));
  }
}

export const toppingService = new ToppingService();
export default toppingService;
