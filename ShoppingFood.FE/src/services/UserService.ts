import { httpClient } from './base/HttpClient';
import { BaseService } from './base/BaseService';
import { API_ENDPOINTS } from '../config/endpoints';
import type { IUserDto, IRegisterRequest, IChangePasswordRequest, IApiResponse } from '../interfaces';

/**
 * Dịch vụ Quản trị Tài khoản người dùng (UserService).
 * Kế thừa từ BaseService<IUserDto, IRegisterRequest> để xử lý các danh sách người dùng, đổi mật khẩu và quản lý đơn đăng ký mở quán/làm tài xế.
 */
class UserService extends BaseService<IUserDto, IRegisterRequest> {
  protected readonly endpoint = API_ENDPOINTS.USER.BASE;

  /**
   * Thay đổi mật khẩu tài khoản người dùng.
   * @param data - Mật khẩu cũ và mật khẩu mới
   */
  async changePassword(data: IChangePasswordRequest): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.USER.CHANGE_PASSWORD, data);
  }

  /**
   * Lấy lịch sử các đơn khiếu nại của một người dùng cụ thể (dành cho Admin).
   * @param userId - Mã người dùng
   */
  async getUserComplaintHistory(userId: string): Promise<IApiResponse<any>> {
    return httpClient.get<IApiResponse<any>>(`/Admin/users/${userId}/complaints`);
  }

  /**
   * Lấy danh sách các đơn đăng ký (Seller/Shipper) của chính người dùng hiện tại.
   */
  async getMyApplications(): Promise<IApiResponse<any>> {
    return httpClient.get<IApiResponse<any>>(API_ENDPOINTS.USER.MY_APPLICATIONS);
  }

  /**
   * Cập nhật thông tin đơn đăng ký mở gian hàng Người bán hàng.
   * @param data - Dữ liệu cập nhật
   */
  async updateSellerApplication(data: any): Promise<IApiResponse<any>> {
    return httpClient.put<IApiResponse<any>>(API_ENDPOINTS.USER.UPDATE_SELLER_APPLICATION, data);
  }

  /**
   * Cập nhật thông tin đơn đăng ký làm Tài xế (Shipper).
   * @param data - Dữ liệu cập nhật
   */
  async updateShipperApplication(data: any): Promise<IApiResponse<any>> {
    return httpClient.put<IApiResponse<any>>(API_ENDPOINTS.USER.UPDATE_SHIPPER_APPLICATION, data);
  }
}

// Khởi tạo và xuất thể hiện duy nhất của UserService
export const userService = new UserService();
