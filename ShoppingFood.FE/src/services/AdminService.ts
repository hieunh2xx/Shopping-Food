import { httpClient } from './base/HttpClient';
import { BaseService } from './base/BaseService';
import { API_ENDPOINTS } from '../config/endpoints';
import type { IApiResponse, IApproveApplicationRequest, IApproveProductRequest, ICreateSupportTicketRequest } from '../interfaces';

/**
 * Dịch vụ Quản trị hệ thống (AdminService) — Chuyên trách các API dành cho Quản trị viên (Admin).
 * Bao gồm: phê duyệt người bán/tài xế, quản lý danh mục toàn hệ thống, phân quyền, cấu hình tài chính, báo cáo và kiểm duyệt.
 */
class AdminService extends BaseService<unknown> {
  protected readonly endpoint = API_ENDPOINTS.ADMIN.BASE;

  /**
   * Phê duyệt hoặc từ chối đơn đăng ký trở thành Người bán hàng (Seller Application).
   * @param data - Thông tin duyệt/từ chối và lý do
   */
  async approveSellerApplication(data: IApproveApplicationRequest): Promise<IApiResponse<void>> {
    return httpClient.post<IApiResponse<void>>(API_ENDPOINTS.ADMIN.APPROVE_SELLER, data);
  }

  /**
   * Tạo mới tài khoản nhân viên nội bộ (Staff) với vai trò chỉ định.
   * @param data - Thông tin tài khoản nhân viên
   */
  async createStaff(data: any): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.ADMIN.CREATE_STAFF, data);
  }

  /**
   * Lấy danh sách toàn bộ các API Endpoints trong hệ thống để phục vụ cấu hình phân quyền vai trò.
   * @returns Danh sách các API endpoint có thể phân quyền
   */
  async getApiEndpoints(): Promise<IApiResponse<any[]>> {
    return httpClient.get<IApiResponse<any[]>>(API_ENDPOINTS.ADMIN.PERMISSIONS_ENDPOINTS);
  }

  /**
   * Khóa hoặc mở khóa trạng thái hoạt động của một tài khoản người dùng theo User ID.
   * @param userId - Mã định danh người dùng
   */
  async toggleUserStatus(userId: string): Promise<IApiResponse<any>> {
    return httpClient.put<IApiResponse<any>>(API_ENDPOINTS.ADMIN.TOGGLE_USER_STATUS(userId), {});
  }

  /**
   * Lấy danh sách các quyền truy cập API được gán cho một vai trò (Role) cụ thể.
   * @param role - Mã số vai trò người dùng
   * @returns Mảng mã endpoint IDs
   */
  async getRolePermissions(role: number): Promise<IApiResponse<string[]>> {
    return httpClient.get<IApiResponse<string[]>>(API_ENDPOINTS.ADMIN.ROLE_PERMISSIONS(role));
  }

  /**
   * Cập nhật danh sách quyền truy cập API cho một vai trò người dùng cụ thể.
   * @param role - Mã số vai trò
   * @param endpointIds - Mảng ID endpoint được cấp quyền
   */
  async updateRolePermissions(role: number, endpointIds: string[]): Promise<IApiResponse<any>> {
    return httpClient.put<IApiResponse<any>>(API_ENDPOINTS.ADMIN.ROLE_PERMISSIONS(role), { apiEndpointIds: endpointIds });
  }

  /**
   * Lấy số liệu thống kê tổng quan của Admin Dashboard (doanh thu, đơn hàng, người dùng mới) theo khoảng ngày.
   * @param days - Số ngày thống kê gần nhất (mặc định 7 ngày)
   */
  async getDashboardStats(days: number = 7): Promise<IApiResponse<any>> {
    return httpClient.get<IApiResponse<any>>(API_ENDPOINTS.ADMIN.DASHBOARD_STATS, { params: { days } });
  }

  /**
   * Lấy dữ liệu bản đồ nhiệt mật độ đơn hàng (Order Heatmap) theo khu vực địa lý trong số ngày chỉ định.
   * @param days - Khoảng thời gian (mặc định 30 ngày)
   */
  async getOrderHeatmap(days: number = 30): Promise<IApiResponse<any>> {
    return httpClient.get<IApiResponse<any>>(API_ENDPOINTS.ADMIN.DASHBOARD_HEATMAP, { params: { days } });
  }

  /**
   * Lấy cấu hình trạng thái bảo trì toàn hệ thống.
   */
  async getMaintenanceSettings(): Promise<IApiResponse<any>> {
    return httpClient.get<IApiResponse<any>>(API_ENDPOINTS.ADMIN.SYSTEM_MAINTENANCE);
  }

  /**
   * Cập nhật cài đặt chế độ bảo trì hệ thống (bật/tắt bảo trì, thông điệp bảo trì).
   * @param data - Cấu hình bảo trì
   */
  async updateMaintenanceSettings(data: any): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.ADMIN.SYSTEM_MAINTENANCE, data);
  }

  /**
   * Lấy cấu hình phí giao hàng và khoảng cách giao hàng toàn hệ thống.
   */
  async getDeliverySettings(): Promise<IApiResponse<any>> {
    return httpClient.get<IApiResponse<any>>(API_ENDPOINTS.ADMIN.SYSTEM_DELIVERY);
  }

  /**
   * Cập nhật cài đặt phí giao hàng cơ sở và cấu hình vận chuyển nền tảng.
   * @param data - Cấu hình giao hàng mới
   */
  async updateDeliverySettings(data: any): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.ADMIN.SYSTEM_DELIVERY, data);
  }

  /**
   * Cập nhật nội dung các điều khoản pháp lý (Điều khoản sử dụng cho Khách/Bán/Tài xế và Chính sách bảo mật).
   * @param data - Nội dung văn bản pháp lý
   */
  async updateLegalSettings(data: { termsOfUseCustomer: string, termsOfUseSeller: string, termsOfUseShipper: string, privacyPolicy: string }): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.ADMIN.SYSTEM_LEGAL, data);
  }

  /**
   * Xuất báo cáo tài chính nền tảng ra file nhị phân (Excel hoặc PDF).
   * @param days - Số ngày thống kê
   * @param format - Định dạng xuất ('excel' hoặc 'pdf')
   * @returns Đối tượng Blob chứa file tải về
   */
  async exportFinancialReport(days: number = 30, format: 'excel' | 'pdf' = 'excel'): Promise<Blob> {
    return httpClient.get<Blob>(API_ENDPOINTS.ADMIN.REPORTS_FINANCIAL, {
      params: { days, format },
      responseType: 'blob'
    });
  }

  /**
   * Lấy danh sách nhật ký hành động người dùng / quản trị (Action Logs) có phân trang và tìm kiếm.
   */
  async getActionLogs(skip: number = 0, take: number = 10, filter: string = '', orderDirection: string = 'desc'): Promise<IApiResponse<any[]>> {
    return httpClient.get<IApiResponse<any[]>>(API_ENDPOINTS.SYSTEM?.ACTION_LOGS || '/System/action-logs', {
      params: { skip, take, filter, orderDirection }
    });
  }

  /**
   * Lấy danh sách nhật ký lỗi hệ thống (Error Logs) có phân trang và bộ lọc.
   */
  async getErrorLogs(skip: number = 0, take: number = 10, filter: string = '', orderDirection: string = 'desc'): Promise<IApiResponse<any[]>> {
    return httpClient.get<IApiResponse<any[]>>(API_ENDPOINTS.SYSTEM?.ERROR_LOGS || '/System/error-logs', {
      params: { skip, take, filter, orderDirection }
    });
  }

  /**
   * Lấy danh sách các đơn đăng ký mở gian hàng của Người bán hàng có lọc theo trạng thái.
   */
  async getSellerApplications(params?: { status?: string; skip?: number; take?: number }): Promise<IApiResponse<any>> {
    return httpClient.get<IApiResponse<any>>(API_ENDPOINTS.ADMIN.SELLER_APPLICATIONS, { params });
  }

  /**
   * Lấy danh sách các đơn đăng ký trở thành Tài xế (Shipper Applications) có phân trang và lọc trạng thái.
   */
  async getShipperApplications(params?: { status?: string; skip?: number; take?: number }): Promise<IApiResponse<any>> {
    return httpClient.get<IApiResponse<any>>(API_ENDPOINTS.ADMIN.SHIPPER_APPLICATIONS, { params });
  }

  /**
   * Phê duyệt hoặc từ chối sản phẩm món ăn mới do Người bán gửi lên xét duyệt.
   * @param data - Thông tin xét duyệt sản phẩm
   */
  async approveProduct(data: IApproveProductRequest): Promise<IApiResponse<void>> {
    return httpClient.post<IApiResponse<void>>(API_ENDPOINTS.ADMIN.APPROVE_PRODUCT, data);
  }

  /**
   * Khóa hoặc mở khóa quyền nhận đơn của một tài xế (Shipper) cụ thể.
   * @param id - Mã tài xế
   * @param isLocked - true nếu khóa, false nếu mở khóa
   */
  async toggleShipperStatus(id: string, isLocked: boolean): Promise<IApiResponse<any>> {
    return httpClient.put<IApiResponse<any>>(API_ENDPOINTS.ADMIN.SUSPEND_SHIPPER(id), { isLocked });
  }

  /**
   * Phê duyệt hoặc từ chối đơn đăng ký tài xế (Shipper Application).
   * @param data - Mã đơn đăng ký và hành động xử lý
   */
  async approveShipperApplication(data: { applicationId: string; action: string; rejectionReason?: string }): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.ADMIN.APPROVE_SHIPPER, data);
  }

  /**
   * Lấy danh sách danh mục thực đơn chung toàn hệ thống (Global Menu Categories).
   * @param showHidden - Có hiển thị các danh mục đang bị ẩn hay không
   */
  async getGlobalMenuCategories(showHidden: boolean = false): Promise<IApiResponse<any>> {
    return httpClient.get<IApiResponse<any>>(API_ENDPOINTS.ADMIN.GLOBAL_MENU_CATEGORY, {
      params: { showHidden },
    });
  }

  /**
   * Tạo mới một danh mục thực đơn toàn hệ thống.
   * @param data - Tên danh mục, mô tả, ảnh đại diện và thứ tự sắp xếp
   */
  async createGlobalMenuCategory(data: { name: string; description?: string; imageUrl?: string; sortOrder: number }): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.ADMIN.GLOBAL_MENU_CATEGORY, data);
  }

  /**
   * Cập nhật thông tin danh mục thực đơn hệ thống theo ID.
   * @param id - Mã danh mục
   * @param data - Thông tin cập nhật
   */
  async updateGlobalMenuCategory(id: string, data: { name: string; description?: string; imageUrl?: string; sortOrder: number }): Promise<IApiResponse<any>> {
    return httpClient.put<IApiResponse<any>>(API_ENDPOINTS.ADMIN.GLOBAL_MENU_CATEGORY_BY_ID(id), { id, ...data });
  }

  /**
   * Xóa một danh mục thực đơn toàn hệ thống theo ID.
   * @param id - Mã danh mục cần xóa
   */
  async deleteGlobalMenuCategory(id: string): Promise<IApiResponse<any>> {
    return httpClient.delete<IApiResponse<any>>(API_ENDPOINTS.ADMIN.GLOBAL_MENU_CATEGORY_BY_ID(id));
  }

  /**
   * Bật hoặc tắt trạng thái hiển thị của danh mục thực đơn hệ thống.
   * @param id - Mã danh mục
   */
  async toggleGlobalMenuCategoryVisibility(id: string): Promise<IApiResponse<any>> {
    return httpClient.patch<IApiResponse<any>>(API_ENDPOINTS.ADMIN.GLOBAL_MENU_CATEGORY_VISIBILITY(id));
  }

  /**
   * Phát sóng thông báo đẩy hàng loạt (Broadcast Notification) tới toàn bộ hoặc một nhóm đối tượng người dùng.
   * @param data - Cấu hình nội dung và đối tượng nhận thông báo
   */
  async broadcastNotification(data: {
    flashSaleId: string;
    customMessage: string;
    targetAudience: number; // 0=AllCustomers, 1=ByTier, 2=SpecificCustomers
    targetTier?: number; // 0=Bronze, 1=Silver, 2=Gold, 3=Diamond
    targetUserIds?: string[];
  }): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.ADMIN.BROADCAST_NOTIFICATION, data);
  }

  /**
   * Lấy danh sách các báo cáo vi phạm đánh giá (Review Reports) từ người dùng.
   */
  async getReviewReports(params?: { skip?: number, take?: number }): Promise<IApiResponse<any>> {
    return httpClient.get<IApiResponse<any>>(API_ENDPOINTS.ADMIN.REVIEW_REPORTS, { params });
  }

  /**
   * Xử lý kiểm duyệt báo cáo vi phạm đánh giá (xóa đánh giá, cảnh báo người dùng).
   * @param reportId - Mã báo cáo
   * @param action - Hành động (1: Xóa đánh giá, 2: Xóa & cảnh báo)
   */
  async moderateReviewReport(reportId: string, action: number): Promise<IApiResponse<any>> {
    let isApproved = action > 0;
    let adminNote = '';
    if (action === 1) adminNote = 'Deleted review';
    if (action === 2) adminNote = 'Deleted review & Warned user';

    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.ADMIN.MODERATE_REVIEW_REPORT(reportId), {
      reportId,
      isApproved,
      adminNote
    });
  }

  /**
   * Lấy danh sách các báo cáo vi phạm sản phẩm (Product Reports) cần xử lý.
   */
  async getProductReports(params?: { skip?: number, take?: number }): Promise<IApiResponse<any>> {
    return httpClient.get<IApiResponse<any>>(API_ENDPOINTS.ADMIN.PRODUCT_REPORTS, { params });
  }

  /**
   * Xử lý kiểm duyệt báo cáo vi phạm sản phẩm (duyệt/ẩn sản phẩm vi phạm).
   * @param reportId - Mã báo cáo sản phẩm
   * @param data - Quyết định duyệt, ẩn sản phẩm và ghi chú của admin
   */
  async moderateProductReport(reportId: string, data: { isApproved: boolean, hideProduct: boolean, adminNote: string }): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.ADMIN.MODERATE_PRODUCT_REPORT(reportId), data);
  }

  /**
   * Tạo ticket hỗ trợ mới cho người dùng.
   * @param data - Nội dung ticket hỗ trợ
   */
  async createSupportTicket(data: ICreateSupportTicketRequest): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.ADMIN.SUPPORT_TICKETS, data);
  }

  /**
   * Lấy cấu hình tài chính chung của nền tảng (tỷ lệ hoa hồng mặc định, phí dịch vụ).
   */
  async getPlatformFinanceConfig(): Promise<IApiResponse<any>> {
    return httpClient.get<IApiResponse<any>>(API_ENDPOINTS.ADMIN.FINANCE_CONFIG);
  }

  /**
   * Cập nhật cấu hình tài chính nền tảng.
   * @param data - Dữ liệu cấu hình tài chính mới
   */
  async updatePlatformFinanceConfig(data: any): Promise<IApiResponse<any>> {
    return httpClient.put<IApiResponse<any>>(API_ENDPOINTS.ADMIN.FINANCE_CONFIG, data);
  }

  /**
   * Lấy danh sách tỷ lệ hoa hồng riêng của từng nhà hàng.
   */
  async getRestaurantCommissions(params?: { skip?: number; take?: number; filter?: string }): Promise<IApiResponse<any>> {
    return httpClient.get<IApiResponse<any>>(API_ENDPOINTS.ADMIN.FINANCE_CONFIG_RESTAURANTS, { params });
  }

  /**
   * Cập nhật tỷ lệ hoa hồng tùy chỉnh riêng cho một nhà hàng cụ thể.
   * @param id - Mã nhà hàng
   * @param customCommissionRate - Tỷ lệ hoa hồng riêng (%)
   */
  async updateRestaurantCommission(id: string, customCommissionRate: number | null): Promise<IApiResponse<any>> {
    return httpClient.put<IApiResponse<any>>(API_ENDPOINTS.ADMIN.FINANCE_CONFIG_RESTAURANT_BY_ID(id), { customCommissionRate });
  }

  /**
   * Lấy danh sách các từ khóa bị cấm (Blacklist Keywords) trong hệ thống.
   */
  async getBlacklistKeywords(): Promise<IApiResponse<any>> {
    return httpClient.get<IApiResponse<any>>(API_ENDPOINTS.ADMIN.BLACKLIST_KEYWORDS);
  }

  /**
   * Thêm một từ khóa mới vào danh sách đen.
   * @param data - Từ khóa cần cấm
   */
  async createBlacklistKeyword(data: { keyword: string }): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.ADMIN.BLACKLIST_KEYWORDS, data);
  }

  /**
   * Xóa một từ khóa khỏi danh sách đen.
   * @param id - Mã từ khóa cần xóa
   */
  async deleteBlacklistKeyword(id: string): Promise<IApiResponse<any>> {
    return httpClient.delete<IApiResponse<any>>(API_ENDPOINTS.ADMIN.BLACKLIST_KEYWORD_BY_ID(id));
  }

  /**
   * Bật hoặc tắt trạng thái kích hoạt của một từ khóa trong danh sách đen.
   * @param id - Mã từ khóa
   */
  async toggleBlacklistKeyword(id: string): Promise<IApiResponse<any>> {
    return httpClient.put<IApiResponse<any>>(API_ENDPOINTS.ADMIN.BLACKLIST_KEYWORD_TOGGLE(id), {});
  }
}

// Khởi tạo và xuất thể hiện duy nhất của AdminService
export const adminService = new AdminService();
export default adminService;
