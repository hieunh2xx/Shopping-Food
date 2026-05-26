/**
 * Mirrors backend ProductDto.cs
 */
export interface IProductDto {
  id: string;
  restaurantId: string;
  restaurantName: string;
  itemName: string;
  description: string | null;
  price: number;
  categoryId: string;
  categoryName: string;
  stockStatus: string;
  primaryImageUrl: string | null;
  images: string[];
  toppings: IProductToppingDto[];
  sizes: IProductSizeDto[];
  createdAt: string;
  isHidden: boolean;
  averageRating: number;
  reviewCount: number;
  isFreeship: boolean;
  availableFrom: string | null;
  availableTo: string | null;
  isAvailableNow: boolean;
  status: string;
}

/**
 * Mirrors backend ProductToppingDto.cs
 */
export interface IProductToppingDto {
  id: string;
  name: string;
  price: number;
}

/**
 * Mirrors backend ProductSizeDto.cs
 */
export interface IProductSizeDto {
  id: string;
  name: string;
  priceAdjustment: number;
}

/**
 * Create product command payload
 */
export interface IAddProductRequest {
  restaurantId: string;
  itemName: string;
  description?: string;
  price: number;
  categoryId: string;
  stockStatus?: string;
  images?: string[];
  primaryImageIndex?: number;
}

/**
 * Update product command payload
 */
export interface IUpdateProductRequest {
  id: string;
  itemName?: string;
  description?: string;
  price?: number;
  categoryId?: string;
}

/**
 * Update stock status payload
 */
export interface IUpdateStockStatusRequest {
  id: string;
  stockStatus: string;
}

/**
 * Toggle product visibility payload
 */
export interface IToggleVisibilityRequest {
  id: string;
  isHidden: boolean;
}

/**
 * Update product availability payload
 */
export interface IUpdateAvailabilityRequest {
  id: string;
  availableFrom?: string;
  availableTo?: string;
}

/**
 * Search product query
 */
export interface ISearchProductQuery {
  keyword?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  restaurantId?: string;
  skip?: number;
  take?: number;
}
