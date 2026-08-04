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
  flashSalePrice?: number | null;
  categoryId: string;
  categoryName: string;
  globalCategoryId?: string;
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

export interface IProductRecommendationDto extends IProductDto {
  reasonTag: 'frequently_ordered' | 'flash_sale' | 'trending_category' | 'top_rated' | '';
  scoreRank: number;
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
  sizeName: string;
  extraPrice: number;
  isDefault?: boolean;
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
  globalCategoryId?: string;
  stockStatus?: string;
  imageUrls?: string[];
  toppingIds?: string[];
  sizes?: IProductSizeDto[];
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
  globalCategoryId?: string;
  imageUrls?: string[];
  toppingIds?: string[];
  sizes?: IProductSizeDto[];
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
  filter?: string;
  minPrice?: number;
  maxPrice?: number;
  restaurantId?: string;
  categoryId?: string;
  globalCategoryId?: string;
  skip?: number;
  take?: number;
  sortBy?: string;
  minRating?: number;
  isFreeship?: boolean;
  status?: string;
  userLatitude?: number;
  userLongitude?: number;
  maxDistanceInKm?: number;
}
