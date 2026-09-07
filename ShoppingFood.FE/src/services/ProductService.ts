import { httpClient } from './base/HttpClient';
import { BaseService } from './base/BaseService';
import { API_ENDPOINTS } from '../config/endpoints';
import type {
  IApiResponse,
  IProductDto,
  IAddProductRequest,
  IUpdateProductRequest,
  IUpdateStockStatusRequest,
  IToggleVisibilityRequest,
  IUpdateAvailabilityRequest,
  ISearchProductQuery,
  IMenuCategoryDto,
  IProductReviewDto,
  IProductRecommendationDto,
} from '../interfaces';

/**
 * Dịch vụ Quản lý Món ăn & Sản phẩm (ProductService).
 * Kế thừa từ BaseService<IProductDto, IAddProductRequest, IUpdateProductRequest>.
 * Chịu trách nhiệm:
 * - Tìm kiếm món ăn có lọc đa tiêu chí, sản phẩm bán chạy (Best Sellers), gợi ý món theo vị trí
 * - Cập nhật trạng thái kho hàng, ẩn/hiển thị món ăn, khung giờ bán trong ngày
 * - Đánh giá món ăn của khách, phản hồi đánh giá của người bán và báo cáo vi phạm sản phẩm
 */
class ProductService extends BaseService<IProductDto, IAddProductRequest, IUpdateProductRequest> {
  protected readonly endpoint = API_ENDPOINTS.PRODUCT.BASE;

  /**
   * Tìm kiếm sản phẩm theo từ khóa, danh mục, khoảng giá, sắp xếp và phân trang.
   * @param query - Các tiêu chí tìm kiếm sản phẩm
   */
  async search(query: ISearchProductQuery): Promise<IApiResponse<IProductDto[]>> {
    return httpClient.get<IApiResponse<IProductDto[]>>(API_ENDPOINTS.PRODUCT.SEARCH, { params: query });
  }

  /**
   * Lấy danh sách các món ăn bán chạy nhất toàn sàn (Best Sellers).
   * @param take - Số lượng món cần lấy (mặc định 10)
   */
  async getBestSellers(take: number = 10): Promise<IApiResponse<IProductDto[]>> {
    return httpClient.get<IApiResponse<IProductDto[]>>(API_ENDPOINTS.PRODUCT.BEST_SELLERS, { params: { take } });
  }

  /**
   * Lấy danh sách sản phẩm gợi ý thông minh dựa trên vị trí GPS người dùng và hành vi đặt hàng.
   * @param params - Tọa độ vị trí người dùng (vĩ độ, kinh độ) và số lượng lấy
   */
  async getRecommendations(params?: { latitude?: number; longitude?: number; take?: number }): Promise<IApiResponse<IProductRecommendationDto[]>> {
    return httpClient.get<IApiResponse<IProductRecommendationDto[]>>(API_ENDPOINTS.PRODUCT.RECOMMENDATIONS, { params });
  }

  /**
   * Lấy danh sách các danh mục món ăn.
   */
  async getCategories(): Promise<IApiResponse<IMenuCategoryDto[]>> {
    return httpClient.get<IApiResponse<IMenuCategoryDto[]>>(API_ENDPOINTS.PRODUCT.CATEGORIES);
  }

  /**
   * Cập nhật trạng thái còn hàng hoặc hết hàng (Stock Status) của món ăn.
   * @param data - Mã món và trạng thái kho (InStock/OutOfStock)
   */
  async updateStockStatus(data: IUpdateStockStatusRequest): Promise<IApiResponse<IProductDto>> {
    return httpClient.patch<IApiResponse<IProductDto>>(
      API_ENDPOINTS.PRODUCT.STOCK_STATUS(data.id),
      data
    );
  }

  /**
   * Bật hoặc tắt trạng thái ẩn/hiển thị món ăn trên thực đơn nhà hàng.
   * @param data - Mã món và cờ isVisible
   */
  async toggleVisibility(data: IToggleVisibilityRequest): Promise<IApiResponse<IProductDto>> {
    return httpClient.patch<IApiResponse<IProductDto>>(
      API_ENDPOINTS.PRODUCT.VISIBILITY(data.id),
      data
    );
  }

  /**
   * Cập nhật khung giờ mở bán trong ngày của món ăn (ví dụ: chỉ bán buổi sáng từ 06:00 đến 10:00).
   * @param data - Mã món, giờ bắt đầu và giờ kết thúc
   */
  async updateAvailability(data: IUpdateAvailabilityRequest): Promise<IApiResponse<IProductDto>> {
    return httpClient.patch<IApiResponse<IProductDto>>(
      API_ENDPOINTS.PRODUCT.AVAILABILITY(data.id),
      data
    );
  }

  /**
   * Gửi báo cáo vi phạm đối với một sản phẩm món ăn (chứa hàng cấm, sai thông tin,...).
   * @param data - Mã sản phẩm, lý do báo cáo và mô tả chi tiết
   */
  async reportProduct(data: { productId: string; reason: string; description?: string }): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.PRODUCT.REPORT, data);
  }

  /**
   * Lấy danh sách các bài đánh giá nhận xét của khách hàng đối với một sản phẩm cụ thể.
   * @param productId - Mã sản phẩm
   * @param skip - Bỏ qua
   * @param take - Số lượng lấy
   */
  async getProductReviews(productId: string, skip = 0, take = 20): Promise<IApiResponse<IProductReviewDto[]>> {
    return httpClient.get<IApiResponse<IProductReviewDto[]>>(API_ENDPOINTS.PRODUCT.REVIEWS(productId), { params: { skip, take } });
  }

  /**
   * Lấy danh sách tất cả các đánh giá của các món ăn thuộc quán của Người bán.
   * @param skip - Bỏ qua
   * @param take - Số lượng lấy
   */
  async getSellerReviews(skip = 0, take = 50): Promise<IApiResponse<IProductReviewDto[]>> {
    return httpClient.get<IApiResponse<IProductReviewDto[]>>(API_ENDPOINTS.PRODUCT.SELLER_REVIEWS, { params: { skip, take } });
  }

  /**
   * Gửi đánh giá sao (1-5 sao) và bình luận cho món ăn sau khi đã nhận hàng thành công.
   * @param data - Mã sản phẩm, số sao và bình luận
   */
  async reviewProduct(data: { productId: string; rating: number; comment?: string }): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.PRODUCT.REVIEW, data);
  }

  /**
   * Người bán gửi phản hồi trả lời đánh giá của khách hàng.
   * @param reviewId - Mã đánh giá
   * @param reply - Nội dung phản hồi
   */
  async replyReview(reviewId: string, reply: string): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.PRODUCT.REVIEW_REPLY(reviewId), { reply });
  }

  /**
   * Báo cáo một bài đánh giá vi phạm (chửi bới, xúc phạm, sai sự thật).
   * @param reviewId - Mã đánh giá
   * @param reason - Lý do báo cáo
   */
  async reportReview(reviewId: string, reason: string): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.PRODUCT.REVIEW_REPORT(reviewId), { reason });
  }
}

// Khởi tạo và xuất thể hiện duy nhất của ProductService
export const productService = new ProductService();
