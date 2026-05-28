import { httpClient } from './base/HttpClient';
import { BaseService } from './base/BaseService';
import { API_ENDPOINTS } from '../config/endpoints';
import type { IApiResponse, IApproveApplicationRequest, IApproveProductRequest } from '../interfaces';

/**
 * Admin Service — handles admin-specific endpoints
 * 
 * Extends BaseService with approval actions.
 */
class AdminService extends BaseService<unknown> {
  protected readonly endpoint = API_ENDPOINTS.ADMIN.BASE;

  /**
   * POST /api/Admin/ApproveSellerApplication
   * Approve or reject a seller application
   */
  async approveSellerApplication(data: IApproveApplicationRequest): Promise<IApiResponse<void>> {
    return httpClient.post<IApiResponse<void>>(`${this.endpoint}/ApproveSellerApplication`, data);
  }

  /**
   * POST /api/Admin/ApproveProduct
   * Approve or reject a product
   */
  async approveProduct(data: IApproveProductRequest): Promise<IApiResponse<void>> {
    return httpClient.post<IApiResponse<void>>(`${this.endpoint}/ApproveProduct`, data);
  }
}

// Export singleton instance
export const adminService = new AdminService();
