import { BaseService } from './base/BaseService';
import { httpClient } from './base/HttpClient';
import { API_ENDPOINTS } from '../config/endpoints';
import type { IApiResponse, ILoyaltyPointDto } from '../interfaces';

class LoyaltyPointService extends BaseService<ILoyaltyPointDto> {
    protected readonly endpoint = API_ENDPOINTS.LOYALTY_POINT.BASE;

    async getLoyaltyPoints(): Promise<IApiResponse<ILoyaltyPointDto>> {
        return httpClient.get<IApiResponse<ILoyaltyPointDto>>(this.endpoint);
    }
}

export const loyaltyPointService = new LoyaltyPointService();
