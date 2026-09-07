import { httpClient } from './base/HttpClient';
import { API_ENDPOINTS } from '../config/endpoints';
import type { 
  IApiResponse, 
  IDeliveryRouteDto, 
  IProposedDeliveryOfferDto, 
  IToggleShipperOnlineRequest, 
  IAcceptDeliveryOfferRequest, 
  IConfirmArrivedRequest, 
  IConfirmPickedUpRequest,
  IConfirmPickedUpBatchRequest,
  IUpdateShipperLocationRequest,
  IConfirmDeliveryFailedRequest,
  IConfirmDeliverySuccessRequest,
  IShipperReputationHistory
} from '../interfaces';
import type { IRejectDeliveryOfferRequest, IShipperIncomeReportDto, IShipperScheduleAndAreaDto, IUpdateShipperScheduleAndAreaRequest } from '../interfaces/IShipper';

/**
 * Dịch vụ Dành cho Tài xế giao hàng (ShipperService).
 * Phụ trách quy trình giao hàng của Shipper:
 * - Bật/tắt trực tuyến, cập nhật vị trí GPS
 * - Xem và nhận đề xuất đơn hàng (Offer), từ chối nhận đơn
 * - Xác nhận đã đến quán (Arrived), xác nhận đã lấy hàng (Picked Up - đơn lẻ hoặc theo lô batch)
 * - Xác nhận giao thành công (kèm ảnh chụp bằng chứng) hoặc giao thất bại
 * - Xem báo cáo thu nhập, điểm uy tín, lịch hoạt động và báo cáo sự cố
 */
