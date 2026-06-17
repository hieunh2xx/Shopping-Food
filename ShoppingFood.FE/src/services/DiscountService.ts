import { httpClient } from './base/HttpClient';
import { BaseService } from './base/BaseService';
import { API_ENDPOINTS } from '../config/endpoints';
import type { IApiResponse, ICreateDiscountRequest, ISaveDiscountRequest, IDiscountDto } from '../interfaces';

class DiscountService extends BaseService<any, any, any> {
  protected readonly endpoint = API_ENDPOINTS.DISCOUNT.BASE;

  async createDiscount(data: ICreateDiscountRequest): Promise<IApiResponse<IDiscountDto>> {
    return httpClient.post<IApiResponse<IDiscountDto>>(API_ENDPOINTS.DISCOUNT.CREATE, data);
  }

  async saveDiscount(data: ISaveDiscountRequest): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.DISCOUNT.SAVE, data);
  }
}

export const discountService = new DiscountService();
