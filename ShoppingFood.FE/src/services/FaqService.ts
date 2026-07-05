import { httpClient } from './base/HttpClient';
import { API_ENDPOINTS } from '../config/endpoints';
import type { IApiResponse, IFaqDto, ICreateFaqRequest, IUpdateFaqRequest } from '../interfaces';

class FaqService {
  async getList(params?: { isActive?: boolean }): Promise<IApiResponse<IFaqDto[]>> {
    return httpClient.get<IApiResponse<IFaqDto[]>>(API_ENDPOINTS.FAQ.BASE, { params });
  }

  async getDetail(id: string): Promise<IApiResponse<IFaqDto>> {
    return httpClient.get<IApiResponse<IFaqDto>>(API_ENDPOINTS.FAQ.BY_ID(id));
  }

  async create(data: ICreateFaqRequest): Promise<IApiResponse<IFaqDto>> {
    return httpClient.post<IApiResponse<IFaqDto>>(API_ENDPOINTS.FAQ.BASE, data);
  }

  async update(id: string, data: IUpdateFaqRequest): Promise<IApiResponse<IFaqDto>> {
    return httpClient.put<IApiResponse<IFaqDto>>(API_ENDPOINTS.FAQ.BY_ID(id), data);
  }

  async delete(id: string): Promise<IApiResponse<any>> {
    return httpClient.delete<IApiResponse<any>>(API_ENDPOINTS.FAQ.BY_ID(id));
  }
}

export const faqService = new FaqService();
