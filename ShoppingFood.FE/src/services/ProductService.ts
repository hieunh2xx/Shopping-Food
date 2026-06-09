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

  async reportProduct(data: { productId: string; reason: string; detail?: string }): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.PRODUCT.REPORT, data);
  }

  async reviewProduct(data: { productId: string; rating: number; comment?: string }): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.PRODUCT.REVIEW, data);
  }
}

// Export singleton instance
export const productService = new ProductService();
