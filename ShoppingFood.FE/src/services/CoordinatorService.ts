import { httpClient } from "./base/HttpClient"; 
import { BaseService } from "./base/BaseService";
import { API_ENDPOINTS } from "../config/endpoints";
import type { ISuggestedShipper, IApiResponse, IDispatchOrder, ISendProposalRequest, IForceAssignRequest, IReleaseOrderRequest, IMonitorShipperDto, ISuspendShipperRequest, IIncidentItemDto, IResolveIncidentRequest } from "../interfaces";

/**
 * Dịch vụ Điều phối đơn hàng & Quản trị vận hành (CoordinatorService).
 * Cung cấp các thao tác dành cho Điều phối viên (Coordinator):
 * - Bảng điều phối đơn hàng (Dispatch Board)
 * - Gợi ý tài xế, gán đơn cưỡng chế, phát đơn tự động (Broadcast)
 * - Theo dõi vị trí tài xế, xử phạt uy tín, đình chỉ tài xế
 * - Xử lý sự cố giao hàng và giải quyết khiếu nại đơn hàng
 */
class CoordinatorService extends BaseService<any, any, any> {
  protected readonly endpoint = API_ENDPOINTS.COORDINATOR.BASE;

  /**
   * Lấy danh sách các đơn hàng trên bảng điều phối (Dispatch Board) cần gán tài xế hoặc đang có sự cố.
   * @param status - Lọc theo trạng thái đơn
   * @param skip - Vị trí bỏ qua (phân trang)
   * @param take - Số lượng lấy
   * @param isEscalated - Lọc đơn hàng bị leo thang sự cố
   */
  async getDispatchBoard(status?: string, skip = 0, take = 50, isEscalated?: boolean): Promise<IApiResponse<IDispatchOrder[]>> {
    const params: Record<string, any> = { skip, take };
    if (status) params.status = status;
    if (isEscalated !== undefined) params.isEscalated = isEscalated;

    return httpClient.get<IApiResponse<IDispatchOrder[]>>(API_ENDPOINTS.COORDINATOR.ORDERS, { params });
  }

  /**
   * Lấy danh sách các tài xế được hệ thống thuật toán gợi ý phù hợp nhất cho một đơn hàng (dựa trên khoảng cách và uy tín).
   * @param orderId - Mã đơn hàng
   */
  async getSuggestedShippers(orderId: string): Promise<IApiResponse<ISuggestedShipper[]>> {
    return httpClient.get<IApiResponse<ISuggestedShipper[]>>(API_ENDPOINTS.COORDINATOR.SUGGESTED_SHIPPERS(orderId));
  }

