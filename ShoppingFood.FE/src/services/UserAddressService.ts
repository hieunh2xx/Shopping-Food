import { httpClient } from './base/HttpClient';
import type { IApiResponse, IUserAddressDto, IAddUserAddress } from '../interfaces';

/**
 * Dịch vụ Quản lý Sổ địa chỉ người dùng (UserAddressService).
 * Phụ trách các thao tác: lấy danh sách địa chỉ nhận hàng, thêm mới, cập nhật, xóa và đặt địa chỉ mặc định.
 */
class UserAddressService {
  private endpoint = '/UserAddress';

  /**
   * Lấy danh sách toàn bộ các địa chỉ nhận hàng đã lưu của người dùng hiện tại.
   */
  async getAddresses(): Promise<IApiResponse<IUserAddressDto[]>> {
    return httpClient.get<IApiResponse<IUserAddressDto[]>>(this.endpoint);
  }

  /**
   * Thêm một địa chỉ nhận hàng mới vào sổ địa chỉ cá nhân.
   * @param data - Thông tin tên người nhận, SĐT, địa chỉ chi tiết, tọa độ GPS
   */
  async addAddress(data: IAddUserAddress): Promise<IApiResponse<IUserAddressDto>> {
    return httpClient.post<IApiResponse<IUserAddressDto>>(this.endpoint, data);
  }

  /**
   * Cập nhật thông tin địa chỉ đã lưu theo ID.
   * @param id - Mã địa chỉ
   * @param data - Dữ liệu cập nhật một phần
   */
  async update(id: string, data: Partial<IUserAddressDto>): Promise<IApiResponse<IUserAddressDto>> {
    return httpClient.put<IApiResponse<IUserAddressDto>>(`${this.endpoint}/${id}`, { id, ...data });
  }

  /**
   * Xóa một địa chỉ khỏi sổ địa chỉ.
   * @param id - Mã địa chỉ cần xóa
   */
  async delete(id: string): Promise<IApiResponse<any>> {
    return httpClient.delete<IApiResponse<any>>(`${this.endpoint}/${id}`);
  }

  /**
   * Đặt một địa chỉ làm địa chỉ nhận hàng mặc định khi đặt đơn.
   * @param id - Mã địa chỉ
   */
  async setDefault(id: string): Promise<IApiResponse<any>> {
    return httpClient.put<IApiResponse<any>>(`${this.endpoint}/${id}/SetDefault`, {});
  }
}

// Khởi tạo và xuất thể hiện duy nhất của UserAddressService
export const userAddressService = new UserAddressService();
