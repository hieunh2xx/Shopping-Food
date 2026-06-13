import { httpClient } from "./base/HttpClient"; 
import { API_ENDPOINTS } from "../config/endpoints";
import type { IApiResponse, IDispatchOrder } from "../interfaces";

export const CoordinatorServỉce = {
    getDispatchBoard: (status?: string, skip = 0, take = 50) => {
        const params = new URLSearchParams();
        if(status) params.append('status', status);
        params.append('skip', skip.toString());
        params.append('take', take.toString());

        return httpClient.get<IApiResponse<IDispatchOrder[]>>(`${API_ENDPOINTS.COORDINATOR.ORDERS}?${params.toString()}`);
    }
};