class ShipperService {
  /**
   * Chuyển đổi trạng thái hoạt động của tài xế giữa Trực tuyến (Online - sẵn sàng nhận đơn) và Ngoại tuyến (Offline).
   * @param data - Trạng thái online/offline
   */
  async toggleOnline(data: IToggleShipperOnlineRequest): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.SHIPPER.TOGGLE_ONLINE, data);
  }

  /**
   * Lấy thông tin chi tiết đề xuất giao hàng được phân bổ cho tài xế theo đơn hàng và tọa độ GPS hiện tại.
   * @param orderId - Mã đơn hàng
   * @param latitude - Vĩ độ hiện tại của tài xế
   * @param longitude - Kinh độ hiện tại của tài xế
   */
  async getProposedOffer(orderId: string, latitude: number, longitude: number): Promise<IApiResponse<IProposedDeliveryOfferDto>> {
    return httpClient.get<IApiResponse<IProposedDeliveryOfferDto>>(`${API_ENDPOINTS.SHIPPER.PROPOSED_OFFER(orderId)}?latitude=${latitude}&longitude=${longitude}`);
  }

  /**
   * Tài xế chấp nhận đơn đề xuất giao hàng.
   * @param data - Mã đơn và thông tin chấp nhận
   */
  async acceptOffer(data: IAcceptDeliveryOfferRequest): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.SHIPPER.ACCEPT_OFFER, data);
  }

  /**
   * Tài xế xác nhận đã có mặt tại quán ăn để lấy đồ (kiểm tra khoảng cách GPS tối đa 200m).
   * @param data - Mã đơn và tọa độ GPS hiện tại của tài xế
   */
  async confirmArrived(data: IConfirmArrivedRequest): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.SHIPPER.CONFIRM_ARRIVED, data);
  }

  /**
   * Tài xế xác nhận đã lấy hàng thành công cho một đơn lẻ (nhập mã OTP hoặc mã đơn).
   * @param data - Mã đơn và mã xác nhận lấy hàng
   */
  async confirmPickedUp(data: IConfirmPickedUpRequest): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.SHIPPER.CONFIRM_PICKED_UP, data);
  }

  /**
   * Tài xế xác nhận đã lấy hàng theo lô gộp (Batch Pickup) gồm nhiều đơn cùng một quán bằng mã gộp.
   * @param data - Mã lô gộp và danh sách mã đơn
   */
  async confirmPickedUpBatch(data: IConfirmPickedUpBatchRequest): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.SHIPPER.CONFIRM_PICKED_UP_BATCH, data);
  }

  /**
   * Cập nhật tọa độ GPS định kỳ của tài xế lên hệ thống máy chủ để theo dõi lộ trình và gợi ý đơn.
   * @param data - Vĩ độ, kinh độ và hướng di chuyển
   */
  async updateLocation(data: IUpdateShipperLocationRequest): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.SHIPPER.LOCATION, data);
  }

  /**
   * Lấy lộ trình giao hàng tối ưu (từ vị trí tài xế -> quán ăn -> địa chỉ khách hàng).
   * @param orderId - Mã đơn hàng
   */
  async getDeliveryRoute(orderId: string): Promise<IApiResponse<IDeliveryRouteDto>> {
    return httpClient.get<IApiResponse<IDeliveryRouteDto>>(API_ENDPOINTS.SHIPPER.DELIVERY_ROUTE(orderId));
  }

  /**
   * Tài xế xác nhận đã giao hàng thành công tới tay khách (bắt buộc tải lên ảnh bằng chứng giao hàng).
   * @param data - Mã đơn, ảnh bằng chứng và ghi chú
   */
  async confirmDelivered(data: IConfirmDeliverySuccessRequest) : Promise<IApiResponse<any>>{
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.SHIPPER.CONFIRM_DELIVERED, data);
  }

  /**
   * Tài xế xác nhận giao hàng thất bại (khách không nghe máy, boom hàng, sai địa chỉ).
   * @param data - Mã đơn và lý do thất bại
   */
  async confirmFailed(data: IConfirmDeliveryFailedRequest): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.SHIPPER.CONFIRM_FAILED, data);
  }

  /**
   * Lấy báo cáo thu nhập, số lượng chuyến xe và tiền tip của tài xế trong khoảng thời gian.
   * @param startDate - Ngày bắt đầu
   * @param endDate - Ngày kết thúc
   * @param skip - Bỏ qua
   * @param take - Số lượng lấy
   */
  async getIncomeReport(startDate?: string, endDate?: string, skip = 0, take = 10): Promise<IApiResponse<IShipperIncomeReportDto>>{
    const params = new URLSearchParams();
    if(startDate) params.append('startDate', startDate);
    if(endDate) params.append('endDate', endDate);
    params.append('skip', String(skip));
    params.append('take', String(take));
    return httpClient.get<IApiResponse<IShipperIncomeReportDto>>(`${API_ENDPOINTS.SHIPPER.INCOME_REPORT}?${params.toString()}`)
  }

  /**
   * Lấy thông tin lịch làm việc đã đăng ký và bán kính khu vực hoạt động của tài xế.
   */
  async getScheduleAndArea(): Promise<IApiResponse<IShipperScheduleAndAreaDto>>{
    return httpClient.get<IApiResponse<IShipperScheduleAndAreaDto>>(API_ENDPOINTS.SHIPPER.SCHEDULE_AREA)
  }

  /**
   * Cập nhật thời gian làm việc (giờ bắt đầu, giờ kết thúc) và bán kính nhận đơn hoạt động.
   * @param data - Dữ liệu cập nhật
   */
  async updateScheduleAndArea(data: IUpdateShipperScheduleAndAreaRequest): Promise<IApiResponse<any>> {
    return httpClient.put<IApiResponse<any>>(API_ENDPOINTS.SHIPPER.SCHEDULE_AREA, data);
  }

  /**
   * Lấy danh sách các đơn hàng đang có sẵn ở gần vị trí tài xế để nhận giao (khi phát sóng broadcast).
   * @param latitude - Vĩ độ hiện tại
   * @param longitude - Kinh độ hiện tại
   */
  async getAvailableOffers(latitude: number, longitude: number): Promise<IApiResponse<IProposedDeliveryOfferDto[]>>{
    return httpClient.get<IApiResponse<IProposedDeliveryOfferDto[]>>(`${API_ENDPOINTS.SHIPPER.AVAILABLE_OFFERS}?latitude=${latitude}&longitude=${longitude}`);
  }

  /**
   * Tài xế chủ động từ chối một đề xuất đơn hàng (kèm lý do).
   * @param data - Mã đơn và lý do từ chối
   */
  async rejectOffer(data: IRejectDeliveryOfferRequest): Promise<IApiResponse<any>>{
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.SHIPPER.REJECT_OFFER, data);
  }

  /**
   * Khách hàng gửi đánh giá chất lượng phục vụ của tài xế sau khi hoàn thành đơn.
   * @param data - Mã đơn, số sao đánh giá và bình luận
   */
  async reviewShipper(data: { orderId: string; rating: number; comment?: string }): Promise<IApiResponse<any>>{
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.SHIPPER.REVIEW, data);
  }

  /**
   * Lấy lịch sử biến động điểm uy tín của tài xế (cộng điểm do giao đúng giờ, trừ điểm do hủy đơn/bị khiếu nại).
   */
  async getReputationHistory(): Promise<IApiResponse<IShipperReputationHistory[]>> {
    return httpClient.get<IApiResponse<IShipperReputationHistory[]>>(API_ENDPOINTS.SHIPPER.REPUTATION_HISTORY);
  }

  /**
   * Tài xế gửi báo cáo sự cố phát sinh trong quá trình giao hàng (tai nạn, hỏng xe, sự cố quán).
   * @param orderId - Mã đơn hàng
   * @param data - Loại sự cố, tiêu đề và nội dung
   */
  async reportOrderIncident(orderId: string, data: { targetType: number, title: string, content: string }): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.SHIPPER.REPORT_INCIDENT(orderId), data);
  }

  /**
   * Tài xế gửi văn bản phản hồi giải trình sự cố đơn hàng theo yêu cầu của Điều phối viên.
   * @param orderId - Mã đơn hàng
   * @param reply - Nội dung giải trình
   */
  async submitExplanation(orderId: string, reply: string): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.SHIPPER.SUBMIT_EXPLANATION(orderId), { reply });
  }

  /**
   * Lấy lịch sử các văn bản giải trình sự cố của đơn hàng.
   * @param orderId - Mã đơn hàng
   */
  async getExplanation(orderId: string): Promise<IApiResponse<any[]>> {
    return httpClient.get<IApiResponse<any[]>>(API_ENDPOINTS.SHIPPER.GET_EXPLANATION(orderId));
  }
}

// Khởi tạo và xuất thể hiện duy nhất của ShipperService
export const shipperService = new ShipperService();
export default shipperService;
