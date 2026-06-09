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
  IUpdateShipperLocationRequest 
} from '../interfaces';

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
}

export const shipperService = new ShipperService();
export default shipperService;
