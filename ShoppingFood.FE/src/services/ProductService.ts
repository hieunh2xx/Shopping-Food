import { httpClient } from './base/HttpClient';
import { BaseService } from './base/BaseService';
import { API_ENDPOINTS } from '../config/endpoints';
import type {
  IApiResponse,
  IProductDto,
  IAddProductRequest,
  IUpdateProductRequest,
  IUpdateStockStatusRequest,
  IToggleVisibilityRequest,
  IUpdateAvailabilityRequest,
  ISearchProductQuery,
  IMenuCategoryDto,
  IProductReviewDto,
  IProductRecommendationDto,
} from '../interfaces';

/**
 * Product Service — handles all product-related endpoints
 * 
 * Extends BaseService with product-specific methods.
 * Demonstrates OCP: many domain-specific methods added without modifying base.
 */
class ProductService extends BaseService<IProductDto, IAddProductRequest, IUpdateProductRequest> {
  protected readonly endpoint = API_ENDPOINTS.PRODUCT.BASE;

  /**
   * GET /api/Product/Search
   * Search products with filters
   */
  async search(query: ISearchProductQuery): Promise<IApiResponse<IProductDto[]>> {
    return httpClient.get<IApiResponse<IProductDto[]>>(API_ENDPOINTS.PRODUCT.SEARCH, { params: query });
  }

  async getBestSellers(take: number = 10): Promise<IApiResponse<IProductDto[]>> {
    return httpClient.get<IApiResponse<IProductDto[]>>(API_ENDPOINTS.PRODUCT.BEST_SELLERS, { params: { take } });
  }

  async getRecommendations(params?: { latitude?: number; longitude?: number; take?: number }): Promise<IApiResponse<IProductRecommendationDto[]>> {
    return httpClient.get<IApiResponse<IProductRecommendationDto[]>>(API_ENDPOINTS.PRODUCT.RECOMMENDATIONS, { params });
  }

  async getCategories(): Promise<IApiResponse<IMenuCategoryDto[]>> {
    return httpClient.get<IApiResponse<IMenuCategoryDto[]>>(API_ENDPOINTS.PRODUCT.CATEGORIES);
  }

  async updateStockStatus(data: IUpdateStockStatusRequest): Promise<IApiResponse<IProductDto>> {
    return httpClient.patch<IApiResponse<IProductDto>>(
      API_ENDPOINTS.PRODUCT.STOCK_STATUS(data.id),
      data
    );
  }

  async toggleVisibility(data: IToggleVisibilityRequest): Promise<IApiResponse<IProductDto>> {
    return httpClient.patch<IApiResponse<IProductDto>>(
      API_ENDPOINTS.PRODUCT.VISIBILITY(data.id),
      data
    );
  }

  async updateAvailability(data: IUpdateAvailabilityRequest): Promise<IApiResponse<IProductDto>> {
    return httpClient.patch<IApiResponse<IProductDto>>(
      API_ENDPOINTS.PRODUCT.AVAILABILITY(data.id),
      data
    );
  }

  async reportProduct(data: { productId: string; reason: string; description?: string }): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.PRODUCT.REPORT, data);
  }

  async getProductReviews(productId: string, skip = 0, take = 20): Promise<IApiResponse<IProductReviewDto[]>> {
    return httpClient.get<IApiResponse<IProductReviewDto[]>>(API_ENDPOINTS.PRODUCT.REVIEWS(productId), { params: { skip, take } });
  }

  async getSellerReviews(skip = 0, take = 50): Promise<IApiResponse<IProductReviewDto[]>> {
    return httpClient.get<IApiResponse<IProductReviewDto[]>>(API_ENDPOINTS.PRODUCT.SELLER_REVIEWS, { params: { skip, take } });
  }

  async reviewProduct(data: { productId: string; rating: number; comment?: string }): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.PRODUCT.REVIEW, data);
  }

  async replyReview(reviewId: string, reply: string): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.PRODUCT.REVIEW_REPLY(reviewId), { reply });
  }

  async reportReview(reviewId: string, reason: string): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.PRODUCT.REVIEW_REPORT(reviewId), { reason });
  }
}

// Export singleton instance
export const productService = new ProductService();
