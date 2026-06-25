import { BaseService } from './base/BaseService';
import { httpClient } from './base/HttpClient';
import { API_ENDPOINTS } from '../config/endpoints';
import type { IApiResponse, ILoyaltyPointDto, IRedeemPointGiftRequest, IMemberTierConfig } from '../interfaces';

class LoyaltyPointService extends BaseService<ILoyaltyPointDto> {
    protected readonly endpoint = API_ENDPOINTS.LOYALTY_POINT.BASE;

    async getLoyaltyPoints(): Promise<IApiResponse<ILoyaltyPointDto>> {
        return httpClient.get<IApiResponse<ILoyaltyPointDto>>(this.endpoint);
    }

    async redeemGift(data: IRedeemPointGiftRequest): Promise<IApiResponse<string>> {
        return httpClient.post<IApiResponse<string>>(API_ENDPOINTS.LOYALTY_POINT.REDEEM, data);
    }

    async evaluateTiers(): Promise<IApiResponse<number>> {
        return httpClient.post<IApiResponse<number>>(API_ENDPOINTS.LOYALTY_POINT.EVALUATE_TIERS);
    }

    async getTierConfigs(): Promise<IApiResponse<IMemberTierConfig[]>> {
        return httpClient.get<IApiResponse<IMemberTierConfig[]>>(API_ENDPOINTS.LOYALTY_POINT.TIER_CONFIGS);
    }

    async updateTierConfig(tier: string, minPoints: number): Promise<IApiResponse<IMemberTierConfig>> {
        return httpClient.put<IApiResponse<IMemberTierConfig>>(
            API_ENDPOINTS.LOYALTY_POINT.TIER_CONFIGS,
            null,
            { params: { tier, minPoints } }
        );
    }

    async adjustUserTier(userId: string, newTier: string): Promise<IApiResponse<any>> {
        return httpClient.put<IApiResponse<any>>(
            API_ENDPOINTS.LOYALTY_POINT.ADJUST_USER_TIER,
            null,
            { params: { userId, newTier } }
        );
    }
}

export const loyaltyPointService = new LoyaltyPointService();
