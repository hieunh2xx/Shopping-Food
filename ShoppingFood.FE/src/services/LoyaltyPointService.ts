import { BaseService } from './base/BaseService';
import { httpClient } from './base/HttpClient';
import { API_ENDPOINTS } from '../config/endpoints';
import type { IApiResponse, ILoyaltyPointDto, IRedeemPointGiftRequest, IMemberTierConfig } from '../interfaces';

/**
 * Dịch vụ Điểm tích lũy & Hạng thành viên (LoyaltyPointService).
 * Quản lý điểm thưởng loyalty, đổi quà bằng điểm, tính toán thăng hạng và cấu hình hạn mức điểm theo từng hạng thành viên.
 */
class LoyaltyPointService extends BaseService<ILoyaltyPointDto> {
    protected readonly endpoint = API_ENDPOINTS.LOYALTY_POINT.BASE;

    /**
     * Lấy thông tin số điểm tích lũy hiện tại và lịch sử tích/tiêu điểm của người dùng.
     */
    async getLoyaltyPoints(): Promise<IApiResponse<ILoyaltyPointDto>> {
        return httpClient.get<IApiResponse<ILoyaltyPointDto>>(this.endpoint);
    }

    /**
     * Đổi điểm tích lũy lấy quà thưởng hoặc mã giảm giá voucher.
     * @param data - Mã cấu hình quà thưởng cần đổi
     * @returns Thông điệp hoặc mã voucher được cấp
     */
    async redeemGift(data: IRedeemPointGiftRequest): Promise<IApiResponse<string>> {
        return httpClient.post<IApiResponse<string>>(API_ENDPOINTS.LOYALTY_POINT.REDEEM, data);
    }

    /**
     * Kích hoạt quét và đánh giá lại hạng thành viên cho toàn bộ người dùng trong hệ thống (dành cho Admin).
     * @returns Số lượng người dùng được thăng hạng
     */
    async evaluateTiers(): Promise<IApiResponse<number>> {
        return httpClient.post<IApiResponse<number>>(API_ENDPOINTS.LOYALTY_POINT.EVALUATE_TIERS);
    }

    /**
     * Lấy danh sách cấu hình hạn mức điểm tối thiểu của các hạng thành viên (Đồng, Bạc, Vàng, Kim Cương).
     */
    async getTierConfigs(): Promise<IApiResponse<IMemberTierConfig[]>> {
        return httpClient.get<IApiResponse<IMemberTierConfig[]>>(API_ENDPOINTS.LOYALTY_POINT.TIER_CONFIGS);
    }

    /**
     * Cập nhật điểm tối thiểu yêu cầu cho một hạng thành viên cụ thể.
     * @param tier - Tên hạng thành viên
     * @param minPoints - Số điểm tối thiểu mới
     */
    async updateTierConfig(tier: string, minPoints: number): Promise<IApiResponse<IMemberTierConfig>> {
        return httpClient.put<IApiResponse<IMemberTierConfig>>(
            API_ENDPOINTS.LOYALTY_POINT.TIER_CONFIGS,
            null,
            { params: { tier, minPoints } }
        );
    }

    /**
     * Điều chỉnh thủ công hạng thành viên của một người dùng cụ thể (dành cho Admin).
     * @param userId - Mã người dùng
     * @param newTier - Hạng mới được gán
     */
    async adjustUserTier(userId: string, newTier: string): Promise<IApiResponse<any>> {
        return httpClient.put<IApiResponse<any>>(
            API_ENDPOINTS.LOYALTY_POINT.ADJUST_USER_TIER,
            null,
            { params: { userId, newTier } }
        );
    }
}

// Khởi tạo và xuất thể hiện duy nhất của LoyaltyPointService
export const loyaltyPointService = new LoyaltyPointService();
