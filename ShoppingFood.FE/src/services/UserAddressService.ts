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

  async updateAddress(id: string, data: IAddUserAddress): Promise<IApiResponse<IUserAddressDto>> {
    return httpClient.put<IApiResponse<IUserAddressDto>>(`${this.endpoint}/${id}`, { id, ...data });
  }

  async deleteAddress(id: string): Promise<IApiResponse<any>> {
    return httpClient.delete<IApiResponse<any>>(`${this.endpoint}/${id}`);
  }

  async setDefaultAddress(id: string): Promise<IApiResponse<any>> {
    return httpClient.put<IApiResponse<any>>(`${this.endpoint}/${id}/SetDefault`, {});
  }
}

export const userAddressService = new UserAddressService();
