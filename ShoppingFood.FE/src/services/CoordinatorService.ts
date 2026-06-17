import { httpClient } from "./base/HttpClient"; 
import { API_ENDPOINTS } from "../config/endpoints";
import type { ISuggestedShipper, IApiResponse, IDispatchOrder, ISendProposalRequest, IForceAssignRequest, IReleaseOrderRequest, IMonitorShipperDto, ISuspendShipperRequest } from "../interfaces";
import { data } from "react-router-dom";


export const coordinatorServỉce = {
    getDispatchBoard: (status?: string, skip = 0, take = 50, isEscalated?: boolean) => {
        const params = new URLSearchParams();
        if(status) params.append('status', status);
        params.append('skip', skip.toString());
        params.append('take', take.toString());
        if(isEscalated != undefined) params.append('isEscalated', isEscalated.toString());

        return httpClient.get<IApiResponse<IDispatchOrder[]>>(`${API_ENDPOINTS.COORDINATOR.ORDERS}?${params.toString()}`);
    },

    getSuggestedShippers: (orderId: string) => {
        return httpClient.get<IApiResponse<ISuggestedShipper[]>>(API_ENDPOINTS.COORDINATOR.SUGGESTED_SHIPPERS(orderId));
    },

    sendProposal: (data: ISendProposalRequest) => {
        return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.COORDINATOR.SEND_PROPOSAL, data);
    },

    forceAssign: (data: IForceAssignRequest) => {
        return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.COORDINATOR.FORCE_ASSIGN, data);
    },

    resolveIncident: (orderId: string) => {
        return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.COORDINATOR.RESOLVE_INCIDENT(orderId), data);
    },

    releaseOrder: (orderId: string, data: IReleaseOrderRequest) => {
        return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.COORDINATOR.RELEASE_ORDER(orderId), data);
    },

    getMonitorShippers: (isOnline?: boolean, searchName?: string) => {
        const params = new URLSearchParams();
        if (isOnline !== undefined) params.append('isOnline', isOnline.toString());
        if (searchName) params.append('searchName', searchName);
        return httpClient.get<IApiResponse<IMonitorShipperDto[]>>(
            `${API_ENDPOINTS.COORDINATOR.MONITOR_SHIPPERS}?${params.toString()}`
        );
    },

    suspendShipper: (shipperId: string, data: ISuspendShipperRequest) => {
        return httpClient.post<IApiResponse<any>>(
            API_ENDPOINTS.COORDINATOR.SUSPEND_SHIPPER(shipperId),
            data
        );
    }
};