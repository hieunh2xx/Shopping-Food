import { httpClient } from './base/HttpClient';
import { API_ENDPOINTS } from '../config/endpoints';
import type {
  IApiResponse,
  ICampusDto,
  ICampusBuildingDto,
  IUpsertCampusRequest,
  IUpsertCampusBuildingRequest,
  IGroupOrderSummaryDto,
  IGroupOrderDetailDto,
  IGroupOrderMenuItemDto,
  IGroupOrderRestaurantDto,
  ICreateGroupOrderRequest,
  IJoinGroupOrderRequest,
  IAddGroupOrderItemRequest,
  IGroupOrderForOrderDto,
} from '../interfaces';

const G = API_ENDPOINTS.GROUP_ORDER;
const C = API_ENDPOINTS.CAMPUS;

class CampusService {
  async getCampuses(): Promise<IApiResponse<ICampusDto[]>> {
    return httpClient.get(C.BASE);
  }

  async adminGetCampuses(): Promise<IApiResponse<ICampusDto[]>> {
    return httpClient.get(C.ADMIN);
  }

  async createCampus(data: IUpsertCampusRequest): Promise<IApiResponse<{ id: string }>> {
    return httpClient.post(C.ADMIN, data);
  }

  async updateCampus(id: string, data: IUpsertCampusRequest): Promise<IApiResponse<{ id: string }>> {
    return httpClient.put(C.ADMIN_BY_ID(id), data);
  }

  async deleteCampus(id: string): Promise<IApiResponse<null>> {
    return httpClient.delete(C.ADMIN_BY_ID(id));
  }

  async createBuilding(campusId: string, data: IUpsertCampusBuildingRequest): Promise<IApiResponse<ICampusBuildingDto>> {
    return httpClient.post(C.ADMIN_BUILDINGS(campusId), data);
  }

  async updateBuilding(buildingId: string, data: IUpsertCampusBuildingRequest): Promise<IApiResponse<ICampusBuildingDto>> {
    return httpClient.put(C.ADMIN_BUILDING_BY_ID(buildingId), data);
  }

  async deleteBuilding(buildingId: string): Promise<IApiResponse<null>> {
    return httpClient.delete(C.ADMIN_BUILDING_BY_ID(buildingId));
  }
}

class GroupOrderService {
  async getOpen(params?: { campusId?: string; buildingId?: string; restaurantId?: string; take?: number }): Promise<IApiResponse<IGroupOrderSummaryDto[]>> {
    return httpClient.get(G.BASE, { params });
  }

  async getMine(): Promise<IApiResponse<IGroupOrderSummaryDto[]>> {
    return httpClient.get(G.MINE);
  }

  async getRestaurants(campusId: string): Promise<IApiResponse<IGroupOrderRestaurantDto[]>> {
    return httpClient.get(G.RESTAURANTS, { params: { campusId } });
  }

  async getMenu(restaurantId: string): Promise<IApiResponse<IGroupOrderMenuItemDto[]>> {
    return httpClient.get(G.MENU(restaurantId));
  }

  async getDetail(id: string): Promise<IApiResponse<IGroupOrderDetailDto>> {
    return httpClient.get(G.BY_ID(id));
  }

  async getByCode(code: string): Promise<IApiResponse<IGroupOrderDetailDto>> {
    return httpClient.get(G.BY_CODE(code));
  }

  async create(data: ICreateGroupOrderRequest): Promise<IApiResponse<IGroupOrderDetailDto>> {
    return httpClient.post(G.BASE, data);
  }

  async join(id: string, data: IJoinGroupOrderRequest): Promise<IApiResponse<IGroupOrderDetailDto>> {
    return httpClient.post(G.JOIN(id), data);
  }

  async updateMe(id: string, data: IJoinGroupOrderRequest): Promise<IApiResponse<IGroupOrderDetailDto>> {
    return httpClient.put(G.ME(id), data);
  }

  async addItem(id: string, data: IAddGroupOrderItemRequest): Promise<IApiResponse<IGroupOrderDetailDto>> {
    return httpClient.post(G.ITEMS(id), data);
  }

  async updateItem(id: string, itemId: string, quantity: number): Promise<IApiResponse<IGroupOrderDetailDto>> {
    return httpClient.put(G.ITEM(id, itemId), { quantity });
  }

  async removeItem(id: string, itemId: string): Promise<IApiResponse<IGroupOrderDetailDto>> {
    return httpClient.delete(G.ITEM(id, itemId));
  }

  async pay(id: string, forAll = false): Promise<IApiResponse<IGroupOrderDetailDto>> {
    return httpClient.post(G.PAY(id), { forAll });
  }

  async unpay(id: string, memberId?: string): Promise<IApiResponse<IGroupOrderDetailDto>> {
    return httpClient.post(G.UNPAY(id), { memberId });
  }

  async leave(id: string): Promise<IApiResponse<IGroupOrderDetailDto>> {
    return httpClient.post(G.LEAVE(id), {});
  }

  async removeMember(id: string, memberId: string): Promise<IApiResponse<IGroupOrderDetailDto>> {
    return httpClient.delete(G.MEMBER(id, memberId));
  }

  async submit(id: string): Promise<IApiResponse<IGroupOrderDetailDto>> {
    return httpClient.post(G.SUBMIT(id), {});
  }

  async cancel(id: string, reason?: string): Promise<IApiResponse<IGroupOrderDetailDto>> {
    return httpClient.post(G.CANCEL(id), { reason });
  }

  /** Thông tin gom đơn cho các Order (nhà hàng / shipper). Order không phải đơn gom sẽ không có trong kết quả. */
  async getForOrders(orderIds: string[]): Promise<IApiResponse<IGroupOrderForOrderDto[]>> {
    return httpClient.get(G.FOR_ORDERS, { params: { orderIds: orderIds.join(',') } });
  }

  async markPortionDelivered(groupOrderId: string, memberId: string, delivered = true): Promise<IApiResponse<IGroupOrderForOrderDto>> {
    return httpClient.post(G.PORTION_DELIVERED(groupOrderId, memberId), {}, { params: { delivered } });
  }
}

export const campusService = new CampusService();
export const groupOrderService = new GroupOrderService();
