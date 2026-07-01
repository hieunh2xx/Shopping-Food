import { httpClient } from './base/HttpClient';
import { BaseService } from './base/BaseService';
import { API_ENDPOINTS } from '../config/endpoints';
import type { IApiResponse, ICreateDiscountRequest, ISaveDiscountRequest, IDiscountDto, IGetDiscountsParams, IUpdateDiscountRequest, IApplyDiscountRequest, IApplyDiscountResponse } from '../interfaces';

class DiscountService extends BaseService<IDiscountDto, ICreateDiscountRequest, any> {
  protected readonly endpoint = API_ENDPOINTS.DISCOUNT.BASE;

  async getDiscounts(params?: IGetDiscountsParams): Promise<IApiResponse<IDiscountDto[]>> {
    return httpClient.get<IApiResponse<IDiscountDto[]>>(this.endpoint, { params });
  }

  async createDiscount(data: ICreateDiscountRequest): Promise<IApiResponse<IDiscountDto>> {
    return httpClient.post<IApiResponse<IDiscountDto>>(API_ENDPOINTS.DISCOUNT.CREATE, data);
  }

  async saveDiscount(data: ISaveDiscountRequest): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.DISCOUNT.SAVE, data);
  }

  async getDiscountById(id: string): Promise<IApiResponse<IDiscountDto>> {
    return httpClient.get<IApiResponse<IDiscountDto>>(API_ENDPOINTS.DISCOUNT.BY_ID(id));
  }
  
  async updateDiscount(id: string, data: IUpdateDiscountRequest): Promise<IApiResponse<IDiscountDto>> {
    return httpClient.post<IApiResponse<IDiscountDto>>(API_ENDPOINTS.DISCOUNT.BY_ID(id), data);
  }

  async deleteDiscount(id: string): Promise<IApiResponse<any>> {
    return httpClient.delete<IApiResponse<any>>(API_ENDPOINTS.DISCOUNT.BY_ID(id));
  }

  async applyDiscount(data: IApplyDiscountRequest): Promise<IApiResponse<IApplyDiscountResponse>> { 
    return httpClient.post<IApiResponse<IApplyDiscountResponse>>(API_ENDPOINTS.DISCOUNT.APPLY, data);
  }

  async getDiscountStats(): Promise<IApiResponse<any>> {
    return httpClient.get<IApiResponse<any>>(API_ENDPOINTS.DISCOUNT.STATS);
  }

  async lockDiscount(id: string): Promise<IApiResponse<any>> {
    return httpClient.patch<IApiResponse<any>>(API_ENDPOINTS.DISCOUNT.LOCK(id));
  }
}

export const discountService = new DiscountService();
