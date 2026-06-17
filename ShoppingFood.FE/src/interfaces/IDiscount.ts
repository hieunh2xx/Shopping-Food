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
  createdAt: string;
  updatedAt: string;
}
