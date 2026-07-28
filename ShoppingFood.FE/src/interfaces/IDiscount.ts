export interface ICreateDiscountRequest {
  code: string;
  title: string;
  description?: string;
  type: string; 
  value: number;
  maxDiscountAmount?: number;
  minOrderAmount: number;
  restaurantId?: string;
  startDate: string;
  endDate: string;
  quantity: number;
  maxUsagePerUser?: number;
}

export interface ISaveDiscountRequest {
  discountId: string;
}

export interface IDiscountDto {
  id: string;
  code: string;
  title: string;
  description?: string;
  type: string;
  value: number;
  maxDiscountAmount?: number;
  minOrderAmount: number;
  restaurantId?: string;
  restaurantName?: string;
  startDate: string;
  endDate: string;
  quantity: number;
  usedCount: number;
  maxUsagePerUser: number;
  status: string;
  isSaved?: boolean;
  isUsedUp?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IGetDiscountsParams{
  restaurantId?: string;
  cartAmount?: number;
  filter?: string;
  skip?: number;
  take?: number;
  isSavedOnly?: boolean;
}

export interface IUpdateDiscountRequest {
  title: string;
  description?: string;
  value: number;
  maxDiscountAmount?: number;
  minOrderAmount: number;
  startDate: string;
  endDate: string;
  quantity: number;
  maxUsagePerUser: number;
  status: string; 
}

export interface IApplyDiscountRequest {
  code: string;
  restaurantId?: string;
  cartAmount: number;
}

export interface IApplyDiscountResponse {
  discountId: string;
  code: string;
  type: string;
  discountAmount: number;
  finalAmount: number;
}

