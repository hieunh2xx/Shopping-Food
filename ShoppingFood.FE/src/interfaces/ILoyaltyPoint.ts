export interface ILoyaltyPointHistoryDto {
    id: string;
    userAccountId: string;
    points: number;
    transactionType: string;
    description: string;
    createdAt: string;
}

export interface ILoyaltyPointDto {
    userAccountId: string;
    pointsBalance: number;
    totalEarnedPoints: number;
    tier: string;
    updatedAt: string;
    history: ILoyaltyPointHistoryDto[];
}

export interface IRedeemPointGiftRequest{
    pointGiftConfigId: string;
}

export interface IMemberTierConfig {
    id: string;
    tier: string;
    minPoints: number;
    updatedAt: string;
}