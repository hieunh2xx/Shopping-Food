import { BaseService } from './base/BaseService';
import { httpClient } from './base/HttpClient';
import { API_ENDPOINTS } from '../config/endpoints';
import type { IApiResponse, ILoyaltyPointDto, IRedeemPointGiftRequest } from '../interfaces';

class LoyaltyPointService extends BaseService<ILoyaltyPointDto> {
    protected readonly endpoint = API_ENDPOINTS.LOYALTY_POINT.BASE;

    async getLoyaltyPoints(): Promise<IApiResponse<ILoyaltyPointDto>> {
        return httpClient.get<IApiResponse<ILoyaltyPointDto>>(this.endpoint);
    }

    async redeemGift(data: IRedeemPointGiftRequest): Promise<IApiResponse<string>> {
        return httpClient.post<IApiResponse<string>>(API_ENDPOINTS.LOYALTY_POINT.REDEEM, data);
    }
}

export const loyaltyPointService = new LoyaltyPointService();
