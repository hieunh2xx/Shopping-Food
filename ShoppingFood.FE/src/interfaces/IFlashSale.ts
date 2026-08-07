export interface IFlashSale {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  status: string;
}

export interface IFlashSaleProduct {
  id: string;
  flashSaleId: string;
  productId: string;
  productName: string;
  restaurantName: string;
  originalPrice: number;
  flashSalePrice: number;
  quantityLimit: number;
  soldQuantity: number;
  status: string;
  rejectReason?: string;
  createdAt: string;
}

export interface IReviewFlashSaleProductRequest {
  flashSaleProductId: string;
  isApproved: boolean;
  rejectionReason?: string;
}

export interface IRegisterFlashSaleRequest {
  flashSaleId: string;
  productId: string;
  flashSalePrice: number;
  quantityLimit: number;
}

export interface ICreateFlashSaleRequest {
  title: string;
  startDate: string;
  endDate: string;
}

export interface IUpdateFlashSaleRequest {
  title?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}
