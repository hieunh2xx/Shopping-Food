import { BaseService } from './base/BaseService';
import { httpClient } from './base/HttpClient';
import { API_ENDPOINTS } from '../config/endpoints';
import type { IApiResponse, IPointGiftConfigDto, ICreatePointGiftConfigRequest, IUpdatePointGiftConfigRequest } from '../interfaces';

class PointGiftConfigService extends BaseService<IPointGiftConfigDto, ICreatePointGiftConfigRequest, IUpdatePointGiftConfigRequest> {
  protected readonly endpoint = API_ENDPOINTS.ADMIN.POINT_GIFT_CONFIG;

  async getConfigs(isActiveOnly?: boolean): Promise<IApiResponse<IPointGiftConfigDto[]>> {
    return httpClient.get<IApiResponse<IPointGiftConfigDto[]>>(this.endpoint, {
      params: { isActiveOnly }
    });
  }

  async createConfig(data: ICreatePointGiftConfigRequest): Promise<IApiResponse<string>> {
    return httpClient.post<IApiResponse<string>>(this.endpoint, data);
  }

  async updateConfig(id: string, data: IUpdatePointGiftConfigRequest): Promise<IApiResponse<any>> {
    return httpClient.put<IApiResponse<any>>(API_ENDPOINTS.ADMIN.POINT_GIFT_CONFIG_BY_ID(id), data);
  }

  async deleteConfig(id: string): Promise<IApiResponse<any>> {
    return httpClient.delete<IApiResponse<any>>(API_ENDPOINTS.ADMIN.POINT_GIFT_CONFIG_BY_ID(id));
  }

  // API công khai dành cho Customer & Guest xem quà tặng đổi điểm
  async getActiveGiftsForCustomer(): Promise<IApiResponse<IPointGiftConfigDto[]>> {
    return httpClient.get<IApiResponse<IPointGiftConfigDto[]>>(API_ENDPOINTS.LOYALTY_POINT.GIFTS);
  }
}

export const pointGiftConfigService = new PointGiftConfigService();
