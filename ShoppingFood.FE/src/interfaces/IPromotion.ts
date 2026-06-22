export interface IBuyXGetYPromotionDto {
  id: string;
  restaurantId: string;
  triggerProductId: string;
  triggerProductName: string;
  buyQuantity: number;
  giftProductId: string;
  giftProductName: string;
  giftQuantity: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
}

export interface ICreatePromotionRequest {
  triggerProductId: string;
  buyQuantity: number;
  giftProductId: string;
  giftQuantity: number;
  startDate: string;
  endDate: string;
  isActive?: boolean;
}

export interface IUpdatePromotionRequest {
  id: string;
  triggerProductId: string;
  buyQuantity: number;
  giftProductId: string;
  giftQuantity: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface IGetPromotionsParams {
  restaurantId?: string;
  isActive?: boolean;
}