  /**
   * Gửi đề xuất nhận đơn giao hàng tới một tài xế cụ thể.
   * @param data - Mã đơn và mã tài xế nhận đề xuất
   */
  async sendProposal(data: ISendProposalRequest): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.COORDINATOR.SEND_PROPOSAL, data);
  }

  /**
   * Cưỡng chế chỉ định trực tiếp một tài xế nhận giao đơn hàng (Force Assign).
   * @param data - Thông tin đơn hàng và tài xế bị gán
   */
  async forceAssign(data: IForceAssignRequest): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.COORDINATOR.FORCE_ASSIGN, data);
  }

  /**
   * Phát sóng đơn hàng cho tất cả các tài xế đang trực tuyến ở gần nhận tự do (Broadcast).
   * @param orderId - Mã đơn hàng cần phát sóng
   */
  async broadcastOrder(orderId: string): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.COORDINATOR.BROADCAST(orderId), {});
  }

  /**
   * Xử lý giải quyết sự cố đơn hàng (hủy đơn, hoàn tiền, đền bù).
   * @param orderId - Mã đơn hàng
   * @param data - Phương án xử lý sự cố
   */
  async resolveIncident(orderId: string, data: any): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.COORDINATOR.RESOLVE_INCIDENT(orderId), data);
  }

  /**
   * Giải phóng đơn hàng khỏi tài xế hiện tại (hủy phân công tài xế khi họ không nhận/bỏ đơn) để gán cho người khác.
   * @param orderId - Mã đơn hàng
   * @param data - Lý do giải phóng đơn
   */
  async releaseOrder(orderId: string, data: IReleaseOrderRequest): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.COORDINATOR.RELEASE_ORDER(orderId), data);
  }

  /**
   * Lấy danh sách giám sát trạng thái trực tuyến, vị trí GPS và số đơn đang giao của tất cả tài xế.
   * @param isOnline - Lọc theo trạng thái trực tuyến
   * @param searchName - Tìm kiếm theo tên hoặc SĐT tài xế
   */
  async getMonitorShippers(isOnline?: boolean, searchName?: string): Promise<IApiResponse<IMonitorShipperDto[]>> {
    const params: Record<string, any> = {};
    if (isOnline !== undefined) params.isOnline = isOnline;
    if (searchName) params.searchName = searchName;

    return httpClient.get<IApiResponse<IMonitorShipperDto[]>>(
      API_ENDPOINTS.COORDINATOR.MONITOR_SHIPPERS,
      { params }
    );
  }

  /**
   * Tạm dừng hoặc đình chỉ hoạt động của một tài xế vi phạm quy định.
   * @param shipperId - Mã tài xế
   * @param data - Lý do và thời hạn đình chỉ
   */
  async suspendShipper(shipperId: string, data: ISuspendShipperRequest): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(
      API_ENDPOINTS.COORDINATOR.SUSPEND_SHIPPER(shipperId),
      data
    );
  }

  /**
   * Lấy lịch sử điều phối và luân chuyển của một đơn hàng cụ thể.
   * @param orderId - Mã đơn hàng
   */
  async getDispatchHistory(orderId: string): Promise<IApiResponse<any[]>> {
    return httpClient.get<IApiResponse<any[]>>(API_ENDPOINTS.COORDINATOR.ORDER_DISPATCH_HISTORY(orderId));
  }

  /**
   * Lấy toàn bộ lịch sử các thao tác điều phối đơn hàng trong hệ thống (có bộ lọc và phân trang).
   */
  async getAllDispatchHistories(params?: {
    orderId?: string;
    actionType?: string;
    filter?: string;
    skip?: number;
    take?: number;
  }): Promise<IApiResponse<any[]>> {
    return httpClient.get<IApiResponse<any[]>>(API_ENDPOINTS.COORDINATOR.DISPATCH_HISTORY, { params });
  }

  /**
   * Lấy danh sách các sự cố vận hành đang cần xử lý (hỏng xe, khách không nghe máy, quán hết món,...).
   * @param type - Loại sự cố
   * @param skip - Bỏ qua
   * @param take - Số lượng lấy
   */
  async getIncidents(type?: string, skip = 0, take = 50): Promise<IApiResponse<IIncidentItemDto[]>> {
    return httpClient.get<IApiResponse<IIncidentItemDto[]>>(API_ENDPOINTS.COORDINATOR.INCIDENTS, { params: { incidentType: type, skip, take } });
  }

  /**
   * Yêu cầu tài xế hoặc các bên liên quan gửi văn bản giải trình về sự cố đơn hàng.
   * @param orderId - Mã đơn hàng
   * @param message - Yêu cầu nội dung giải trình
   */
  async requestExplanation(orderId: string, message: string): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.COORDINATOR.REQUEST_EXPLANATION(orderId), { message });
  }

  /**
   * Lấy thông tin bản giải trình sự cố đã gửi của một đơn hàng.
   * @param orderId - Mã đơn hàng
   */
  async getOrderExplanation(orderId: string): Promise<IApiResponse<any[]>> {
    return httpClient.get<IApiResponse<any[]>>(API_ENDPOINTS.COORDINATOR.GET_EXPLANATION(orderId));
  }

  /**
   * Giải quyết báo cáo khiếu nại hoặc sự cố đơn hàng.
   * @param reportId - Mã báo cáo sự cố
   * @param data - Quyết định xử lý
   */
  async resolveComplaint(reportId: string, data: IResolveIncidentRequest): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.COORDINATOR.RESOLVE_COMPLAINT(reportId), data);
  }

  /**
   * Điều chỉnh cộng hoặc trừ điểm uy tín (Reputation Score) của một tài xế.
   * @param shipperId - Mã tài xế
   * @param data - Số điểm thay đổi và lý do
   */
  async adjustShipperReputation(shipperId: string, data: { points: number, reason: string }): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.COORDINATOR.ADJUST_SHIPPER_REPUTATION(shipperId), data);
  }

  /**
   * Lấy danh sách các khiếu nại của khách hàng liên quan đến đơn hàng (Order Complaints).
   */
  async getOrderComplaints(status?: string, skip = 0, take = 20): Promise<IApiResponse<any[]>> {
    return httpClient.get<IApiResponse<any[]>>(API_ENDPOINTS.COORDINATOR.ORDER_COMPLAINTS, { params: { status, skip, take } });
  }
}

// Khởi tạo và xuất thể hiện duy nhất của CoordinatorService
export const coordinatorService = new CoordinatorService();
