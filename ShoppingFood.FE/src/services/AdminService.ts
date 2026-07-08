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
    return httpClient.post<IApiResponse<void>>(API_ENDPOINTS.ADMIN.APPROVE_SELLER, data);
  }

  async createStaff(data: any): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.ADMIN.CREATE_STAFF, data);
  }

  async getApiEndpoints(): Promise<IApiResponse<any[]>> {
    return httpClient.get<IApiResponse<any[]>>(API_ENDPOINTS.ADMIN.PERMISSIONS_ENDPOINTS);
  }

  async toggleUserStatus(userId: string): Promise<IApiResponse<any>> {
    return httpClient.put<IApiResponse<any>>(API_ENDPOINTS.ADMIN.TOGGLE_USER_STATUS(userId), {});
  }

  async getRolePermissions(role: number): Promise<IApiResponse<string[]>> {
    return httpClient.get<IApiResponse<string[]>>(API_ENDPOINTS.ADMIN.ROLE_PERMISSIONS(role));
  }

  async updateRolePermissions(role: number, endpointIds: string[]): Promise<IApiResponse<any>> {
    return httpClient.put<IApiResponse<any>>(API_ENDPOINTS.ADMIN.ROLE_PERMISSIONS(role), { apiEndpointIds: endpointIds });
  }

  async getDashboardStats(days: number = 7): Promise<IApiResponse<any>> {
    return httpClient.get<IApiResponse<any>>(API_ENDPOINTS.ADMIN.DASHBOARD_STATS, { params: { days } });
  }

  async getOrderHeatmap(days: number = 30): Promise<IApiResponse<any>> {
    return httpClient.get<IApiResponse<any>>(API_ENDPOINTS.ADMIN.DASHBOARD_HEATMAP, { params: { days } });
  }

  async getMaintenanceSettings(): Promise<IApiResponse<any>> {
    return httpClient.get<IApiResponse<any>>(API_ENDPOINTS.ADMIN.SYSTEM_MAINTENANCE);
  }

  async updateMaintenanceSettings(data: any): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.ADMIN.SYSTEM_MAINTENANCE, data);
  }

  async updateLegalSettings(data: { termsOfUseCustomer: string, termsOfUseSeller: string, termsOfUseShipper: string, privacyPolicy: string }): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.ADMIN.SYSTEM_LEGAL, data);
  }

  async exportFinancialReport(days: number = 30, format: 'excel' | 'pdf' = 'excel'): Promise<Blob> {
    const response = await httpClient.get(API_ENDPOINTS.ADMIN.REPORTS_FINANCIAL, {
      params: { days, format },
      responseType: 'blob'
    });
    return response as unknown as Blob;
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
    return httpClient.post<IApiResponse<void>>(API_ENDPOINTS.ADMIN.APPROVE_PRODUCT, data);
  }

  async toggleShipperStatus(id: string, isLocked: boolean): Promise<IApiResponse<any>> {
    return httpClient.put<IApiResponse<any>>(API_ENDPOINTS.ADMIN.SUSPEND_SHIPPER(id), { isLocked });
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

  async getReviewReports(params?: { skip?: number, take?: number }): Promise<IApiResponse<any>> {
    return httpClient.get<IApiResponse<any>>(API_ENDPOINTS.ADMIN.REVIEW_REPORTS, { params });
  }

  async moderateReview(reportId: string, data: { isApproved: boolean, adminNote: string }): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.ADMIN.MODERATE_REVIEW_REPORT(reportId), data);
  }

  async getProductReports(params?: { skip?: number, take?: number }): Promise<IApiResponse<any>> {
    return httpClient.get<IApiResponse<any>>(API_ENDPOINTS.ADMIN.PRODUCT_REPORTS, { params });
  }

  async moderateProductReport(reportId: string, data: { isApproved: boolean, hideProduct: boolean, adminNote: string }): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.ADMIN.MODERATE_PRODUCT_REPORT(reportId), data);
  }

  async createSupportTicket(data: ICreateSupportTicketRequest): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.ADMIN.SUPPORT_TICKETS, data);
  }

  // Finance Config
  async getPlatformFinanceConfig(): Promise<IApiResponse<any>> {
    return httpClient.get<IApiResponse<any>>(API_ENDPOINTS.ADMIN.FINANCE_CONFIG);
  }

  async updatePlatformFinanceConfig(data: any): Promise<IApiResponse<any>> {
    return httpClient.put<IApiResponse<any>>(API_ENDPOINTS.ADMIN.FINANCE_CONFIG, data);
  }

  async getRestaurantCommissions(params?: { skip?: number; take?: number; filter?: string }): Promise<IApiResponse<any>> {
    return httpClient.get<IApiResponse<any>>(API_ENDPOINTS.ADMIN.FINANCE_CONFIG_RESTAURANTS, { params });
  }

  async updateRestaurantCommission(id: string, customCommissionRate: number | null): Promise<IApiResponse<any>> {
    return httpClient.put<IApiResponse<any>>(API_ENDPOINTS.ADMIN.FINANCE_CONFIG_RESTAURANT_BY_ID(id), { customCommissionRate });
  }
}

// Export singleton instance
export const adminService = new AdminService();
export default adminService;
