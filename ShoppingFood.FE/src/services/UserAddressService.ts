import { httpClient } from './base/HttpClient';
import type { IApiResponse, IUserAddressDto, IAddUserAddress } from '../interfaces';

class UserAddressService {
  private endpoint = '/UserAddress';

  async getAddresses(): Promise<IApiResponse<IUserAddressDto[]>> {
    return httpClient.get<IApiResponse<IUserAddressDto[]>>(this.endpoint);
  }

  async addAddress(data: IAddUserAddress): Promise<IApiResponse<IUserAddressDto>> {
    return httpClient.post<IApiResponse<IUserAddressDto>>(this.endpoint, data);
  }

  async update(id: string, data: Partial<IUserAddressDto>): Promise<IApiResponse<IUserAddressDto>> {
    return httpClient.put<IApiResponse<IUserAddressDto>>(`${this.endpoint}/${id}`, { id, ...data });
  }

  async delete(id: string): Promise<IApiResponse<any>> {
    return httpClient.delete<IApiResponse<any>>(`${this.endpoint}/${id}`);
  }

  async setDefault(id: string): Promise<IApiResponse<any>> {
    return httpClient.put<IApiResponse<any>>(API_ENDPOINTS.USER_ADDRESS.SET_DEFAULT(id), {});
  }
}

export const userAddressService = new UserAddressService();
