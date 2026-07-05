import { httpClient } from './base/HttpClient';
import { BaseService } from './base/BaseService';
import { API_ENDPOINTS } from '../config/endpoints';
import type { IApiResponse, IApproveApplicationRequest, IApproveProductRequest, ICreateSupportTicketRequest } from '../interfaces';

/**
 * Admin Service — handles admin-specific endpoints
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

  async getSellerApplications(params?: { status?: string; skip?: number; take?: number }): Promise<IApiResponse<any>> {
    return httpClient.get<IApiResponse<any>>(API_ENDPOINTS.ADMIN.SELLER_APPLICATIONS, { params });
  }

  async getShipperApplications(params?: { status?: string; skip?: number; take?: number }): Promise<IApiResponse<any>> {
    return httpClient.get<IApiResponse<any>>(API_ENDPOINTS.ADMIN.SHIPPER_APPLICATIONS, { params });
  }

  /**
   * POST /api/Admin/ApproveProduct
   * Approve or reject a product
   */
  async approveProduct(data: IApproveProductRequest): Promise<IApiResponse<void>> {
    return httpClient.post<IApiResponse<void>>(`${this.endpoint}/ApproveProduct`, data);
  }

  async approveShipperApplication(data: { applicationId: string; isApproved: boolean; rejectionReason?: string }): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.ADMIN.APPROVE_SHIPPER, data);
  }

  async getGlobalMenuCategories(showHidden: boolean = false): Promise<IApiResponse<any>> {
    return httpClient.get<IApiResponse<any>>(API_ENDPOINTS.ADMIN.GLOBAL_MENU_CATEGORY, {
      params: { showHidden },
    });
  }

  async createGlobalMenuCategory(data: { name: string; description?: string; imageUrl?: string; sortOrder: number }): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.ADMIN.GLOBAL_MENU_CATEGORY, data);
  }

  async updateGlobalMenuCategory(id: string, data: { name: string; description?: string; imageUrl?: string; sortOrder: number }): Promise<IApiResponse<any>> {
    return httpClient.put<IApiResponse<any>>(API_ENDPOINTS.ADMIN.GLOBAL_MENU_CATEGORY_BY_ID(id), { id, ...data });
  }

  async deleteGlobalMenuCategory(id: string): Promise<IApiResponse<any>> {
    return httpClient.delete<IApiResponse<any>>(API_ENDPOINTS.ADMIN.GLOBAL_MENU_CATEGORY_BY_ID(id));
  }

  async toggleGlobalMenuCategoryVisibility(id: string): Promise<IApiResponse<any>> {
    return httpClient.patch<IApiResponse<any>>(API_ENDPOINTS.ADMIN.GLOBAL_MENU_CATEGORY_VISIBILITY(id));
  }

  async broadcastNotification(data: {
    flashSaleId: string;
    customMessage: string;
    targetAudience: number; // 0=AllCustomers, 1=ByTier, 2=SpecificCustomers
    targetTier?: number; // 0=Bronze, 1=Silver, 2=Gold, 3=Diamond
    targetUserIds?: string[];
  }): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.ADMIN.BROADCAST_NOTIFICATION, data);
  }
  async getReviewReports(skip = 0, take = 50): Promise<IApiResponse<any>> {
    return httpClient.get<IApiResponse<any>>(API_ENDPOINTS.ADMIN.REVIEW_REPORTS, { params: { skip, take } });
  }

  async moderateReviewReport(reportId: string, action: number): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.ADMIN.MODERATE_REVIEW_REPORT(reportId), { action });
  }

  async createSupportTicket(data: ICreateSupportTicketRequest): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.ADMIN.SUPPORT_TICKETS, data);
  }
}

// Export singleton instance
export const adminService = new AdminService();
export default adminService;
