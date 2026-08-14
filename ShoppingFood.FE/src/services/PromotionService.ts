import { httpClient } from './base/HttpClient';
import { BaseService } from './base/BaseService';
import { API_ENDPOINTS } from '../config/endpoints';
import type { IApiResponse, IBuyXGetYPromotionDto, ICreatePromotionRequest, IUpdatePromotionRequest, IGetPromotionsParams } from '../interfaces';

class PromotionService extends BaseService<IBuyXGetYPromotionDto, ICreatePromotionRequest, any> {
  protected readonly endpoint = API_ENDPOINTS.PROMOTION.BASE;

  async getPromotions(params?: IGetPromotionsParams): Promise<IApiResponse<IBuyXGetYPromotionDto[]>> {
    return httpClient.get<IApiResponse<IBuyXGetYPromotionDto[]>>(this.endpoint, { params });
  }

  async createPromotion(data: ICreatePromotionRequest): Promise<IApiResponse<IBuyXGetYPromotionDto>> {
    return httpClient.post<IApiResponse<IBuyXGetYPromotionDto>>(API_ENDPOINTS.PROMOTION.CREATE, data);
  }

  async updatePromotion(id: string, data: IUpdatePromotionRequest): Promise<IApiResponse<IBuyXGetYPromotionDto>> {
    return httpClient.post<IApiResponse<IBuyXGetYPromotionDto>>(API_ENDPOINTS.PROMOTION.UPDATE(id), data);
  }

  async deletePromotion(id: string): Promise<IApiResponse<any>> {
    return httpClient.delete<IApiResponse<any>>(API_ENDPOINTS.PROMOTION.DELETE(id));
  }
}

export const promotionService = new PromotionService();
