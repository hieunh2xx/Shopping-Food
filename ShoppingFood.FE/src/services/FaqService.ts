import { httpClient } from './base/HttpClient';
import { API_ENDPOINTS } from '../config/endpoints';
import type { IApiResponse, IFaqDto, ICreateFaqRequest, IUpdateFaqRequest } from '../interfaces';

/**
 * Dịch vụ Câu hỏi thường gặp (FaqService).
 * Quản lý danh mục các câu hỏi trợ giúp thường gặp (FAQ) cho khách hàng và đối tác.
 */
class FaqService {
  /**
   * Lấy danh sách các câu hỏi thường gặp FAQ (có thể lọc theo trạng thái kích hoạt).
   * @param params - Tham số lọc (isActive)
   */
  async getList(params?: { isActive?: boolean }): Promise<IApiResponse<IFaqDto[]>> {
    return httpClient.get<IApiResponse<IFaqDto[]>>(API_ENDPOINTS.FAQ.BASE, { params });
  }

  /**
   * Lấy thông tin chi tiết một câu hỏi thường gặp theo ID.
   * @param id - Mã câu hỏi FAQ
   */
  async getDetail(id: string): Promise<IApiResponse<IFaqDto>> {
    return httpClient.get<IApiResponse<IFaqDto>>(API_ENDPOINTS.FAQ.BY_ID(id));
  }

  /**
   * Tạo mới một câu hỏi thường gặp FAQ (dành cho Admin).
   * @param data - Nội dung câu hỏi và câu trả lời
   */
  async create(data: ICreateFaqRequest): Promise<IApiResponse<IFaqDto>> {
    return httpClient.post<IApiResponse<IFaqDto>>(API_ENDPOINTS.FAQ.BASE, data);
  }

  /**
   * Cập nhật nội dung câu hỏi thường gặp theo ID.
   * @param id - Mã câu hỏi FAQ
   * @param data - Dữ liệu cập nhật
   */
  async update(id: string, data: IUpdateFaqRequest): Promise<IApiResponse<IFaqDto>> {
    return httpClient.put<IApiResponse<IFaqDto>>(API_ENDPOINTS.FAQ.BY_ID(id), data);
  }

  /**
   * Xóa một câu hỏi thường gặp khỏi hệ thống.
   * @param id - Mã câu hỏi cần xóa
   */
  async delete(id: string): Promise<IApiResponse<any>> {
    return httpClient.delete<IApiResponse<any>>(API_ENDPOINTS.FAQ.BY_ID(id));
  }
}

// Khởi tạo và xuất thể hiện duy nhất của FaqService
export const faqService = new FaqService();
