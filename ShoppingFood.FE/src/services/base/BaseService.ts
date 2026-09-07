import { httpClient } from './HttpClient';
import type { IApiResponse, IQueryParams } from '../../interfaces';

/**
 * Lớp dịch vụ cơ sở trừu tượng (Abstract Base Service) — Nền tảng OOP cho tất cả API Services.
 * 
 * Áp dụng các nguyên lý SOLID:
 * - OCP (Open/Closed Principle): Cung cấp các thao tác CRUD chuẩn có thể mở rộng mà không cần sửa đổi base.
 * - LSP (Liskov Substitution Principle): Bất kỳ lớp con nào kế thừa BaseService đều có thể thay thế cho BaseService.
 * 
 * @template TDto - Kiểu dữ liệu DTO trả về từ API backend
 * @template TCreateCmd - Kiểu dữ liệu tham số khi gửi lệnh tạo mới (Create Command)
 * @template TUpdateCmd - Kiểu dữ liệu tham số khi gửi lệnh cập nhật (Update Command)
 */
export abstract class BaseService<TDto, TCreateCmd = unknown, TUpdateCmd = unknown> {
  /**
   * Đường dẫn endpoint API (ví dụ: '/User', '/Product')
   * Bắt buộc các lớp con kế thừa phải định nghĩa
   */
  protected abstract readonly endpoint: string;

  /**
   * Gửi yêu cầu GET lấy danh sách thực thể, hỗ trợ phân trang và bộ lọc tìm kiếm.
   * @param params - Các tham số lọc, phân trang (skip, take, keyword,...)
   * @returns Phản hồi API chứa mảng thực thể DTO
   */
  async getAll(params?: IQueryParams): Promise<IApiResponse<TDto[]>> {
    return httpClient.get<IApiResponse<TDto[]>>(this.endpoint, { params });
  }

  /**
   * Gửi yêu cầu GET lấy thông tin chi tiết một thực thể theo ID.
   * @param id - Mã định danh của thực thể
   * @returns Phản hồi API chứa thông tin chi tiết thực thể
   */
  async getById(id: string): Promise<IApiResponse<TDto>> {
    return httpClient.get<IApiResponse<TDto>>(`${this.endpoint}/${id}`);
  }

  /**
   * Gửi yêu cầu POST tạo mới một thực thể.
   * @param data - Dữ liệu của thực thể mới cần tạo
   * @returns Phản hồi API chứa thực thể vừa được tạo thành công
   */
  async create(data: TCreateCmd): Promise<IApiResponse<TDto>> {
    return httpClient.post<IApiResponse<TDto>>(this.endpoint, data);
  }

  /**
   * Gửi yêu cầu PUT cập nhật thông tin thực thể hiện có theo ID.
   * @param id - Mã định danh thực thể cần cập nhật
   * @param data - Dữ liệu cập nhật mới
   * @returns Phản hồi API chứa thực thể sau khi cập nhật
   */
  async update(id: string, data: TUpdateCmd): Promise<IApiResponse<TDto>> {
    return httpClient.put<IApiResponse<TDto>>(`${this.endpoint}/${id}`, data);
  }

  /**
   * Gửi yêu cầu DELETE xóa một thực thể theo ID.
   * @param id - Mã định danh thực thể cần xóa
   * @returns Phản hồi API thông báo kết quả xóa
   */
  async remove(id: string): Promise<IApiResponse<void>> {
    return httpClient.delete<IApiResponse<void>>(`${this.endpoint}/${id}`);
  }
}
