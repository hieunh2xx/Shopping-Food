import { httpClient } from './base/HttpClient';
import { BaseService } from './base/BaseService';
import { API_ENDPOINTS } from '../config/endpoints';
import type { IApiResponse, IUserDto, ILoginRequest, ILoginGoogleRequest, ILoginMicrosoftRequest, ILoginResponse, IRegisterRequest, IRegisterSellerRequest } from '../interfaces';

/**
 * Dịch vụ Xác thực & Quản lý Tài khoản người dùng (AuthService).
 * Kế thừa từ BaseService<IUserDto> và mở rộng các phương thức đặc thù cho việc đăng nhập, đăng ký, OTP, đổi mật khẩu và cập nhật hồ sơ.
 */
class AuthService extends BaseService<IUserDto, IRegisterRequest> {
  protected readonly endpoint = API_ENDPOINTS.USER.BASE;

  /**
   * Đăng nhập hệ thống bằng tên đăng nhập / mật khẩu.
   * @param credentials - Thông tin đăng nhập (username/email và password)
   * @returns Dữ liệu phản hồi đăng nhập chứa token hoặc mã yêu cầu xác thực OTP/AccountLocked
   */
  async login(credentials: ILoginRequest): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.AUTH.LOGIN, credentials);
  }

  /**
   * Đăng nhập thông qua tài khoản Google OAuth (sử dụng Google ID Token).
   * @param credentials - Đối tượng chứa credential token từ Google
   * @returns Phản hồi đăng nhập chứa token JWT và thông tin user
   */
  async loginGoogle(credentials: ILoginGoogleRequest): Promise<IApiResponse<ILoginResponse>> {
    return httpClient.post<IApiResponse<ILoginResponse>>(API_ENDPOINTS.AUTH.LOGIN_GOOGLE, credentials);
  }

  /**
   * Đăng nhập thông qua tài khoản Microsoft OAuth (SSO).
   * @param credentials - Đối tượng chứa access token của Microsoft
   * @returns Phản hồi đăng nhập chứa token JWT và thông tin user
   */
  async loginMicrosoft(credentials: ILoginMicrosoftRequest): Promise<IApiResponse<ILoginResponse>> {
    return httpClient.post<IApiResponse<ILoginResponse>>(API_ENDPOINTS.AUTH.LOGIN_MICROSOFT, credentials);
  }

  /**
   * Đăng nhập bằng số điện thoại thông qua Firebase Phone Authentication ID Token.
   * @param data - Chứa idToken do Firebase cấp sau khi verify SMS OTP
   * @returns Phản hồi đăng nhập chứa token và thông tin người dùng
   */
  async loginFirebasePhone(data: { idToken: string }): Promise<IApiResponse<ILoginResponse>> {
    return httpClient.post<IApiResponse<ILoginResponse>>('/User/LoginFirebasePhone', data);
  }

  /**
   * Yêu cầu gửi mã OTP đăng nhập qua kênh Email hoặc SMS.
   * @param data - Gồm preAuthToken tạm thời và phương thức nhận OTP ('Email' hoặc 'SMS')
   */
  async sendLoginOtp(data: { preAuthToken: string, method: string }): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>('/User/SendLoginOtp', data);
  }

  /**
   * Gửi mã OTP xác thực tới số điện thoại.
   * @param data - Đối tượng chứa số điện thoại nhận OTP
   */
  async sendOtp(data: { phone: string }): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>('/User/SendOtp', data);
  }

  /**
   * Xác thực mã OTP đăng nhập hai lớp (2FA) sau khi đã đăng nhập bước 1.
   * @param data - Gồm preAuthToken và otpCode người dùng nhập
   * @returns Token xác thực chính thức và thông tin người dùng
   */
  async verifyLoginOtp(data: { preAuthToken: string, otpCode: string }): Promise<IApiResponse<ILoginResponse>> {
    return httpClient.post<IApiResponse<ILoginResponse>>('/User/VerifyLoginOtp', data);
  }

  /**
   * Làm mới JWT token truy cập khi token hiện tại sắp hoặc đã hết hạn.
   * @param token - Access token hiện tại
   * @returns Cặp token mới
   */
  async refreshToken(token: string): Promise<IApiResponse<ILoginResponse>> {
    return httpClient.post<IApiResponse<ILoginResponse>>('/User/RefreshToken', { token, refreshToken: "" });
  }

  /**
   * Đăng xuất tài khoản khỏi hệ thống và vô hiệu hóa phiên làm việc trên server.
   */
  async logout(): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>('/User/Logout');
  }

  /**
   * Đăng ký tài khoản người dùng mới (vai trò Khách hàng).
   * @param data - Thông tin đăng ký tài khoản
   */
  async register(data: IRegisterRequest): Promise<IApiResponse<IUserDto>> {
    return httpClient.post<IApiResponse<IUserDto>>(API_ENDPOINTS.AUTH.REGISTER, data);
  }

  /**
   * Đăng ký tài khoản trực tiếp với vai trò Người bán hàng (Seller) kèm thông tin cửa hàng.
   * @param data - Thông tin đăng ký người bán
   */
  async registerSeller(data: IRegisterSellerRequest): Promise<IApiResponse<IUserDto>> {
    return httpClient.post<IApiResponse<IUserDto>>(API_ENDPOINTS.AUTH.REGISTER_SELLER, data);
  }

  /**
   * Đăng ký tài khoản trực tiếp với vai trò Tài xế (Shipper) kèm thông tin xe và hồ sơ.
   * @param data - Dữ liệu đăng ký shipper
   */
  async registerShipper(data: any): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.USER.REGISTER_SHIPPER, data);
  }

  /**
   * Gửi hồ sơ đăng ký trở thành Người bán hàng (Seller) từ tài khoản khách hàng hiện tại.
   * @param data - Thông tin kinh doanh, giấy phép và ảnh cửa hàng
   */
  async applySeller(data: { businessName: string, businessAddress: string, contactInfo: string, businessLicenseUrl: string, foodSafetyCertificateUrl: string, shopImageUrl: string }): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>('/User/ApplySeller', data);
  }

  /**
   * Gửi hồ sơ đăng ký trở thành Tài xế (Shipper) từ tài khoản khách hàng hiện tại.
   * @param data - Thông tin phương tiện, GPLX, CCCD và khu vực hoạt động
   */
  async applyShipper(data: any): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>('/User/apply-shipper', data);
  }

  /**
   * Kiểm tra trạng thái hồ sơ đăng ký Người bán hàng (Seller Application Status).
   * @returns Trạng thái hồ sơ: Pending, Approved, Rejected,...
   */
  async getSellerApplicationStatus(): Promise<IApiResponse<any>> {
    return httpClient.get<IApiResponse<any>>(API_ENDPOINTS.USER.SELLER_APPLICATION_STATUS);
  }

  /**
   * Cập nhật hoặc bổ sung lại hồ sơ đăng ký Người bán hàng khi được yêu cầu chỉnh sửa.
   * @param data - Thông tin hồ sơ cập nhật
   */
  async updateSellerApplication(data: { id: string; businessName: string; businessAddress: string; businessLicenseUrl: string; foodSafetyCertificateUrl?: string; shopImageUrl: string; contactInfo: string }): Promise<IApiResponse<any>> {
    return httpClient.put<IApiResponse<any>>(API_ENDPOINTS.USER.UPDATE_SELLER_APPLICATION, data);
  }

  /**
   * Gửi yêu cầu nâng cấp cửa hàng từ Seller thông thường lên Mall (Cửa hàng chính hãng).
   * @param reason - Lý do xin nâng cấp lên Mall
   */
  async upgradeToMall(reason: string): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.ROLE.UPGRADE_TO_MALL, { reason });
  }

  /**
   * Lấy thông tin chi tiết hồ sơ cá nhân của người dùng hiện tại đang đăng nhập.
   * @returns Dữ liệu hồ sơ người dùng
   */
  async getProfile(): Promise<IApiResponse<IUserDto>> {
    return httpClient.get<IApiResponse<IUserDto>>(API_ENDPOINTS.USER.PROFILE);
  }

  /**
   * Tải lên ảnh đại diện (avatar) của người dùng lên server (hỗ trợ multipart form data).
   * @param file - File hình ảnh cần tải lên
   * @returns Đường dẫn ảnh đại diện sau khi upload thành công
   */
  async uploadAvatar(file: File): Promise<IApiResponse<{ avatarUrl: string }>> {
    const formData = new FormData();
    formData.append('file', file);
    return httpClient.post<IApiResponse<{ avatarUrl: string }>>('/User/UploadAvatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  /**
   * Tải lên hình ảnh tài liệu/sản phẩm lên server.
   * @param file - File hình ảnh hoặc tài liệu
   * @returns Đường dẫn URL của file sau khi tải lên
   */
  async uploadImage(file: File): Promise<IApiResponse<{ imageUrl: string }>> {
    const formData = new FormData();
    formData.append('file', file);
    return httpClient.post<IApiResponse<{ imageUrl: string }>>('/User/UploadImage', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  /**
   * Gửi yêu cầu quên mật khẩu tới địa chỉ email đăng ký để nhận mã OTP đặt lại mật khẩu.
   * @param data - Địa chỉ email của tài khoản
   */
  async forgotPassword(data: { email: string }): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>('/User/ForgotPassword', data);
  }

  /**
   * Xác thực mã OTP đặt lại mật khẩu đã gửi qua email.
   * @param data - Email và mã OTP nhận được
   */
  async verifyResetOtp(data: { email: string; otpCode: string }): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>('/User/VerifyResetOtp', data);
  }

  /**
   * Đặt lại mật khẩu mới cho tài khoản sau khi đã xác thực OTP thành công.
   * @param data - Gồm email, mã OTP và mật khẩu mới
   */
  async resetPassword(data: { email: string; otpCode: string; newPassword: string }): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>('/User/ResetPassword', data);
  }

  /**
   * Đổi mật khẩu tài khoản khi đang đăng nhập.
   * @param data - Gồm mật khẩu cũ và mật khẩu mới
   */
  async changePassword(data: { oldPassword: string; newPassword: string }): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>('/User/ChangePassword', data);
  }

  /**
   * Cập nhật thông tin hồ sơ cơ bản (Họ tên, SĐT, avatar, giới tính, ngày sinh).
   * @param data - Thông tin cần cập nhật
   */
  async updateProfile(data: { fullName?: string; phone?: string; avatarUrl?: string; gender?: string; dateOfBirth?: string }): Promise<IApiResponse<any>> {
    return httpClient.put<IApiResponse<any>>('/User/UpdateProfile', data);
  }

  /**
   * Yêu cầu gửi mã OTP để thay đổi thông tin liên hệ bảo mật (Email hoặc SĐT mới).
   * @param data - Email mới hoặc Số điện thoại mới
   */
  async requestUpdateContact(data: { newEmail?: string; newPhone?: string }): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>('/User/RequestUpdateContact', data);
  }

  /**
   * Xác thực mã OTP để hoàn tất thay đổi email hoặc số điện thoại mới.
   * @param data - Email/SĐT mới và mã OTP
   */
  async verifyUpdateContact(data: { newEmail?: string; newPhone?: string; otpCode: string }): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>('/User/VerifyUpdateContact', data);
  }

  /**
   * Tự chủ động khóa tài khoản tạm thời để bảo vệ an toàn.
   */
  async lockAccount(): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>('/User/LockAccount');
  }

  /**
   * Xác thực mã OTP để mở khóa tài khoản bị tạm khóa.
   * @param data - Gồm preAuthToken và mã OTP mở khóa
   */
  async verifyUnlockAccount(data: { preAuthToken: string; otpCode: string }): Promise<IApiResponse<ILoginResponse>> {
    return httpClient.post<IApiResponse<ILoginResponse>>('/User/VerifyUnlockAccount', data);
  }

  /**
   * Gửi yêu cầu xóa tài khoản vĩnh viễn khỏi hệ thống.
   */
  async requestDeletion(): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>('/User/RequestDeletion');
  }
}

// Khởi tạo và xuất thể hiện duy nhất của AuthService
export const authService = new AuthService();
