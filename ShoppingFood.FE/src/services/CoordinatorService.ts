import { httpClient } from "./base/HttpClient"; 
import { API_ENDPOINTS } from "../config/endpoints";
import type { ISuggestedShipper, IApiResponse, IDispatchOrder, ISendProposalRequest, IForceAssignRequest } from "../interfaces";
import { data } from "react-router-dom";


export const CoordinatorServỉce = {
    getDispatchBoard: (status?: string, skip = 0, take = 50) => {
        const params = new URLSearchParams();
        if(status) params.append('status', status);
        params.append('skip', skip.toString());
        params.append('take', take.toString());

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
};