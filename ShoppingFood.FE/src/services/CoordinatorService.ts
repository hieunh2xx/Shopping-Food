import { httpClient } from "./base/HttpClient"; 
import { BaseService } from "./base/BaseService";
import { API_ENDPOINTS } from "../config/endpoints";
import type { ISuggestedShipper, IApiResponse, IDispatchOrder, ISendProposalRequest, IForceAssignRequest, IReleaseOrderRequest, IMonitorShipperDto, ISuspendShipperRequest, IIncidentItemDto, IResolveIncidentRequest } from "../interfaces";

class CoordinatorService extends BaseService<any, any, any> {
  protected readonly endpoint = API_ENDPOINTS.COORDINATOR.BASE;

  async getDispatchBoard(status?: string, skip = 0, take = 50, isEscalated?: boolean): Promise<IApiResponse<IDispatchOrder[]>> {
    const params: Record<string, any> = { skip, take };
    if (status) params.status = status;
    if (isEscalated !== undefined) params.isEscalated = isEscalated;

    return httpClient.get<IApiResponse<IDispatchOrder[]>>(API_ENDPOINTS.COORDINATOR.ORDERS, { params });
  }

  async getSuggestedShippers(orderId: string): Promise<IApiResponse<ISuggestedShipper[]>> {
    return httpClient.get<IApiResponse<ISuggestedShipper[]>>(API_ENDPOINTS.COORDINATOR.SUGGESTED_SHIPPERS(orderId));
  }

  async sendProposal(data: ISendProposalRequest): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.COORDINATOR.SEND_PROPOSAL, data);
  }

  async forceAssign(data: IForceAssignRequest): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.COORDINATOR.FORCE_ASSIGN, data);
  }

  async broadcastOrder(orderId: string): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.COORDINATOR.BROADCAST(orderId), {});
  }

  async resolveIncident(orderId: string, data: any): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.COORDINATOR.RESOLVE_INCIDENT(orderId), data);
  }

  async releaseOrder(orderId: string, data: IReleaseOrderRequest): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.COORDINATOR.RELEASE_ORDER(orderId), data);
  }

  async getMonitorShippers(isOnline?: boolean, searchName?: string): Promise<IApiResponse<IMonitorShipperDto[]>> {
    const params: Record<string, any> = {};
    if (isOnline !== undefined) params.isOnline = isOnline;
    if (searchName) params.searchName = searchName;

    return httpClient.get<IApiResponse<IMonitorShipperDto[]>>(
      API_ENDPOINTS.COORDINATOR.MONITOR_SHIPPERS,
      { params }
    );
  }

  async suspendShipper(shipperId: string, data: ISuspendShipperRequest): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(
      API_ENDPOINTS.COORDINATOR.SUSPEND_SHIPPER(shipperId),
      data
    );
  }

  async getDispatchHistory(orderId: string): Promise<IApiResponse<any[]>> {
    return httpClient.get<IApiResponse<any[]>>(API_ENDPOINTS.COORDINATOR.ORDER_DISPATCH_HISTORY(orderId));
  }

  async getAllDispatchHistories(params?: {
    orderId?: string;
    actionType?: string;
    filter?: string;
    skip?: number;
    take?: number;
  }): Promise<IApiResponse<any[]>> {
    return httpClient.get<IApiResponse<any[]>>(API_ENDPOINTS.COORDINATOR.DISPATCH_HISTORY, { params });
  }

  async getIncidents(type?: string, skip = 0, take = 50): Promise<IApiResponse<IIncidentItemDto[]>> {
    return httpClient.get<IApiResponse<IIncidentItemDto[]>>(API_ENDPOINTS.COORDINATOR.INCIDENTS, { params: { incidentType: type, skip, take } });
  }

  async requestExplanation(orderId: string, message: string): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.COORDINATOR.REQUEST_EXPLANATION(orderId), { message });
  }

  async getOrderExplanation(orderId: string): Promise<IApiResponse<any[]>> {
    return httpClient.get<IApiResponse<any[]>>(API_ENDPOINTS.COORDINATOR.GET_EXPLANATION(orderId));
  }

  async resolveComplaint(reportId: string, data: IResolveIncidentRequest): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.COORDINATOR.RESOLVE_COMPLAINT(reportId), data);
  }

  async adjustShipperReputation(shipperId: string, data: { points: number, reason: string }): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.COORDINATOR.ADJUST_SHIPPER_REPUTATION(shipperId), data);
  }

  async getOrderComplaints(status?: string, skip = 0, take = 20): Promise<IApiResponse<any[]>> {
    return httpClient.get<IApiResponse<any[]>>(API_ENDPOINTS.COORDINATOR.ORDER_COMPLAINTS, { params: { status, skip, take } });
  }
}

export const coordinatorService = new CoordinatorService();
