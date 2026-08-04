import axios, { type AxiosInstance, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios';
import { ENV } from '../../config/env';
import { StorageUtil } from '../../utils/storage';
import { authService } from '../AuthService';

/**
 * Singleton HTTP Client wrapper around Axios
 * 
 * Responsibilities (SRP):
 * - Manage single Axios instance
 * - Auto-attach Bearer token via request interceptor
 * - Handle 401 responses via response interceptor
 */
class HttpClient {
  private static instance: HttpClient;
  private axiosInstance: AxiosInstance;
  private isRefreshing = false;
  private refreshSubscribers: ((token: string) => void)[] = [];

  private constructor() {
    this.axiosInstance = axios.create({
      baseURL: ENV.API_BASE_URL,
      timeout: 30000,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  /**
   * Get singleton instance (Singleton Pattern)
   */
  public static getInstance(): HttpClient {
    if (!HttpClient.instance) {
      HttpClient.instance = new HttpClient();
    }
    return HttpClient.instance;
  }

  /**
   * Setup request & response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor: attach Bearer token
    this.axiosInstance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = StorageUtil.getToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Helper to detect if a message is purely English (lacks Vietnamese diacritics)
    const isEnglish = (msg: string) => {
      if (!msg || typeof msg !== 'string') return false;
      const viRegex = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
      // If it contains letters but NO Vietnamese characters, treat as English
      return /[a-zA-Z]/.test(msg) && !viRegex.test(msg);
    };

    const translateError = (msg: string): string => {
      if (!msg) return '';
      const lower = msg.toLowerCase().trim();

      // Layer 1: Exact Match Map (O(1) lookup for specific backend messages)
      const exactMap: Record<string, string> = {
        // Auth & Account
        'preauthtoken and otp are required': 'Thiếu mã OTP hoặc token xác thực',
        'invalid preauthtoken': 'Token xác thực không hợp lệ',
        'invalid otp.': 'Mã OTP không đúng.',
        'otp has expired.': 'Mã OTP đã hết hạn.',
        'invalid or expired otp': 'Mã OTP không hợp lệ hoặc đã hết hạn',
        'must provide either new email or new phone.': 'Vui lòng cung cấp email hoặc số điện thoại mới',
        'security validation failed. ip mismatch.': 'Xác thực bảo mật thất bại (địa chỉ IP không khớp)',
        'user not found': 'Không tìm thấy tài khoản người dùng',
        'user not found.': 'Không tìm thấy tài khoản người dùng',
        'user profile not found': 'Không tìm thấy hồ sơ người dùng',
        'user profile not found.': 'Không tìm thấy hồ sơ người dùng',
        'phone and otp code are required.': 'Vui lòng nhập số điện thoại và mã OTP',
        'phone number is required': 'Số điện thoại không được để trống',
        'invalid phone number format': 'Định dạng số điện thoại không hợp lệ',
        'firebase id token is required.': 'Thiếu Firebase ID Token',
        'invalid google credential token.': 'Google token không hợp lệ',
        'google auth is not configured on the server.': 'Chức năng đăng nhập Google chưa được cấu hình',
        'invalid microsoft token or token expired.': 'Microsoft token không hợp lệ hoặc đã hết hạn',
        'invalid refresh token or token expired': 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại',

        // Authorization (403/401)
        'unauthorized': 'Bạn chưa đăng nhập hoặc không có quyền thực hiện thao tác này',
        'unauthorized.': 'Bạn chưa đăng nhập hoặc không có quyền thực hiện thao tác này',
        'forbidden.': 'Không có quyền truy cập',
        'only sellers can access this endpoint.': 'Chỉ người bán mới có quyền thực hiện thao tác này',
        'only sellers can reply to reviews.': 'Chỉ người bán mới có thể phản hồi đánh giá',
        'only sellers can request to upgrade to mall.': 'Chỉ người bán mới có thể yêu cầu nâng cấp lên Mall',
        'only customers can review shippers.': 'Chỉ khách hàng mới có thể đánh giá shipper',
        'only customers can submit order complaints.': 'Chỉ khách hàng mới có thể gửi khiếu nại đơn hàng',
        'only customer can apply to become a shipper.': 'Chỉ khách hàng mới có thể đăng ký làm shipper',
        'forbidden. only shippers can update coordinates.': 'Chỉ shipper mới có thể cập nhật vị trí',
        'forbidden. only shippers can perform this action.': 'Chỉ shipper mới có thể thực hiện thao tác này',
        'forbidden. you do not own this application.': 'Đơn đăng ký này không thuộc về bạn',
        'you are not authorized to cancel this order': 'Bạn không có quyền hủy đơn hàng này',
        'you are not authorized to update this order': 'Bạn không có quyền cập nhật đơn hàng này',
        'you do not have permission to reorder this order': 'Bạn không có quyền đặt lại đơn hàng này',
        'you do not have permission to view this order': 'Bạn không có quyền xem đơn hàng này',
        'you do not have a registered restaurant.': 'Bạn chưa có nhà hàng đã đăng ký',
        'you do not own any restaurants on the system.': 'Bạn không có nhà hàng nào trên hệ thống',
        'you do not own any restaurants.': 'Bạn không có nhà hàng nào',
        'you can only review shippers for your own orders.': 'Bạn chỉ có thể đánh giá shipper cho đơn hàng của mình',
        'you can only submit complaints for your own orders.': 'Bạn chỉ có thể khiếu nại đơn hàng của chính mình',
        'you can only reply to reviews of your own restaurant.': 'Bạn chỉ có thể phản hồi đánh giá của nhà hàng mình',
        'you can only register products from your own restaurant for flash sales.': 'Bạn chỉ có thể đăng ký sản phẩm từ nhà hàng của mình cho flash sale',
        'restaurant is currently inactive or suspended.': 'Nhà hàng hiện đang ngừng hoạt động hoặc bị tạm khóa',
        'your restaurant has been suspended by admin and cannot change status.': 'Nhà hàng của bạn đã bị Admin tạm khóa, không thể thay đổi trạng thái',
        'only preparing orders can be updated to waiting for shipper.': 'Chỉ đơn đang chuẩn bị mới có thể chuyển sang chờ shipper',

        // Products
        'product not found': 'Không tìm thấy sản phẩm',
        'product not found.': 'Không tìm thấy sản phẩm',
        'product not found or is hidden.': 'Sản phẩm không tồn tại hoặc đã bị ẩn',
        'product not found or unavailable.': 'Sản phẩm không tồn tại hoặc không còn khả dụng',
        'product was not found.': 'Không tìm thấy sản phẩm',
        'this dish cannot be found.': 'Không tìm thấy món ăn này',
        'the name of this dish already exists on the restaurant\'s menu.': 'Tên món ăn này đã tồn tại trong thực đơn nhà hàng',
        'itemname is required': 'Tên món ăn không được để trống',
        'itemname must not exceed 100 characters.': 'Tên món ăn không được vượt quá 100 ký tự',
        'price must be greater than 0.': 'Giá sản phẩm phải lớn hơn 0',
        'categoryid is required': 'Vui lòng chọn danh mục sản phẩm',
        'product id is required.': 'Thiếu ID sản phẩm',
        'each image must be a valid image file (.jpg, .jpeg, .png, .webp).': 'Mỗi ảnh phải là file hình ảnh hợp lệ (.jpg, .jpeg, .png, .webp)',
        'product is out of stock.': 'Sản phẩm hiện đang hết hàng',
        'your cart is empty.': 'Giỏ hàng của bạn đang trống',

        // Orders
        'order not found': 'Không tìm thấy đơn hàng',
        'order not found.': 'Không tìm thấy đơn hàng',
        'order not found or you are not the shipper for this order.': 'Không tìm thấy đơn hàng hoặc bạn không phải shipper của đơn này',
        'invalid order data': 'Dữ liệu đơn hàng không hợp lệ',
        'rate limit exceeded. maximum of 3 guest orders allowed per 24 hours.': 'Bạn đã đặt tối đa 3 đơn khách trong 24 giờ. Vui lòng thử lại sau.',
        'this order contains dishes that are not from your restaurant.': 'Đơn hàng chứa món ăn không thuộc nhà hàng của bạn',
        'this order contains items that are not from your restaurant.': 'Đơn hàng chứa sản phẩm không thuộc nhà hàng của bạn',
        'invalid otp. checkout temporarily locked.': 'Mã OTP không đúng. Thanh toán tạm thời bị khóa.',
        'you can only review a product after successfully ordering and receiving it.': 'Bạn chưa mua sản phẩm này, vui lòng mua để có thể bình luận.',
        'you have already reviewed this product based on your previous orders.': 'Bạn đã hết lượt đánh giá. Hãy mua thêm sản phẩm này để có thể đánh giá tiếp nhé.',
        'only confirmed orders can be updated to preparing.': 'Chỉ đơn đã xác nhận mới có thể chuyển sang trạng thái chuẩn bị',
        'only pending orders can be rejected': 'Chỉ đơn đang chờ mới có thể từ chối',
        'only pending orders can be updated': 'Chỉ đơn đang chờ mới có thể cập nhật',
        'none of the items from the previous order are available for reorder': 'Không có sản phẩm nào từ đơn hàng cũ còn khả dụng để đặt lại',
        'checkout is temporarily locked due to too many failed otp attempts.': 'Thanh toán tạm bị khóa do nhập sai OTP quá nhiều lần',
        'checkout is temporarily locked for 15 minutes due to too many failed otp attempts.': 'Thanh toán bị khóa 15 phút do nhập sai OTP quá nhiều lần',
        'cannot reassign the order to the same shipper.': 'Không thể chuyển đơn cho chính shipper đang nhận',
        'this order already has an active pending delivery proposal.': 'Đơn hàng này đã có đề xuất giao hàng đang chờ xử lý',
        'this order has already been accepted by another driver.': 'Đơn hàng này đã được shipper khác nhận',
        'order is not available for broadcast (might already be assigned or not in waiting status).': 'Đơn hàng không còn khả dụng để phát',
        'a complaint has already been submitted for this order.': 'Đơn hàng này đã có khiếu nại trước đó',
        'complaint must be submitted within 24 hours after delivery. the deadline has passed.': 'Thời gian gửi khiếu nại phải trong vòng 24 giờ sau khi nhận hàng',
        'you can only submit a complaint for a delivered order.': 'Chỉ có thể gửi khiếu nại cho đơn hàng đã giao thành công',

        // Restaurants & Seller
        'restaurant not found': 'Không tìm thấy nhà hàng',
        'restaurant not found.': 'Không tìm thấy nhà hàng',
        'restaurant profile not found': 'Không tìm thấy hồ sơ nhà hàng',
        'restaurant profile not found.': 'Không tìm thấy hồ sơ nhà hàng',
        'restaurant not found in your account.': 'Không tìm thấy nhà hàng trong tài khoản của bạn',
        'active online shipper not found': 'Không tìm thấy shipper đang trực tuyến',
        'invalid time format. use hh:mm.': 'Định dạng giờ không hợp lệ, vui lòng dùng HH:mm',
        'latitude must be between -90 and 90.': 'Vĩ độ phải nằm trong khoảng -90 đến 90',
        'longitude must be between -180 and 180.': 'Kinh độ phải nằm trong khoảng -180 đến 180',
        'phone number must contain 9 to 15 digits.': 'Số điện thoại phải từ 9 đến 15 chữ số',
        'restaurant is already active.': 'Nhà hàng đang ở trạng thái hoạt động rồi',
        'restaurant is already suspended.': 'Nhà hàng đang ở trạng thái tạm khóa rồi',
        'restaurant location is missing.': 'Chưa có thông tin vị trí nhà hàng',
        'restaurant owner data is incomplete.': 'Thông tin chủ nhà hàng chưa đầy đủ',
        'failed to update restaurant status.': 'Không thể cập nhật trạng thái nhà hàng',
        'you already have a pending seller application.': 'Bạn đã có đơn đăng ký Seller đang chờ xử lý',
        'you are already a seller or mall.': 'Tài khoản của bạn đã là Seller hoặc Mall',
        'forbidden. only sellers and malls can delete promotion programs.': 'Chỉ Seller/Mall mới có thể xóa chương trình khuyến mãi',
        'forbidden. only sellers and malls can submit appeals.': 'Chỉ Seller/Mall mới có thể gửi kháng cáo',
        'access denied. you do not own this dish.': 'Bạn không phải chủ sở hữu của món ăn này',
        'access denied. you can only delete discounts belonging to your restaurant.': 'Bạn chỉ có thể xóa mã giảm giá của nhà hàng mình',

        // Discounts & Promotions
        'discount code not found.': 'Không tìm thấy mã giảm giá này',
        'promotion program not found.': 'Không tìm thấy chương trình khuyến mãi',
        'promotion program not found or does not belong to your restaurant.': 'Không tìm thấy chương trình khuyến mãi hoặc không thuộc nhà hàng của bạn',
        'startdate must be earlier than enddate.': 'Ngày bắt đầu phải trước ngày kết thúc',
        'this discount code has run out of usage.': 'Mã giảm giá này đã hết lượt sử dụng',
        'this discount code is already saved in your wallet.': 'Mã giảm giá này đã có trong ví của bạn',
        'this discount code is expired or not yet active.': 'Mã giảm giá đã hết hạn hoặc chưa có hiệu lực',
        'this discount code is inactive or has been cancelled.': 'Mã giảm giá không hoạt động hoặc đã bị hủy',
        'you have reached the maximum usage limit for this discount code.': 'Bạn đã đạt giới hạn sử dụng tối đa của mã giảm giá này',
        'you must be logged in to apply a discount code.': 'Bạn cần đăng nhập để áp dụng mã giảm giá',
        'cannot delete a promotion program that has already started.': 'Không thể xóa chương trình khuyến mãi đã bắt đầu',
        'cannot delete an active flash sale.': 'Không thể xóa Flash Sale đang hoạt động',
        'flash sale price must be lower than the original product price.': 'Giá Flash Sale phải thấp hơn giá gốc',
        'this product is already registered for this flash sale.': 'Sản phẩm này đã được đăng ký trong Flash Sale này',
        'only approved products can be registered for flash sales.': 'Chỉ sản phẩm đã được duyệt mới có thể đăng ký Flash Sale',

        // Shipper
        'shipper not found.': 'Không tìm thấy shipper',
        'shipper profile not found.': 'Không tìm thấy hồ sơ shipper',
        'shipper profile not found to apply penalty.': 'Không tìm thấy hồ sơ shipper để áp dụng phạt',
        'shipper application not found.': 'Không tìm thấy đơn đăng ký shipper',
        'invalid vehicle type. allowed: motorcycle, electricmotorbike, car.': 'Loại phương tiện không hợp lệ. Chỉ chấp nhận: Xe máy, Xe máy điện, Ô tô',
        'radius must be greater than 0.': 'Bán kính hoạt động phải lớn hơn 0',
        'start time must be earlier than end time.': 'Giờ bắt đầu phải trước giờ kết thúc',
        'start time must be in hh:mm format.': 'Giờ bắt đầu phải theo định dạng HH:mm',
        'end time must be in hh:mm format.': 'Giờ kết thúc phải theo định dạng HH:mm',
        'forbidden. only active shippers can perform this action.': 'Chỉ shipper đang hoạt động mới có thể thực hiện thao tác này',
        'forbidden. only active shipper can reject orders.': 'Chỉ shipper đang hoạt động mới có thể từ chối đơn',
        'forbidden. only shippers can report order incidents.': 'Chỉ shipper mới có thể báo cáo sự cố đơn hàng',
        'shippers must switch to online status to perform this action.': 'Shipper cần chuyển sang trạng thái trực tuyến để thực hiện',
        'shippers must switch to online status to view proposals.': 'Shipper cần trực tuyến để xem đề xuất giao hàng',
        'shipper is offline or inactive': 'Shipper hiện đang ngoại tuyến hoặc không hoạt động',
        'target new shipper is offline or inactive.': 'Shipper được chỉ định hiện đang ngoại tuyến hoặc không hoạt động',
        'you can only review the shipper after the order has been delivered.': 'Bạn chỉ có thể đánh giá shipper sau khi đơn hàng đã được giao',
        'you have already reviewed the shipper for this order.': 'Bạn đã đánh giá shipper cho đơn hàng này rồi',
        'shipper complaint must be submitted within 24 hours. the deadline has passed.': 'Thời gian khiếu nại shipper phải trong vòng 24 giờ',
        'this order has no assigned shipper.': 'Đơn hàng này chưa có shipper được phân công',
        'this order was not delivered by a shipper.': 'Đơn hàng này không được giao bởi shipper',

        // Applications
        'seller application not found.': 'Không tìm thấy đơn đăng ký Seller',
        'application not found': 'Không tìm thấy đơn đăng ký',
        'your application has been rejected and cannot be updated.': 'Đơn đăng ký đã bị từ chối và không thể chỉnh sửa',
        'you already have a pending mall upgrade application.': 'Bạn đã có đơn nâng cấp Mall đang chờ xử lý',
        'restaurant profile not found for this seller.': 'Không tìm thấy hồ sơ nhà hàng cho người bán này',

        // Cart & Categories & Others
        'cart not found.': 'Không tìm thấy giỏ hàng',
        'item not found in cart.': 'Không tìm thấy sản phẩm trong giỏ hàng',
        'this category cannot be found': 'Không tìm thấy danh mục này',
        'a category with this title already exists in this restaurant.': 'Danh mục với tên này đã tồn tại trong nhà hàng',
        'this category already exist': 'Danh mục này đã tồn tại',
        'review not found.': 'Không tìm thấy đánh giá này',
        'topping not found.': 'Không tìm thấy topping này',
        'a topping with this name already exists in this restaurant.': 'Topping với tên này đã tồn tại trong nhà hàng',
        'flash sale not found.': 'Không tìm thấy chương trình Flash Sale',
        'flash sale product not found.': 'Không tìm thấy sản phẩm Flash Sale',
        'you have already replied to this review.': 'Bạn đã phản hồi đánh giá này rồi',
        'you have already reported this review.': 'Bạn đã báo cáo đánh giá này rồi',
        'you cannot report your own review.': 'Bạn không thể báo cáo đánh giá của chính mình',

        // Payment & Points
        'point gift config not found or is inactive.': 'Cấu hình quà thưởng không tồn tại hoặc hết hiệu lực',
        'failed to send otp': 'Không thể gửi mã OTP, vui lòng thử lại',
        'failed to send otp sms': 'Không thể gửi SMS OTP, vui lòng thử lại',
        'failed to send otp to the new contact': 'Không thể gửi OTP đến thông tin liên hệ mới',

        // Nhóm 1: Auth / OTP / Firebase / Token
        'a valid email address is required.': 'Email không được để trống',
        'invalid email format.': 'Email không hợp lệ',
        'email already exists.': 'Email này đã được sử dụng',
        'phone number already exists.': 'Số điện thoại này đã được sử dụng',
        'phone number in token does not match requested phone.': 'Số điện thoại trong token không khớp',
        'phone number not found in firebase token.': 'Không tìm thấy số điện thoại trong Firebase Token',
        'phone number must contain 10 digits.': 'Số điện thoại phải có đúng 10 chữ số',
        'firebase id token is required for registration.': 'Thiếu Firebase ID Token để đăng ký',
        'invalid otp method or contact not available': 'Phương thức OTP không hợp lệ hoặc thông tin liên hệ không khả dụng',
        'microsoft auth is not configured on the server.': 'Chức năng đăng nhập Microsoft chưa được cấu hình',
        'microsoft authorization code is missing.': 'Thiếu mã xác thực Microsoft',
        'could not extract email from microsoft profile.': 'Không lấy được email từ tài khoản Microsoft',
        'could not obtain access token from microsoft.': 'Không lấy được access token từ Microsoft',
        'invalid token': 'Token không hợp lệ',
        'invalid token format': 'Định dạng token không hợp lệ',
        'preauthtoken is required': 'Thiếu mã xác thực trước thanh toán',

        // Nhóm 2: Authorization
        'access denied. only customers can perform this action.': 'Chỉ khách hàng mới có thể thực hiện thao tác này',
        'access denied. you can only update discounts belonging to your restaurant.': 'Bạn chỉ có thể chỉnh sửa mã giảm giá của nhà hàng mình',
        'access denied. you cannot read this notification.': 'Bạn không có quyền xem thông báo này',
        'access denied. you do not own this restaurant.': 'Bạn không phải chủ nhà hàng này',
        'forbidden. only active shippers can view delivery proposals.': 'Chỉ shipper đang hoạt động mới có thể xem đề xuất giao hàng',
        'forbidden. only sellers can view discount statistics.': 'Chỉ người bán mới có thể xem thống kê mã giảm giá',
        'forbidden. only sellers with a registered restaurant can setup promotion.': 'Chỉ người bán có nhà hàng mới có thể tạo khuyến mãi',
        'forbidden. only shipper can perform this action.': 'Chỉ shipper mới có thể thực hiện thao tác này',
        'forbidden. only shipper can toggle online status.': 'Chỉ shipper mới có thể chuyển đổi trạng thái trực tuyến',
        'forbidden. you are not assigned to this order.': 'Bạn không được phân công giao đơn hàng này',
        'forbidden. you are not assignd to this order.': 'Bạn không được phân công giao đơn hàng này',
        'forbidden. you do not own this promotion program.': 'Chương trình khuyến mãi này không thuộc về bạn',
        'forbidden. you do not own this restaurant.': 'Nhà hàng này không thuộc về bạn',
        'unauthorized access.': 'Bạn không có quyền truy cập',
        'unauthorized. neither logged-in user nor guest id was provided.': 'Vui lòng đăng nhập hoặc cung cấp ID khách hàng',
        'user is unauthorized.': 'Tài khoản không có quyền thực hiện thao tác này',
        'username already exists.': 'Tên đăng nhập đã tồn tại',

        // Nhóm 3: Order / Shipper Operations
        'a shipper complaint has already been submitted for this order.': 'Đã có khiếu nại shipper cho đơn hàng này',
        'a support ticket already exists for this order.': 'Đã có ticket hỗ trợ cho đơn hàng này',
        'can not release the order because no shipper is assigned.': 'Không thể giải phóng đơn do chưa có shipper được phân công',
        'cannot apply shipper penalty because no shipper is assigned to this order.': 'Không thể xử phạt shipper vì chưa có shipper được phân công',
        'cannot construct route because your current gps coordinates are not set. please update location first.': 'Không thể tạo lộ trình vì chưa cập nhật vị trí GPS',
        'cannot determine restaurant information for this order': 'Không thể xác định thông tin nhà hàng của đơn',
        'cannot determine restaurant information for this order.': 'Không thể xác định thông tin nhà hàng của đơn',
        'drivers must switch to online status to perform this action.': 'Tài xế cần chuyển sang trạng thái trực tuyến',
        'drivers must switch to online status to receive orders.': 'Tài xế cần trực tuyến để nhận đơn',
        'only orders that are confirmed, preparing, or waiting for shipper can be cancelled due to incident.': 'Chỉ đơn đang xác nhận/chuẩn bị/chờ shipper mới có thể hủy do sự cố',
        'only pending orders can be accepted.': 'Chỉ đơn đang chờ mới có thể chấp nhận',
        'order id is required.': 'Thiếu mã đơn hàng',
        'orderid is required.': 'Thiếu mã đơn hàng',
        'restaurantid is required for guest user.': 'Thiếu mã nhà hàng cho đơn khách',
        'session is already claimed by another support member.': 'Phiên hỗ trợ đã được nhận bởi nhân viên khác',
        'shippers must switch to online status to perform this action': 'Shipper cần trực tuyến để thực hiện thao tác này',
        'this delivery incident has already been resolved.': 'Sự cố giao hàng này đã được giải quyết',
        'this order has a shipper assigned. self-delivery confirmation is not allowed.': 'Đơn đã có shipper, không thể tự xác nhận giao hàng',
        'this order has been accepted by another driver.': 'Đơn hàng đã được tài xế khác nhận',
        'unauthorized ipn.': 'Xác thực thanh toán không hợp lệ',
        'unauthorized webhook.': 'Webhook không hợp lệ',
        'voucher has run out of usage.': 'Voucher đã hết lượt sử dụng',
        'you already have a pending shipper application.': 'Bạn đã có đơn đăng ký Shipper đang chờ xử lý',
        'you can only report incidents for active orders.': 'Chỉ có thể báo cáo sự cố cho đơn đang xử lý',
        'ypu can only submit a shipper complaint after the order hss been marked as delivered.': 'Bạn chỉ có thể khiếu nại sau khi đơn hàng đã được giao',

        // Nhóm 4: Product / FlashSale / Promotion
        'an active buy x get y promotion already exists for this trigger product during the selected period.': 'Đã có chương trình khuyến mãi mua-tặng cho sản phẩm này trong khoảng thời gian đã chọn',
        'cannot delete a promotion program that has already started. please turn it off instead.': 'Không thể xóa chương trình khuyến mãi đã bắt đầu. Hãy tắt thay vì xóa',
        'flash sale product has already been reviewed.': 'Sản phẩm Flash Sale này đã được đánh giá rồi',
        'gift product not found or does not belong to your restaurant.': 'Không tìm thấy sản phẩm quà tặng hoặc không thuộc nhà hàng của bạn',
        'this discount code is expired or not active yet.': 'Mã giảm giá đã hết hạn hoặc chưa có hiệu lực',
        'this discount code is inactive or cancelled.': 'Mã giảm giá không hoạt động hoặc đã bị hủy',
        'this product cannot be found': 'Không tìm thấy sản phẩm này',
        'trigger product not found or does not belong to your restaurant.': 'Không tìm thấy sản phẩm kích hoạt hoặc không thuộc nhà hàng của bạn',
        'the associated voucher has expired or is not yet active.': 'Voucher liên kết đã hết hạn hoặc chưa có hiệu lực',
        'the associated voucher is currently unavailable.': 'Voucher liên kết hiện không khả dụng',
        'value must not exceed 100% for percentage discount.': 'Giá trị không được vượt quá 100% cho mã giảm theo %',
        'value must not exceed the minimum order amount.': 'Giá trị không được vượt quá giá trị đơn hàng tối thiểu',
        'insufficient points balance.': 'Số điểm không đủ',
        'points change cannot be zero.': 'Lượng điểm thay đổi không được bằng 0',

        // Nhóm 5: Restaurants / Seller
        'global menu category not found.': 'Không tìm thấy danh mục thực đơn',
        'no target users found for the selected audience.': 'Không tìm thấy người dùng phù hợp với đối tượng đã chọn',
        'restaurant location coordinates are missing or invalid.': 'Tọa độ vị trí nhà hàng bị thiếu hoặc không hợp lệ',
        'restaurant profile not found for the current user.': 'Không tìm thấy hồ sơ nhà hàng cho người dùng này',
        'restaurant was not found': 'Không tìm thấy nhà hàng',
        'target new shipper profile not found.': 'Không tìm thấy hồ sơ shipper mới được chỉ định',
        'active online shipper not found.': 'Không tìm thấy shipper đang trực tuyến',

        // Nhóm 6: Validation (FluentValidation)
        'rating must be between 1 and 5.': 'Điểm đánh giá phải từ 1 đến 5',
        'durationminutes must be greater than 0.': 'Thời lượng phải lớn hơn 0 phút',
        'enddate must be greater than startdate.': 'Ngày kết thúc phải sau ngày bắt đầu',
        'sort order must be greater than 0': 'Thứ tự sắp xếp phải lớn hơn 0',
        'start date must be less than or equal to end date.': 'Ngày bắt đầu phải trước hoặc bằng ngày kết thúc',
        'comment must not exceed 1000 characters.': 'Nội dung bình luận không được vượt quá 1000 ký tự',
        'reply must not exceed 1000 characters.': 'Nội dung phản hồi không được vượt quá 1000 ký tự',
        'contact info is required.': 'Thông tin liên hệ không được để trống',
        'contact info must not exceed 100 characters.': 'Thông tin liên hệ không được vượt quá 100 ký tự',
        'delivery proof image is required.': 'Ảnh bằng chứng giao hàng không được để trống',
        'end time is required.': 'Giờ kết thúc không được để trống',
        'start time is required.': 'Giờ bắt đầu không được để trống',
        'keyword is required.': 'Từ khóa không được để trống',
        'keyword already exists.': 'Từ khóa này đã tồn tại',
        'reply is required.': 'Nội dung phản hồi không được để trống',
        'reviewid is required.': 'Thiếu mã đánh giá',
        'action is required': 'Hành động không được để trống',
        'the maximum price must be greater than or equal to the minimum price.': 'Giá tối đa phải lớn hơn hoặc bằng giá tối thiểu',
        'shopimageurl must point to a valid image file (.jpg, .jpeg, .png, .webp).': 'Ảnh cửa hàng phải là file hình ảnh hợp lệ',
        'businesslicenseurl must point to a valid image or document file (.jpg, .jpeg, .png, .webp, .pdf, .doc, .docx).': 'Ảnh giấy phép kinh doanh phải là file hình ảnh hoặc tài liệu hợp lệ',
        'delivery proof image must be a valid image file (.jpg, .jpeg, .png, .webp).': 'Ảnh bằng chứng phải là file hình ảnh hợp lệ',
        'reason is required when rejecting or requesting info': 'Vui lòng nhập lý do',
        'propertyname is required': 'Tên thuộc tính không được để trống',
        'application id is required': 'Thiếu mã đơn đăng ký',

        // Nhóm 7: Misc / Not Found
        'chat session not found.': 'Không tìm thấy phiên chat',
        'complaint not found.': 'Không tìm thấy khiếu nại',
        'customer not found.': 'Không tìm thấy khách hàng',
        'faq not found.': 'Không tìm thấy câu hỏi thường gặp',
        'keyword not found.': 'Không tìm thấy từ khóa',
        'notification not found.': 'Không tìm thấy thông báo',
        'point gift config not found.': 'Không tìm thấy cấu hình quà thưởng',
        'report has already been processed.': 'Báo cáo đã được xử lý',
        'report not found.': 'Không tìm thấy báo cáo',
        'withdrawal already processed.': 'Yêu cầu rút tiền đã được xử lý',
        'withdrawal not found.': 'Không tìm thấy yêu cầu rút tiền',
        'support id is required.': 'Thiếu mã hỗ trợ',
        'invalid status filter value.': 'Giá trị bộ lọc trạng thái không hợp lệ',
        'invalid client request': 'Yêu cầu không hợp lệ',
        'invalid json.': 'Dữ liệu JSON không hợp lệ',
        'ip address mismatch. security alert.': 'Địa chỉ IP không khớp. Cảnh báo bảo mật.',
        'error sending otp: ': 'Lỗi khi gửi OTP: ',
        'error sending sms: ': 'Lỗi khi gửi SMS: ',
        'save failed: ': 'Lỗi lưu dữ liệu: '
      };

      if (exactMap[lower]) {
        return exactMap[lower];
      }

      // Layer 2: Pattern Match (fallback for generic/dynamic messages)
      if (lower.includes('temporarily suspended')) return 'Tài khoản của bạn đang bị tạm khóa nhận đơn';
      if (lower.includes('same store')) return 'Sản phẩm không cùng cửa hàng với giỏ hàng hiện tại. Vui lòng xóa giỏ hàng và thêm lại.';
      if (lower.includes('greater than 0')) return 'Giá trị phải lớn hơn 0';
      if (lower.includes('greater than or equal to 0')) return 'Giá trị phải lớn hoặc bằng 0';
      if (lower.includes('hh:mm format')) return 'Giá trị phải theo định dạng HH:mm';
      if (lower.includes('valid image file')) return 'Phải là file hình ảnh hợp lệ (.jpg, .jpeg, .png, .webp)';
      if (lower.includes('sort order must')) return 'Thứ tự sắp xếp không hợp lệ';
      if (lower.includes('cannot update application. current status is')) return 'Không thể cập nhật đơn với trạng thái hiện tại';
      if (lower.includes('must be in the future')) return 'Phải là thời điểm trong tương lai';
      if (lower.includes('must be between 1 and 5')) return 'Giá trị đánh giá phải từ 1 đến 5';
      if (lower.includes('exactly 6 characters')) return 'Phải chứa chính xác 6 ký tự';
      if (lower.includes('insufficient points balance')) return 'Số điểm không đủ để thực hiện thao tác này';
      if (lower.includes('minimum order amount of')) return 'Không đạt giá trị đơn hàng tối thiểu để dùng mã này';

      // Fallbacks from original implementation
      if (lower.includes('user already exists') || lower.includes('username already exists') || lower.includes('email already exists') || lower.includes('already exists')) return 'Thông tin tài khoản đã tồn tại';
      if (lower.includes('invalid credential') || lower.includes('invalid password') || lower.includes('wrong password')) return 'Thông tin đăng nhập không chính xác';
      if (lower.includes('not found') || lower.includes('does not exist')) return 'Không tìm thấy dữ liệu';
      if (lower.includes('locked')) return 'Tài khoản đã bị khóa';
      if (lower.includes('unauthorized') || lower.includes('forbidden') || lower.includes('access denied') || lower.includes('permission')) return 'Tài khoản của bạn không có quyền truy cập hoặc thực hiện thao tác này';
      if (lower.includes('token expired') || lower.includes('token is invalid')) return 'Phiên đăng nhập đã hết hạn';
      if (lower.includes('validation') || lower.includes('one or more validation errors')) return 'Dữ liệu không hợp lệ, vui lòng kiểm tra lại';
      if (lower.includes('required') || lower.includes('not empty')) return 'Trường này không được để trống';
      if (lower.includes('valid e-mail') || lower.includes('invalid email')) return 'Email không hợp lệ';
      if (lower.includes('at least')) return 'Dữ liệu quá ngắn';
      if (lower.includes('exceed') || lower.includes('maximum')) return 'Dữ liệu quá dài';
      if (lower.includes('do not match')) return 'Dữ liệu không khớp';
      if (lower.includes('already in use') || lower.includes('taken')) return 'Đã được sử dụng';
      if (lower.includes('format') || lower.includes('must contain') || lower.includes('digits')) return 'Định dạng không hợp lệ';
      if (lower.includes('between')) return 'Giá trị không nằm trong khoảng cho phép';
      if (lower.includes('request failed with status code 403')) return 'Tài khoản của bạn không có quyền thực hiện thao tác này';
      if (lower.includes('request failed with status code 401')) return 'Vui lòng đăng nhập lại';
      if (lower.includes('network error')) return 'Lỗi kết nối mạng, vui lòng kiểm tra lại';
      if (lower.includes('save failed')) return 'Lỗi hệ thống: Không thể lưu quyết định xử lý.';

      return msg; // Return original if not translated
    };

    // Response interceptor: handle 401 unauthorized and filter English messages
    this.axiosInstance.interceptors.response.use(
      (response) => {
        const msg = response.data && response.data.message;
        if (msg && isEnglish(msg) && msg !== 'AccountLocked' && msg !== 'RequireOtp') {
          response.data.message = translateError(msg);
        }
        return response;
      },
      async (error) => {
        if (error.response?.data) {
          if (error.response.data.message && isEnglish(error.response.data.message)) {
            const translated = translateError(error.response.data.message);
            error.response.data.message = translated;
          }
          if (error.response.data.title && isEnglish(error.response.data.title)) {
            const translated = translateError(error.response.data.title);
            error.response.data.title = translated;
          }
          if (error.response.data.errors) {
            Object.keys(error.response.data.errors).forEach(key => {
              if (Array.isArray(error.response.data.errors[key])) {
                error.response.data.errors[key] = error.response.data.errors[key].map((errItem: string) =>
                  isEnglish(errItem) ? translateError(errItem) : errItem
                );
              }
            });
          } else if (Array.isArray(error.response.data.data) && error.response.data.data.length > 0 && error.response.data.data[0].property) {
            // Map custom ApiResponse validation array into the errors dictionary
            const mappedErrors: Record<string, string[]> = {};
            error.response.data.data.forEach((item: any) => {
              if (item.property && item.error) {
                mappedErrors[item.property] = [isEnglish(item.error) ? translateError(item.error) : item.error];
              }
            });
            error.response.data.errors = mappedErrors;
          }
        }
        const originalRequest = error.config;

        // Do not attempt to refresh token for auth endpoints
        const urlLower = originalRequest.url?.toLowerCase() || '';
        const isAuthEndpoint = urlLower.includes('/user/login') ||
          urlLower.includes('/user/register') ||
          urlLower.includes('/user/send') ||
          urlLower.includes('/user/uploadimage');

        if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
          if (this.isRefreshing) {
            return new Promise((resolve) => {
              this.refreshSubscribers.push((token: string) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                resolve(this.axiosInstance(originalRequest));
              });
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const token = StorageUtil.getToken();
            if (!token) {
              throw new Error('No access token available');
            }

            const response = await authService.refreshToken(token);
            if (!response.error && response.data) {
              StorageUtil.setToken(response.data.token);

              // Update authorization header for current request
              originalRequest.headers.Authorization = `Bearer ${response.data.token}`;

              // Notify all subscribers
              this.refreshSubscribers.forEach((cb) => cb(response.data.token));
              this.refreshSubscribers = [];

              return this.axiosInstance(originalRequest);
            } else {
              throw new Error('Failed to refresh token');
            }
          } catch (refreshError) {
            StorageUtil.clearAuth();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        // Handle 503 Service Unavailable (Maintenance Mode)
        if (error.response?.status === 503 && window.location.pathname !== '/maintenance') {
          window.location.href = '/maintenance';
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Expose the Axios instance for services to use
   */
  public getAxios(): AxiosInstance {
    return this.axiosInstance;
  }

  /**
   * Generic GET request
   */
  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.get<T>(url, config);
    return response.data;
  }

  /**
   * Generic POST request
   */
  public async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.post<T>(url, data, config);
    return response.data;
  }

  /**
   * Generic PUT request
   */
  public async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.put<T>(url, data, config);
    return response.data;
  }

  /**
   * Generic PATCH request
   */
  public async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.patch<T>(url, data, config);
    return response.data;
  }

  /**
   * Generic DELETE request
   */
  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.delete<T>(url, config);
    return response.data;
  }
}

// Export singleton instance
export const httpClient = HttpClient.getInstance();
export default HttpClient;
