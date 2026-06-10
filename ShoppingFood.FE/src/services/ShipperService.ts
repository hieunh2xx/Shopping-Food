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
  IConfirmDeliverySuccessRequest
} from '../interfaces';
import type { IShipperIncomeReportDto, IShipperScheduleAndAreaDto, IUpdateShipperScheduleAndAreaRequest } from '../interfaces/IShipper';

class ShipperService {
  async toggleOnline(data: IToggleShipperOnlineRequest): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.SHIPPER.TOGGLE_ONLINE, data);
  }

  async getProposedOffer(orderId: string): Promise<IApiResponse<IProposedDeliveryOfferDto>> {
    return httpClient.get<IApiResponse<IProposedDeliveryOfferDto>>(API_ENDPOINTS.SHIPPER.PROPOSED_OFFER(orderId));
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
}

export const shipperService = new ShipperService();
export default shipperService;
