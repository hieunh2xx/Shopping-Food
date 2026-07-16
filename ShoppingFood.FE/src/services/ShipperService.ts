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
  IUpdateShipperLocationRequest,
  IConfirmDeliveryFailedRequest,
  IConfirmDeliverySuccessRequest,
  IShipperReputationHistory
} from '../interfaces';
import type { IRejectDeliveryOfferRequest, IShipperIncomeReportDto, IShipperScheduleAndAreaDto, IUpdateShipperScheduleAndAreaRequest } from '../interfaces/IShipper';

class ShipperService {
  async toggleOnline(data: IToggleShipperOnlineRequest): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.SHIPPER.TOGGLE_ONLINE, data);
  }

  async getProposedOffer(orderId: string, latitude: number, longitude: number): Promise<IApiResponse<IProposedDeliveryOfferDto>> {
    return httpClient.get<IApiResponse<IProposedDeliveryOfferDto>>(`${API_ENDPOINTS.SHIPPER.PROPOSED_OFFER(orderId)}?latitude=${latitude}&longitude=${longitude}`);
  }

  async acceptOffer(data: IAcceptDeliveryOfferRequest): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.SHIPPER.ACCEPT_OFFER, data);
  }

  async confirmArrived(data: IConfirmArrivedRequest): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.SHIPPER.CONFIRM_ARRIVED, data);
  }

  async confirmPickedUp(data: IConfirmPickedUpRequest): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.SHIPPER.CONFIRM_PICKED_UP, data);
  }

  async updateLocation(data: IUpdateShipperLocationRequest): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.SHIPPER.LOCATION, data);
  }

  async getDeliveryRoute(orderId: string): Promise<IApiResponse<IDeliveryRouteDto>> {
    return httpClient.get<IApiResponse<IDeliveryRouteDto>>(API_ENDPOINTS.SHIPPER.DELIVERY_ROUTE(orderId));
  }

  async confirmDelivered(data: IConfirmDeliverySuccessRequest) : Promise<IApiResponse<any>>{
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.SHIPPER.CONFIRM_DELIVERED, data);
  }

  async confirmFailed(data: IConfirmDeliveryFailedRequest): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.SHIPPER.CONFIRM_FAILED, data);
  }

  async getIncomeReport(startDate?: string, endDate?: string): Promise<IApiResponse<IShipperIncomeReportDto>>{
    const params = new URLSearchParams();
    if(startDate) params.append('startDate', startDate);
    if(endDate) params.append('endDate', endDate);
    return httpClient.get<IApiResponse<IShipperIncomeReportDto>>(`${API_ENDPOINTS.SHIPPER.INCOME_REPORT}?${params.toString()}`)
  }

  async getScheduleAndArea(): Promise<IApiResponse<IShipperScheduleAndAreaDto>>{
    return httpClient.get<IApiResponse<IShipperScheduleAndAreaDto>>(API_ENDPOINTS.SHIPPER.SCHEDULE_AREA)
  }

  async updateScheduleAndArea(data: IUpdateShipperScheduleAndAreaRequest): Promise<IApiResponse<any>> {
    return httpClient.put<IApiResponse<any>>(API_ENDPOINTS.SHIPPER.SCHEDULE_AREA, data);
  }

  async getAvailableOffers(latitude: number, longitude: number): Promise<IApiResponse<IProposedDeliveryOfferDto[]>>{
    return httpClient.get<IApiResponse<IProposedDeliveryOfferDto[]>>(`${API_ENDPOINTS.SHIPPER.AVAILABLE_OFFERS}?latitude=${latitude}&longitude=${longitude}`);
  }

  async rejectOffer(data: IRejectDeliveryOfferRequest): Promise<IApiResponse<any>>{
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.SHIPPER.REJECT_OFFER, data);
  }

  async reviewShipper(data: { orderId: string; rating: number; comment?: string }): Promise<IApiResponse<any>>{
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.SHIPPER.REVIEW, data);
  }

  async getReputationHistory(): Promise<IApiResponse<IShipperReputationHistory[]>> {
    return httpClient.get<IApiResponse<IShipperReputationHistory[]>>(API_ENDPOINTS.SHIPPER.REPUTATION_HISTORY);
  }

  async reportOrderIncident(orderId: string, data: { targetType: number, title: string, content: string }): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.SHIPPER.REPORT_INCIDENT(orderId), data);
  }
}

export const shipperService = new ShipperService();
export default shipperService;
