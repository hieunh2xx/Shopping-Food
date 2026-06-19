import { httpClient } from "./base/HttpClient"; 
import { BaseService } from "./base/BaseService";
import { API_ENDPOINTS } from "../config/endpoints";
import type { ISuggestedShipper, IApiResponse, IDispatchOrder, ISendProposalRequest, IForceAssignRequest, IReleaseOrderRequest, IMonitorShipperDto, ISuspendShipperRequest } from "../interfaces";

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

  async resolveIncident(orderId: string): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.COORDINATOR.RESOLVE_INCIDENT(orderId));
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
}

export const coordinatorService = new CoordinatorService();
