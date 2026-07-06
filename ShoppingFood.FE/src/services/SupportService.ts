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
    return httpClient.get<IApiResponse<any>>('/system/legal');
  }
}

export const supportService = new SupportService();
