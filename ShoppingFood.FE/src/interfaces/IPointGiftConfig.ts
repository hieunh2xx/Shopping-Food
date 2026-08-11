export interface IPointGiftConfigDto {
  id: string;
  discountId: string;
  pointRequired: number;
  isActive: boolean;
  createdAt: string;
  
  // Flattened from Discount
  discountCode: string;
  discountTitle: string;
  discountType: string;
  discountValue: number;
  minOrderAmount: number;
}

export interface ICreatePointGiftConfigRequest {
  discountId: string;
  pointRequired: number;
  isActive?: boolean;
}

export interface IUpdatePointGiftConfigRequest {
  id?: string;
  pointRequired: number;
  isActive: boolean;
}
