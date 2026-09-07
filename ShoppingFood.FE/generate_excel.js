import ExcelJS from 'exceljs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Toàn bộ dữ liệu chi tiết của 134 file trong Frontend
const fileData = [
  // ─── 1. ROOT & CONFIG & ROUTES ──────────────────────────────────────────────
  {
    category: 'Cấu hình & Khởi tạo',
    name: 'main.tsx',
    path: 'src/main.tsx',
    type: 'Điểm khởi tạo (Entry Point)',
    target: 'Toàn hệ thống',
    description: 'Điểm khởi chạy ứng dụng React 18, gắn root DOM, chặn popup OAuth của Microsoft MSAL và bao bọc Provider xác thực.',
    keyExports: 'ReactRoot, MSAL Popup Handler'
  },
  {
    category: 'Cấu hình & Khởi tạo',
    name: 'App.tsx',
    path: 'src/App.tsx',
    type: 'Component Gốc (Root Component)',
    target: 'Toàn hệ thống',
    description: 'Bao bọc các Context Provider toàn cục (Auth, Cart, Location, Confirm, Toast, MSAL, Google OAuth) và tải AppRoutes.',
    keyExports: 'App component'
  },
  {
    category: 'Cấu hình & Khởi tạo',
    name: 'index.css',
    path: 'src/index.css',
    type: 'Styles toàn cục (Global CSS)',
    target: 'Toàn hệ thống',
    description: 'Định nghĩa stylesheet CSS toàn cục, các utility class và cấu hình Tailwind CSS cho giao diện.',
    keyExports: 'Global CSS styles'
  },
  {
    category: 'Cấu hình & Khởi tạo',
    name: 'setupTests.ts',
    path: 'src/setupTests.ts',
    type: 'Cấu hình Test (Unit Test Setup)',
    target: 'Lập trình viên / Tester',
    description: 'Thiết lập môi trường kiểm thử tự động Vitest và React Testing Library (jest-dom matchers).',
    keyExports: 'Test environment setup'
  },
  {
    category: 'Cấu hình & Khởi tạo',
    name: 'vite-env.d.ts',
    path: 'src/vite-env.d.ts',
    type: 'TypeScript Declaration',
    target: 'Toàn hệ thống',
    description: 'Khai báo kiểu dữ liệu biến môi trường của Vite client.',
    keyExports: 'Vite Client Types'
  },
  {
    category: 'Cấu hình & Khởi tạo',
    name: 'endpoints.ts',
    path: 'src/config/endpoints.ts',
    type: 'Cấu hình API (Endpoints Config)',
    target: 'Toàn hệ thống',
    description: 'Tập trung toàn bộ đường dẫn API endpoints của hệ thống Backend theo từng module chức năng.',
    keyExports: 'API_ENDPOINTS object'
  },
  {
    category: 'Cấu hình & Khởi tạo',
    name: 'env.ts',
    path: 'src/config/env.ts',
    type: 'Cấu hình Môi trường (Env Config)',
    target: 'Toàn hệ thống',
    description: 'Đọc và export các biến môi trường (API Base URL, SignalR Hub URLs, Google Client ID, Leaflet URL...).',
    keyExports: 'ENV object'
  },
  {
    category: 'Cấu hình & Khởi tạo',
    name: 'firebase.ts',
    path: 'src/config/firebase.ts',
    type: 'Cấu hình Firebase',
    target: 'Khách hàng / Xác thực',
    description: 'Khởi tạo Firebase App và Firebase Auth phục vụ gửi mã OTP SMS xác thực số điện thoại.',
    keyExports: 'app, auth'
  },
  {
    category: 'Cấu hình & Khởi tạo',
    name: 'msalConfig.ts',
    path: 'src/config/msalConfig.ts',
    type: 'Cấu hình Microsoft OAuth',
    target: 'Quản trị viên / Nhân viên',
    description: 'Cấu hình Microsoft Authentication Library (MSAL) hỗ trợ đăng nhập Single Sign-On (SSO) bằng tài khoản Microsoft.',
    keyExports: 'msalConfig, loginRequest, msalInstance'
  },
  {
    category: 'Điều hướng & Bảo vệ Tuyến đường',
    name: 'routeConfig.ts',
    path: 'src/routes/routeConfig.ts',
    type: 'Cấu hình Đường dẫn (Route Config)',
    target: 'Toàn hệ thống',
    description: 'Khai báo hằng số toàn bộ đường dẫn URL của ứng dụng và hàm trợ giúp tạo link chi tiết món ăn/quán ăn.',
    keyExports: 'ROUTES object, getProductDetailPath()'
  },
  {
    category: 'Điều hướng & Bảo vệ Tuyến đường',
    name: 'PrivateRoute.tsx',
    path: 'src/routes/PrivateRoute.tsx',
    type: 'Bảo vệ Route (Route Guard)',
    target: 'Toàn hệ thống',
    description: 'Component bảo vệ tuyến đường theo trạng thái đăng nhập, xác thực vai trò (Role-based Authorization) và khóa tài khoản.',
    keyExports: 'PrivateRoute component'
  },
  {
    category: 'Điều hướng & Bảo vệ Tuyến đường',
    name: 'AppRoutes.tsx',
    path: 'src/routes/AppRoutes.tsx',
    type: 'Sơ đồ Điều hướng (Router)',
    target: 'Toàn hệ thống',
    description: 'Khai báo sơ đồ điều hướng toàn diện kết hợp layout tương ứng cho Khách hàng, Seller, Shipper, Coordinator, Admin.',
    keyExports: 'AppRoutes component'
  },

  // ─── 2. UTILS ───────────────────────────────────────────────────────────────
  {
    category: 'Tiện ích (Utils)',
    name: 'formatters.ts',
    path: 'src/utils/formatters.ts',
    type: 'Hàm Tiện ích (Helper Functions)',
    target: 'Toàn hệ thống',
    description: 'Định dạng tiền tệ VNĐ, ngày giờ, số điện thoại, ẩn thông tin bảo mật, nhãn/màu sắc trạng thái đơn hàng & thanh toán.',
    keyExports: 'formatCurrency(), formatDate(), getOrderStatusLabel(), getPaymentDisplayStatusLabel(), maskPhone()...'
  },
  {
    category: 'Tiện ích (Utils)',
    name: 'memberTierDiscount.ts',
    path: 'src/utils/memberTierDiscount.ts',
    type: 'Hàm Tính toán (Business Logic)',
    target: 'Khách hàng',
    description: 'Tính toán tỷ lệ phần trăm và số tiền chiết khấu tự động theo hạng thành viên (Đồng 0%, Bạc 5%, Vàng 10%, Kim Cương 15%).',
    keyExports: 'getMemberTierDiscountPercent(), calculateMemberTierDiscountAmount()'
  },
  {
    category: 'Tiện ích (Utils)',
    name: 'printOrderBill.ts',
    path: 'src/utils/printOrderBill.ts',
    type: 'Hàm In Ấn (Print Utility)',
    target: 'Người bán / Seller',
    description: 'Tạo mã HTML và kích hoạt lệnh in phiếu bill bếp và bill thanh toán cho đơn lẻ hoặc in hàng loạt.',
    keyExports: 'printSellerOrderBillHtml(), printSellerOrderBills()'
  },
  {
    category: 'Tiện ích (Utils)',
    name: 'storage.ts',
    path: 'src/utils/storage.ts',
    type: 'Quản lý Lưu trữ (Storage Helper)',
    target: 'Toàn hệ thống',
    description: 'Quản lý lưu trữ an toàn Access Token, Refresh Token, thông tin Profile vào LocalStorage trình duyệt.',
    keyExports: 'storage object (getToken, setToken, clearToken, getUser, setUser...)'
  },
  {
    category: 'Tiện ích (Utils)',
    name: 'customerChatUnread.ts',
    path: 'src/utils/customerChatUnread.ts',
    type: 'Quản lý Tin nhắn Chưa đọc',
    target: 'Khách hàng',
    description: 'Theo dõi, lưu trữ và đồng bộ số lượng tin nhắn chưa đọc của từng phiên chat với người bán vào LocalStorage.',
    keyExports: 'getCustomerUnreadMap(), markCustomerSessionRead(), syncCustomerUnreadFromSessions()...'
  },

  // ─── 3. CONTEXTS ────────────────────────────────────────────────────────────
  {
    category: 'Quản lý Trạng thái (Contexts)',
    name: 'AuthContext.tsx',
    path: 'src/contexts/AuthContext.tsx',
    type: 'Context Xác thực (Auth Context)',
    target: 'Toàn hệ thống',
    description: 'Quản lý trạng thái đăng nhập toàn cục, lưu trữ thông tin User/Role, tự động làm mới Token và xử lý đăng xuất.',
    keyExports: 'AuthContext, AuthProvider'
  },
  {
    category: 'Quản lý Trạng thái (Contexts)',
    name: 'CartContext.tsx',
    path: 'src/contexts/CartContext.tsx',
    type: 'Context Giỏ hàng (Cart Context)',
    target: 'Khách hàng',
    description: 'Quản lý danh sách món ăn trong giỏ hàng, phân theo từng quán, xử lý combo Mua X Tặng Y, Flash Sale, Topping, Size.',
    keyExports: 'CartContext, CartProvider'
  },
  {
    category: 'Quản lý Trạng thái (Contexts)',
    name: 'ConfirmContext.tsx',
    path: 'src/contexts/ConfirmContext.tsx',
    type: 'Context Hộp thoại Xác nhận',
    target: 'Toàn hệ thống',
    description: 'Cung cấp hàm gọi hộp thoại xác nhận Promise-based (`await confirm({...})`) dùng cho mọi thao tác nguy hiểm.',
    keyExports: 'ConfirmContext, ConfirmProvider'
  },
  {
    category: 'Quản lý Trạng thái (Contexts)',
    name: 'UserLocationContext.tsx',
    path: 'src/contexts/UserLocationContext.tsx',
    type: 'Context Định vị (Location Context)',
    target: 'Khách hàng',
    description: 'Định vị GPS tọa độ của người dùng qua trình duyệt hoặc sổ địa chỉ để tìm kiếm món ăn gần nhất.',
    keyExports: 'UserLocationContext, UserLocationProvider'
  },

  // ─── 4. HOOKS ───────────────────────────────────────────────────────────────
  {
    category: 'Custom Hooks',
    name: 'index.ts',
    path: 'src/hooks/index.ts',
    type: 'Export Barrel',
    target: 'Toàn hệ thống',
    description: 'Export tập trung toàn bộ custom hooks trong dự án.',
    keyExports: 'useAuth, useCart, useConfirm, useProducts, useRestaurants, useUserLocation...'
  },
  {
    category: 'Custom Hooks',
    name: 'useAuth.ts',
    path: 'src/hooks/useAuth.ts',
    type: 'Custom Hook',
    target: 'Toàn hệ thống',
    description: 'Truy xuất thông tin đăng nhập, token, role và các hàm login/logout từ AuthContext.',
    keyExports: 'useAuth()'
  },
  {
    category: 'Custom Hooks',
    name: 'useCart.ts',
    path: 'src/hooks/useCart.ts',
    type: 'Custom Hook',
    target: 'Khách hàng',
    description: 'Truy xuất và thao tác với giỏ hàng: thêm món, xóa món, sửa số lượng, tính tổng tiền từ CartContext.',
    keyExports: 'useCart()'
  },
  {
    category: 'Custom Hooks',
    name: 'useConfirm.ts',
    path: 'src/hooks/useConfirm.ts',
    type: 'Custom Hook',
    target: 'Toàn hệ thống',
    description: 'Hook mở hộp thoại xác nhận hành động trực tiếp.',
    keyExports: 'useConfirm()'
  },
  {
    category: 'Custom Hooks',
    name: 'useUserLocation.ts',
    path: 'src/hooks/useUserLocation.ts',
    type: 'Custom Hook',
    target: 'Khách hàng',
    description: 'Hook lấy tọa độ vị trí hiện tại và địa chỉ giao hàng của người dùng.',
    keyExports: 'useUserLocation()'
  },
  {
    category: 'Custom Hooks',
    name: 'useProducts.ts',
    path: 'src/hooks/useProducts.ts',
    type: 'Custom Hook',
    target: 'Người bán / Khách hàng',
    description: 'Hook quản lý tìm kiếm, lọc danh sách món ăn, phân trang và thao tác CRUD sản phẩm.',
    keyExports: 'useProducts()'
  },
  {
    category: 'Custom Hooks',
    name: 'useRestaurants.ts',
    path: 'src/hooks/useRestaurants.ts',
    type: 'Custom Hook',
    target: 'Khách hàng',
    description: 'Hook tìm kiếm danh sách nhà hàng, phân trang và lọc theo khoảng cách.',
    keyExports: 'useRestaurants()'
  },
  {
    category: 'Custom Hooks',
    name: 'useCategories.ts',
    path: 'src/hooks/useCategories.ts',
    type: 'Custom Hook',
    target: 'Khách hàng / Người bán',
    description: 'Hook tải danh sách các danh mục món ăn toàn sàn hoặc theo quán.',
    keyExports: 'useCategories()'
  },
  {
    category: 'Custom Hooks',
    name: 'useAdmin.ts',
    path: 'src/hooks/useAdmin.ts',
    type: 'Custom Hook',
    target: 'Quản trị viên',
    description: 'Hook tổng hợp các tác vụ quản trị: duyệt tài khoản, thống kê doanh thu, cấu hình hệ thống.',
    keyExports: 'useAdmin()'
  },
  {
    category: 'Custom Hooks',
    name: 'useCustomerChatWatcher.ts',
    path: 'src/hooks/useCustomerChatWatcher.ts',
    type: 'Custom Hook Realtime',
    target: 'Khách hàng',
    description: 'Lắng nghe sự kiện SignalR tin nhắn mới gửi đến khách hàng và phát âm thanh thông báo/cập nhật badge số chưa đọc.',
    keyExports: 'useCustomerChatWatcher(), setActiveCustomerChatSession()'
  },
  {
    category: 'Custom Hooks',
    name: 'useSellerChatWatcher.ts',
    path: 'src/hooks/useSellerChatWatcher.ts',
    type: 'Custom Hook Realtime',
    target: 'Người bán / Seller',
    description: 'Lắng nghe tin nhắn mới từ khách hàng gửi tới gian hàng qua SignalR Hub.',
    keyExports: 'useSellerChatWatcher()'
  },
  {
    category: 'Custom Hooks',
    name: 'useSupportChatWatcher.ts',
    path: 'src/hooks/useSupportChatWatcher.ts',
    type: 'Custom Hook Realtime',
    target: 'Điều phối viên / Admin',
    description: 'Lắng nghe yêu cầu hỗ trợ trực tuyến mới từ người dùng dành cho nhân viên CSKH / Điều phối viên.',
    keyExports: 'useSupportChatWatcher()'
  },

  // ─── 5. SERVICES ────────────────────────────────────────────────────────────
  {
    category: 'Dịch vụ API (Services)',
    name: 'index.ts',
    path: 'src/services/index.ts',
    type: 'Export Barrel',
    target: 'Toàn hệ thống',
    description: 'Export tập trung toàn bộ các instance API service của hệ thống.',
    keyExports: 'adminService, authService, orderService, productService, paymentService...'
  },
  {
    category: 'Dịch vụ API (Services)',
    name: 'BaseService.ts',
    path: 'src/services/base/BaseService.ts',
    type: 'Lớp Dịch vụ Cơ sở (Base Class)',
    target: 'Toàn hệ thống',
    description: 'Lớp cha cung cấp các hàm gọi CRUD chuẩn (GET, POST, PUT, DELETE, PATCH) bọc quanh HttpClient.',
    keyExports: 'BaseService class'
  },
  {
    category: 'Dịch vụ API (Services)',
    name: 'HttpClient.ts',
    path: 'src/services/base/HttpClient.ts',
    type: 'Trình Giao tiếp HTTP (Axios Wrapper)',
    target: 'Toàn hệ thống',
    description: 'Khởi tạo Axios instance, tự động gắn Bearer Token và tự gọi Refresh Token khi gặp lỗi 401 Unauthorized.',
    keyExports: 'httpClient instance, HttpClient class'
  },
  {
    category: 'Dịch vụ API (Services)',
    name: 'AdminService.ts',
    path: 'src/services/AdminService.ts',
    type: 'Dịch vụ Quản trị (Admin API)',
    target: 'Quản trị viên',
    description: 'Gọi API duyệt đối tác, quản lý người dùng, từ khóa cấm, kiểm duyệt món/đánh giá, cấu hình phí và log hệ thống.',
    keyExports: 'adminService, AdminService'
  },
  {
    category: 'Dịch vụ API (Services)',
    name: 'AuthService.ts',
    path: 'src/services/AuthService.ts',
    type: 'Dịch vụ Xác thực (Auth API)',
    target: 'Toàn hệ thống',
    description: 'Gọi API đăng nhập, đăng ký, đăng nhập Google/Microsoft/Phone, đổi mật khẩu, quên mật khẩu, cập nhật profile và upload ảnh.',
    keyExports: 'authService, AuthService'
  },
  {
    category: 'Dịch vụ API (Services)',
    name: 'ChatService.ts',
    path: 'src/services/ChatService.ts',
    type: 'Dịch vụ Chat & SignalR (Chat API)',
    target: 'Toàn hệ thống',
    description: 'Kết nối SignalR Hub chat realtime, gửi/nhận tin nhắn, tải lịch sử hội thoại giữa Khách - Quán - Hỗ trợ.',
    keyExports: 'chatService, ChatService'
  },
  {
    category: 'Dịch vụ API (Services)',
    name: 'CoordinatorService.ts',
    path: 'src/services/CoordinatorService.ts',
    type: 'Dịch vụ Điều phối (Dispatch API)',
    target: 'Điều phối viên',
    description: 'Gọi API bảng điều phối đơn, tìm shipper gần nhất, gán đơn thủ công, xử lý sự cố giao hàng và phạt điểm uy tín.',
    keyExports: 'coordinatorService, CoordinatorService'
  },
  {
    category: 'Dịch vụ API (Services)',
    name: 'OrderService.ts',
    path: 'src/services/OrderService.ts',
    type: 'Dịch vụ Đơn hàng (Order API)',
    target: 'Khách hàng / Người bán',
    description: 'Gọi API đặt hàng (thành viên & guest), tính phí ship, hủy đơn, chuyển trạng thái chế biến và lấy lịch sử đơn.',
    keyExports: 'orderService, OrderService'
  },
  {
    category: 'Dịch vụ API (Services)',
    name: 'PaymentService.ts',
    path: 'src/services/PaymentService.ts',
    type: 'Dịch vụ Thanh toán (Payment API)',
    target: 'Toàn hệ thống',
    description: 'Gọi API phương thức thanh toán, tạo QR VietQR SePay, kiểm tra trạng thái thanh toán, ví tiền và rút tiền.',
    keyExports: 'paymentService, PaymentService'
  },
  {
    category: 'Dịch vụ API (Services)',
    name: 'ProductService.ts',
    path: 'src/services/ProductService.ts',
    type: 'Dịch vụ Sản phẩm (Product API)',
    target: 'Khách hàng / Người bán',
    description: 'Gọi API tìm kiếm món ăn, chi tiết món, CRUD món của quán, gợi ý món cá nhân hóa và quản lý đánh giá món.',
    keyExports: 'productService, ProductService'
  },
  {
    category: 'Dịch vụ API (Services)',
    name: 'RestaurantService.ts',
    path: 'src/services/RestaurantService.ts',
    type: 'Dịch vụ Nhà hàng (Restaurant API)',
    target: 'Khách hàng / Người bán',
    description: 'Gọi API tìm kiếm nhà hàng, chi tiết quán, danh sách quán gần đây theo GPS và cập nhật thông tin quán.',
    keyExports: 'restaurantService, RestaurantService'
  },
  {
    category: 'Dịch vụ API (Services)',
    name: 'ShipperService.ts',
    path: 'src/services/ShipperService.ts',
    type: 'Dịch vụ Tài xế (Shipper API)',
    target: 'Tài xế / Shipper',
    description: 'Gọi API bật/tắt nhận đơn, nhận/từ chối đơn, xác nhận mã lấy hàng OTP, xác nhận giao thành công kèm ảnh và điểm uy tín.',
    keyExports: 'shipperService, ShipperService'
  },
  {
    category: 'Dịch vụ API (Services)',
    name: 'DiscountService.ts',
    path: 'src/services/DiscountService.ts',
    type: 'Dịch vụ Mã giảm giá (Discount API)',
    target: 'Toàn hệ thống',
    description: 'Gọi API tạo và quản lý mã giảm giá voucher toàn sàn hoặc voucher của riêng quán ăn.',
    keyExports: 'discountService, DiscountService'
  },
  {
    category: 'Dịch vụ API (Services)',
    name: 'FlashSaleService.ts',
    path: 'src/services/FlashSaleService.ts',
    type: 'Dịch vụ Flash Sale',
    target: 'Toàn hệ thống',
    description: 'Gọi API quản lý các đợt Flash Sale giờ vàng, đăng ký món tham gia và kiểm duyệt sản phẩm giảm giá.',
    keyExports: 'flashSaleService, FlashSaleService'
  },
  {
    category: 'Dịch vụ API (Services)',
    name: 'PromotionService.ts',
    path: 'src/services/PromotionService.ts',
    type: 'Dịch vụ Khuyến mãi Mua X Tặng Y',
    target: 'Người bán / Khách hàng',
    description: 'Gọi API tạo và áp dụng chương trình khuyến mãi Mua X Tặng Y (Buy X Get Y).',
    keyExports: 'promotionService, PromotionService'
  },
  {
    category: 'Dịch vụ API (Services)',
    name: 'LoyaltyPointService.ts',
    path: 'src/services/LoyaltyPointService.ts',
    type: 'Dịch vụ Điểm thưởng Hội viên',
    target: 'Khách hàng / Admin',
    description: 'Gọi API tích điểm, đổi điểm lấy voucher và thăng hạng thành viên.',
    keyExports: 'loyaltyPointService, LoyaltyPointService'
  },
  {
    category: 'Dịch vụ API (Services)',
    name: 'PointGiftConfigService.ts',
    path: 'src/services/PointGiftConfigService.ts',
    type: 'Dịch vụ Cấu hình Quà Đổi Điểm',
    target: 'Quản trị viên',
    description: 'Gọi API thiết lập danh sách quà tặng và số điểm cần để đổi quà.',
    keyExports: 'pointGiftConfigService, PointGiftConfigService'
  },
  {
    category: 'Dịch vụ API (Services)',
    name: 'NotificationRealtimeService.ts',
    path: 'src/services/NotificationRealtimeService.ts',
    type: 'Dịch vụ Thông báo Realtime',
    target: 'Toàn hệ thống',
    description: 'Kết nối SignalR Notification Hub nhận thông báo đẩy tức thì (đơn hàng mới, trạng thái đơn, thanh toán).',
    keyExports: 'notificationRealtimeService, NotificationRealtimeService'
  },
  {
    category: 'Dịch vụ API (Services)',
    name: 'NotificationService.ts',
    path: 'src/services/NotificationService.ts',
    type: 'Dịch vụ Thông báo (Notification API)',
    target: 'Toàn hệ thống',
    description: 'Gọi API lấy danh sách thông báo, đánh dấu đã đọc và xóa thông báo.',
    keyExports: 'notificationService, NotificationService'
  },
  {
    category: 'Dịch vụ API (Services)',
    name: 'MenuCategoryService.ts',
    path: 'src/services/MenuCategoryService.ts',
    type: 'Dịch vụ Danh mục Món ăn',
    target: 'Người bán / Khách hàng',
    description: 'Gọi API quản lý các danh mục thực đơn của quán ăn.',
    keyExports: 'menuCategoryService, MenuCategoryService'
  },
  {
    category: 'Dịch vụ API (Services)',
    name: 'ToppingService.ts',
    path: 'src/services/ToppingService.ts',
    type: 'Dịch vụ Topping Ăn Kèm',
    target: 'Người bán / Khách hàng',
    description: 'Gọi API quản lý danh sách các loại topping ăn kèm món ăn.',
    keyExports: 'toppingService, ToppingService'
  },
  {
    category: 'Dịch vụ API (Services)',
    name: 'UserAddressService.ts',
    path: 'src/services/UserAddressService.ts',
    type: 'Dịch vụ Sổ Địa chỉ',
    target: 'Khách hàng',
    description: 'Gọi API quản lý sổ địa chỉ giao hàng đã lưu của người dùng.',
    keyExports: 'userAddressService, UserAddressService'
  },
  {
    category: 'Dịch vụ API (Services)',
    name: 'UserService.ts',
    path: 'src/services/UserService.ts',
    type: 'Dịch vụ Người dùng (User API)',
    target: 'Toàn hệ thống',
    description: 'Gọi API quản lý danh sách tài khoản, thông tin hồ sơ và đơn đăng ký đối tác.',
    keyExports: 'userService, UserService'
  },
  {
    category: 'Dịch vụ API (Services)',
    name: 'SupportService.ts',
    path: 'src/services/SupportService.ts',
    type: 'Dịch vụ Hỗ trợ & Báo cáo Sự cố',
    target: 'Toàn hệ thống',
    description: 'Gọi API gửi khiếu nại, báo cáo sự cố đơn hàng và lấy điều khoản chính sách.',
    keyExports: 'supportService, SupportService'
  },
  {
    category: 'Dịch vụ API (Services)',
    name: 'FaqService.ts',
    path: 'src/services/FaqService.ts',
    type: 'Dịch vụ Câu hỏi Thường gặp',
    target: 'Toàn hệ thống',
    description: 'Gọi API lấy danh sách câu hỏi thường gặp trợ giúp người dùng.',
    keyExports: 'faqService, FaqService'
  },
  {
    category: 'Dịch vụ API (Services)',
    name: 'CartService.ts',
    path: 'src/services/CartService.ts',
    type: 'Dịch vụ Xác thực Giỏ hàng',
    target: 'Khách hàng',
    description: 'Gọi API kiểm tra tính hợp lệ của giỏ hàng trước khi đặt hàng.',
    keyExports: 'cartService, CartService'
  },

  // ─── 6. INTERFACES ──────────────────────────────────────────────────────────
  {
    category: 'Kiểu dữ liệu (Interfaces / DTOs)',
    name: 'index.ts',
    path: 'src/interfaces/index.ts',
    type: 'Export Barrel',
    target: 'Toàn hệ thống',
    description: 'Export tập trung toàn bộ TypeScript Interface và DTO của ứng dụng.',
    keyExports: 'IUserDto, IOrderDto, IProductDto, IRestaurantDto, IApiResponse...'
  },
  {
    category: 'Kiểu dữ liệu (Interfaces / DTOs)',
    name: 'IApiResponse.ts',
    path: 'src/interfaces/IApiResponse.ts',
    type: 'Interface Định dạng API Response',
    target: 'Toàn hệ thống',
    description: 'Cấu trúc chuẩn của kết quả phản hồi từ Backend (status, data, message, error).',
    keyExports: 'IApiResponse<T>'
  },
  {
    category: 'Kiểu dữ liệu (Interfaces / DTOs)',
    name: 'IAuth.ts',
    path: 'src/interfaces/IAuth.ts',
    type: 'Interface Xác thực',
    target: 'Toàn hệ thống',
    description: 'Các DTO đăng nhập, đăng ký, thông tin token, hồ sơ tài khoản.',
    keyExports: 'ILoginRequest, IRegisterRequest, IAuthResponse, IUserDto...'
  },
  {
    category: 'Kiểu dữ liệu (Interfaces / DTOs)',
    name: 'IUser.ts',
    path: 'src/interfaces/IUser.ts',
    type: 'Interface Người dùng',
    target: 'Toàn hệ thống',
    description: 'DTO thông tin chi tiết người dùng, sổ địa chỉ và vai trò.',
    keyExports: 'IUserDto, IUserAddressDto, Role enum...'
  },
  {
    category: 'Kiểu dữ liệu (Interfaces / DTOs)',
    name: 'IProduct.ts',
    path: 'src/interfaces/IProduct.ts',
    type: 'Interface Món ăn & Sản phẩm',
    target: 'Toàn hệ thống',
    description: 'DTO món ăn, kích cỡ (Size), topping đi kèm và tham số tìm kiếm món.',
    keyExports: 'IProductDto, IProductSizeDto, IProductSearchRequest...'
  },
  {
    category: 'Kiểu dữ liệu (Interfaces / DTOs)',
    name: 'IRestaurant.ts',
    path: 'src/interfaces/IRestaurant.ts',
    type: 'Interface Nhà hàng',
    target: 'Toàn hệ thống',
    description: 'DTO thông tin nhà hàng, giờ mở cửa, tọa độ GPS và bán kính phục vụ.',
    keyExports: 'IRestaurantDto, IRestaurantSearchRequest...'
  },
  {
    category: 'Kiểu dữ liệu (Interfaces / DTOs)',
    name: 'IOrder.ts',
    path: 'src/interfaces/IOrder.ts',
    type: 'Interface Đơn hàng',
    target: 'Toàn hệ thống',
    description: 'DTO chi tiết đơn hàng, món trong đơn, địa chỉ giao hàng và trạng thái đơn.',
    keyExports: 'IOrderDto, IOrderItemDto, ICreateOrderRequest...'
  },
  {
    category: 'Kiểu dữ liệu (Interfaces / DTOs)',
    name: 'IShipper.ts',
    path: 'src/interfaces/IShipper.ts',
    type: 'Interface Tài xế',
    target: 'Tài xế / Điều phối',
    description: 'DTO thông tin tài xế, đề xuất giao hàng, báo cáo thu nhập và lịch làm việc.',
    keyExports: 'IShipperDto, IProposedDeliveryOfferDto, IShipperIncomeReportDto...'
  },
  {
    category: 'Kiểu dữ liệu (Interfaces / DTOs)',
    name: 'IChat.ts',
    path: 'src/interfaces/IChat.ts',
    type: 'Interface Trò chuyện',
    target: 'Toàn hệ thống',
    description: 'DTO phiên chat, tin nhắn chat và người tham gia hội thoại.',
    keyExports: 'IChatSession, IChatMessage, ICustomerChatSummary...'
  },
  {
    category: 'Kiểu dữ liệu (Interfaces / DTOs)',
    name: 'IDiscount.ts',
    path: 'src/interfaces/IDiscount.ts',
    type: 'Interface Mã giảm giá',
    target: 'Toàn hệ thống',
    description: 'DTO mã giảm giá voucher, điều kiện áp dụng và số lượng phát hành.',
    keyExports: 'IDiscountDto, ICreateDiscountRequest...'
  },
  {
    category: 'Kiểu dữ liệu (Interfaces / DTOs)',
    name: 'IFlashSale.ts',
    path: 'src/interfaces/IFlashSale.ts',
    type: 'Interface Flash Sale',
    target: 'Toàn hệ thống',
    description: 'DTO đợt Flash Sale giờ vàng và món ăn tham gia đợt giảm giá.',
    keyExports: 'IFlashSale, IFlashSaleProduct, ICreateFlashSaleRequest...'
  },
  {
    category: 'Kiểu dữ liệu (Interfaces / DTOs)',
    name: 'IPromotion.ts',
    path: 'src/interfaces/IPromotion.ts',
    type: 'Interface Mua X Tặng Y',
    target: 'Toàn hệ thống',
    description: 'DTO chương trình khuyến mãi mua kèm tặng kèm.',
    keyExports: 'IBuyXGetYPromotionDto, ICreatePromotionRequest...'
  },
  {
    category: 'Kiểu dữ liệu (Interfaces / DTOs)',
    name: 'ICart.ts',
    path: 'src/interfaces/ICart.ts',
    type: 'Interface Giỏ hàng',
    target: 'Khách hàng',
    description: 'DTO item trong giỏ hàng, thông tin topping, size và giá trị món.',
    keyExports: 'ICartItem, ICart'
  },
  {
    category: 'Kiểu dữ liệu (Interfaces / DTOs)',
    name: 'INotification.ts',
    path: 'src/interfaces/INotification.ts',
    type: 'Interface Thông báo',
    target: 'Toàn hệ thống',
    description: 'DTO thông báo đẩy realtime và danh sách thông báo của người dùng.',
    keyExports: 'INotificationDto'
  },
  {
    category: 'Kiểu dữ liệu (Interfaces / DTOs)',
    name: 'IReview.ts',
    path: 'src/interfaces/IReview.ts',
    type: 'Interface Đánh giá',
    target: 'Toàn hệ thống',
    description: 'DTO nhận xét, số sao đánh giá món ăn và phản hồi của người bán.',
    keyExports: 'IProductReviewDto, ICreateReviewRequest...'
  },
  {
    category: 'Kiểu dữ liệu (Interfaces / DTOs)',
    name: 'ISupport.ts',
    path: 'src/interfaces/ISupport.ts',
    type: 'Interface Hỗ trợ',
    target: 'Toàn hệ thống',
    description: 'DTO phiếu hỗ trợ ticket, báo cáo sự cố đơn hàng và giải trình.',
    keyExports: 'ICreateSupportTicketRequest, IIncidentItemDto...'
  },
  {
    category: 'Kiểu dữ liệu (Interfaces / DTOs)',
    name: 'IAdmin.ts',
    path: 'src/interfaces/IAdmin.ts',
    type: 'Interface Quản trị',
    target: 'Quản trị viên',
    description: 'DTO cấu hình hệ thống, duyệt đối tác, phân quyền API.',
    keyExports: 'IAdminConfig, IRolePermissionDto...'
  },
  {
    category: 'Kiểu dữ liệu (Interfaces / DTOs)',
    name: 'IAdminReport.ts',
    path: 'src/interfaces/IAdminReport.ts',
    type: 'Interface Báo cáo Admin',
    target: 'Quản trị viên',
    description: 'DTO số liệu thống kê doanh thu, đơn hàng, tăng trưởng người dùng.',
    keyExports: 'IAdminDashboardSummaryDto, IRevenueReportDto...'
  },
  {
    category: 'Kiểu dữ liệu (Interfaces / DTOs)',
    name: 'ICoordinatoor.ts',
    path: 'src/interfaces/ICoordinatoor.ts',
    type: 'Interface Điều phối',
    target: 'Điều phối viên',
    description: 'DTO danh sách shipper đang trực tuyến, lịch sử điều phối, sự cố đơn.',
    keyExports: 'IMonitorShipperDto, IDispatchHistoryDto...'
  },
  {
    category: 'Kiểu dữ liệu (Interfaces / DTOs)',
    name: 'ILog.ts',
    path: 'src/interfaces/ILog.ts',
    type: 'Interface Nhật ký',
    target: 'Quản trị viên',
    description: 'DTO nhật ký hành động người dùng (Action Log) và nhật ký lỗi (Error Log).',
    keyExports: 'IActionLogDto, IErrorLogDto'
  },
  {
    category: 'Kiểu dữ liệu (Interfaces / DTOs)',
    name: 'ILoyaltyPoint.ts',
    path: 'src/interfaces/ILoyaltyPoint.ts',
    type: 'Interface Điểm thưởng & Hạng',
    target: 'Khách hàng / Admin',
    description: 'DTO điểm tích lũy, lịch sử cộng trừ điểm và cấu hình hạng thành viên.',
    keyExports: 'ILoyaltyPointDto, IMemberTierConfig'
  },
  {
    category: 'Kiểu dữ liệu (Interfaces / DTOs)',
    name: 'IPointGiftConfig.ts',
    path: 'src/interfaces/IPointGiftConfig.ts',
    type: 'Interface Quà Đổi Điểm',
    target: 'Quản trị viên',
    description: 'DTO cấu hình đổi điểm thưởng lấy mã giảm giá voucher.',
    keyExports: 'IPointGiftConfigDto'
  },
  {
    category: 'Kiểu dữ liệu (Interfaces / DTOs)',
    name: 'IMenuCategory.ts',
    path: 'src/interfaces/IMenuCategory.ts',
    type: 'Interface Danh mục Món',
    target: 'Người bán / Khách hàng',
    description: 'DTO danh mục thực đơn và thứ tự hiển thị.',
    keyExports: 'IMenuCategoryDto, ICreateMenuCategoryRequest'
  },
  {
    category: 'Kiểu dữ liệu (Interfaces / DTOs)',
    name: 'ITopping.ts',
    path: 'src/interfaces/ITopping.ts',
    type: 'Interface Topping',
    target: 'Người bán / Khách hàng',
    description: 'DTO topping ăn kèm, giá bán và trạng thái còn hàng.',
    keyExports: 'IToppingDto, ICreateToppingRequest'
  },
  {
    category: 'Kiểu dữ liệu (Interfaces / DTOs)',
    name: 'IFaq.ts',
    path: 'src/interfaces/IFaq.ts',
    type: 'Interface FAQ',
    target: 'Toàn hệ thống',
    description: 'DTO câu hỏi thường gặp và câu trả lời giải đáp thắc mắc.',
    keyExports: 'IFaqDto, ICreateFaqRequest'
  },
  {
    category: 'Kiểu dữ liệu (Interfaces / DTOs)',
    name: 'IShipperReputationHistory.ts',
    path: 'src/interfaces/IShipperReputationHistory.ts',
    type: 'Interface Lịch sử Uy tín Tài xế',
    target: 'Tài xế / Điều phối',
    description: 'DTO nhật ký cộng / trừ điểm uy tín tài xế kèm lý do.',
    keyExports: 'IShipperReputationHistory'
  },

  // ─── 7. COMPONENTS ──────────────────────────────────────────────────────────
  {
    category: 'Components Giao diện (Common)',
    name: 'index.ts',
    path: 'src/components/common/index.ts',
    type: 'Export Barrel',
    target: 'Toàn hệ thống',
    description: 'Export tập trung toàn bộ UI components dùng chung trong dự án.',
    keyExports: 'Button, Card, Input, Modal, Pagination, Loading...'
  },
  {
    category: 'Components Giao diện (Common)',
    name: 'Button.tsx',
    path: 'src/components/common/Button.tsx',
    type: 'Component Nút bấm (Button UI)',
    target: 'Toàn hệ thống',
    description: 'Nút bấm đa dạng biến thể (primary, outline, ghost, danger) kèm trạng thái loading xoay tròn.',
    keyExports: 'Button component'
  },
  {
    category: 'Components Giao diện (Common)',
    name: 'Card.tsx',
    path: 'src/components/common/Card.tsx',
    type: 'Component Khung chứa (Card UI)',
    target: 'Toàn hệ thống',
    description: 'Thẻ bao bọc nội dung có bo góc, bóng mờ và hiệu ứng hover.',
    keyExports: 'Card component'
  },
  {
    category: 'Components Giao diện (Common)',
    name: 'Input.tsx',
    path: 'src/components/common/Input.tsx',
    type: 'Component Ô nhập liệu (Input UI)',
    target: 'Toàn hệ thống',
    description: 'Ô nhập văn bản có label, thông báo lỗi validation, icon tiền tố và focus ring.',
    keyExports: 'Input component'
  },
  {
    category: 'Components Giao diện (Common)',
    name: 'Modal.tsx',
    path: 'src/components/common/Modal.tsx',
    type: 'Component Hộp thoại (Modal Dialog)',
    target: 'Toàn hệ thống',
    description: 'Cửa sổ popup nổi trên màn hình có backdrop làm mờ, nút đóng và hiệu ứng animate mượt.',
    keyExports: 'Modal component'
  },
  {
    category: 'Components Giao diện (Common)',
    name: 'ConfirmModal.tsx',
    path: 'src/components/common/ConfirmModal.tsx',
    type: 'Component Hộp thoại Xác nhận',
    target: 'Toàn hệ thống',
    description: 'Hộp thoại xác nhận hành động nguy hiểm (Xóa, Khóa tài khoản, Hủy đơn) với 2 nút Hủy và Đồng ý.',
    keyExports: 'ConfirmModal component'
  },
  {
    category: 'Components Giao diện (Common)',
    name: 'Loading.tsx',
    path: 'src/components/common/Loading.tsx',
    type: 'Component Hiệu ứng Tải (Spinner UI)',
    target: 'Toàn hệ thống',
    description: 'Hiển thị spinner xoay và thông điệp đang tải dữ liệu.',
    keyExports: 'Loading component'
  },
  {
    category: 'Components Giao diện (Common)',
    name: 'Pagination.tsx',
    path: 'src/components/common/Pagination.tsx',
    type: 'Component Phân trang (Pagination UI)',
    target: 'Toàn hệ thống',
    description: 'Thanh điều hướng số trang (Trang trước, Trang sau, Chọn trang cụ thể).',
    keyExports: 'Pagination component'
  },
  {
    category: 'Components Giao diện (Common)',
    name: 'PromptModal.tsx',
    path: 'src/components/common/PromptModal.tsx',
    type: 'Component Nhập dữ liệu nhanh',
    target: 'Toàn hệ thống',
    description: 'Hộp thoại popup yêu cầu người dùng nhập lý do hoặc phản hồi nhanh trước khi thực hiện tác vụ.',
    keyExports: 'PromptModal component'
  },
  {
    category: 'Components Giao diện (Common)',
    name: 'MemberTierBadge.tsx',
    path: 'src/components/common/MemberTierBadge.tsx',
    type: 'Component Huy hiệu Hạng',
    target: 'Khách hàng',
    description: 'Huy hiệu hiển thị cấp bậc hội viên (Đồng, Bạc, Vàng, Kim Cương) kèm màu sắc và icon đặc trưng.',
    keyExports: 'MemberTierBadge, MemberTierSelectCard, MEMBER_TIERS'
  },
  {
    category: 'Components Giao diện (Common)',
    name: 'DocumentViewerModal.tsx',
    path: 'src/components/common/DocumentViewerModal.tsx',
    type: 'Component Xem Văn bản Pháp lý',
    target: 'Toàn hệ thống',
    description: 'Modal đọc nội dung điều khoản sử dụng hoặc chính sách bảo mật ngay trên màn hình đăng ký.',
    keyExports: 'DocumentViewerModal component'
  },
  {
    category: 'Components Giao diện (Common)',
    name: 'ScrollToTop.tsx',
    path: 'src/components/common/ScrollToTop.tsx',
    type: 'Component Tự động cuộn trang',
    target: 'Toàn hệ thống',
    description: 'Tự động cuộn màn hình lên đầu trang mỗi khi người dùng chuyển tuyến đường URL.',
    keyExports: 'ScrollToTop component'
  },

  // Components Layout
  {
    category: 'Components Layout & Khung nhìn',
    name: 'index.ts',
    path: 'src/components/layout/index.ts',
    type: 'Export Barrel',
    target: 'Toàn hệ thống',
    description: 'Export tập trung toàn bộ Layouts của hệ thống.',
    keyExports: 'MainLayout, UserLayout, DashboardLayout, AdminLayout, SellerLayout, ShipperLayout...'
  },
  {
    category: 'Components Layout & Khung nhìn',
    name: 'Header.tsx',
    path: 'src/components/layout/Header.tsx',
    type: 'Component Thanh đầu trang (Header)',
    target: 'Khách hàng',
    description: 'Header chính của website: Logo, thanh tìm kiếm nhanh, chọn vị trí GPS, chuông thông báo, giỏ hàng và menu user.',
    keyExports: 'Header component'
  },
  {
    category: 'Components Layout & Khung nhìn',
    name: 'Footer.tsx',
    path: 'src/components/layout/Footer.tsx',
    type: 'Component Chân trang (Footer)',
    target: 'Khách hàng',
    description: 'Chân trang web: Thông tin liên hệ, link chính sách bảo mật, điều khoản sử dụng, trung tâm trợ giúp và bản quyền.',
    keyExports: 'Footer component'
  },
  {
    category: 'Components Layout & Khung nhìn',
    name: 'MainLayout.tsx',
    path: 'src/components/layout/MainLayout.tsx',
    type: 'Layout Khách hàng',
    target: 'Khách hàng',
    description: 'Khung layout chung bao bọc Header, nội dung trang con, LiveChatWidget, ShoppingDrawer và Footer.',
    keyExports: 'MainLayout component'
  },
  {
    category: 'Components Layout & Khung nhìn',
    name: 'UserLayout.tsx',
    path: 'src/components/layout/UserLayout.tsx',
    type: 'Layout Hồ sơ Cá nhân',
    target: 'Khách hàng',
    description: 'Khung layout trang cá nhân của khách hàng kèm thanh menu bên trái (Hồ sơ, Đơn hàng, Voucher, Sổ địa chỉ).',
    keyExports: 'UserLayout component'
  },
  {
    category: 'Components Layout & Khung nhìn',
    name: 'DashboardLayout.tsx',
    path: 'src/components/layout/DashboardLayout.tsx',
    type: 'Layout Dashboard Tổng quát',
    target: 'Đối tác & Admin',
    description: 'Khung layout nền tảng cho trang quản trị với Sidebar điều hướng, Header đối tác và khu vực nội dung.',
    keyExports: 'DashboardLayout component'
  },
  {
    category: 'Components Layout & Khung nhìn',
    name: 'AdminLayout.tsx',
    path: 'src/components/layout/admin/AdminLayout.tsx',
    type: 'Layout Quản trị viên',
    target: 'Quản trị viên',
    description: 'Layout dành riêng cho Admin với thanh menu sidebar 20+ chức năng quản lý.',
    keyExports: 'AdminLayout component'
  },
  {
    category: 'Components Layout & Khung nhìn',
    name: 'SellerLayout.tsx',
    path: 'src/components/layout/seller/SellerLayout.tsx',
    type: 'Layout Người bán',
    target: 'Người bán / Seller',
    description: 'Layout quản lý quán ăn: Thực đơn, Đơn hàng, Khuyến mãi, Doanh thu, Đánh giá, Cài đặt quán.',
    keyExports: 'SellerLayout component'
  },
  {
    category: 'Components Layout & Khung nhìn',
    name: 'ShipperLayout.tsx',
    path: 'src/components/layout/shipper/ShipperLayout.tsx',
    type: 'Layout Tài xế',
    target: 'Tài xế / Shipper',
    description: 'Layout bảng tài xế: Nhận đơn, Thu nhập, Lịch sử chuyến đi, Điểm uy tín, Ví tiền COD.',
    keyExports: 'ShipperLayout component'
  },
  {
    category: 'Components Layout & Khung nhìn',
    name: 'CoordinatorLayout.tsx',
    path: 'src/components/layout/coordinator/CoordinatorLayout.tsx',
    type: 'Layout Điều phối viên',
    target: 'Điều phối viên',
    description: 'Layout dành cho nhân viên điều vận: Bảng phân đơn thời gian thực, Giám sát shipper, Xử lý sự cố, Live chat.',
    keyExports: 'CoordinatorLayout component'
  },
  {
    category: 'Components Layout & Khung nhìn',
    name: 'NotificationBell.tsx',
    path: 'src/components/layout/NotificationBell.tsx',
    type: 'Component Chuông thông báo',
    target: 'Toàn hệ thống',
    description: 'Chuông thông báo có huy hiệu đếm số chưa đọc và danh sách popup thông báo realtime.',
    keyExports: 'NotificationBell component'
  },
  {
    category: 'Components Layout & Khung nhìn',
    name: 'ShoppingDrawer.tsx',
    path: 'src/components/layout/ShoppingDrawer.tsx',
    type: 'Component Ngăn kéo Giỏ hàng & Đơn hàng',
    target: 'Khách hàng',
    description: 'Ngăn kéo trượt bên phải hiển thị giỏ hàng các món ăn và danh sách theo dõi trạng thái đơn hàng realtime.',
    keyExports: 'ShoppingDrawer component'
  },

  // Components Auth
  {
    category: 'Components Xác thực (Auth)',
    name: 'LoginForm.tsx',
    path: 'src/components/auth/LoginForm.tsx',
    type: 'Form Đăng nhập',
    target: 'Toàn hệ thống',
    description: 'Biểu mẫu đăng nhập hỗ trợ tài khoản/mật khẩu, Google OAuth, Microsoft SSO và đăng nhập bằng số điện thoại Firebase OTP.',
    keyExports: 'LoginForm component'
  },
  {
    category: 'Components Xác thực (Auth)',
    name: 'RegisterForm.tsx',
    path: 'src/components/auth/RegisterForm.tsx',
    type: 'Form Đăng ký',
    target: 'Khách hàng / Người bán',
    description: 'Biểu mẫu đăng ký tài khoản khách hàng hoặc đối tác quán ăn (tải giấy phép kinh doanh, ảnh quán, CCCD).',
    keyExports: 'RegisterForm component'
  },
  {
    category: 'Components Xác thực (Auth)',
    name: 'ForgotPasswordModal.tsx',
    path: 'src/components/auth/ForgotPasswordModal.tsx',
    type: 'Modal Quên mật khẩu',
    target: 'Khách hàng',
    description: 'Modal gửi email mã OTP đặt lại mật khẩu mới.',
    keyExports: 'ForgotPasswordModal component'
  },
  {
    category: 'Components Xác thực (Auth)',
    name: 'ChangePasswordModal.tsx',
    path: 'src/components/auth/ChangePasswordModal.tsx',
    type: 'Modal Đổi mật khẩu',
    target: 'Toàn hệ thống',
    description: 'Modal đổi mật khẩu tài khoản yêu cầu xác thực mật khẩu cũ.',
    keyExports: 'ChangePasswordModal component'
  },
  {
    category: 'Components Xác thực (Auth)',
    name: 'ChangeContactModal.tsx',
    path: 'src/components/auth/ChangeContactModal.tsx',
    type: 'Modal Đổi SĐT/Email',
    target: 'Toàn hệ thống',
    description: 'Modal cập nhật số điện thoại hoặc địa chỉ email cá nhân có xác minh OTP.',
    keyExports: 'ChangeContactModal component'
  },
  {
    category: 'Components Xác thực (Auth)',
    name: 'UpdateProfileModal.tsx',
    path: 'src/components/auth/UpdateProfileModal.tsx',
    type: 'Modal Cập nhật Hồ sơ',
    target: 'Toàn hệ thống',
    description: 'Modal chỉnh sửa họ tên, avatar và thông tin cá nhân.',
    keyExports: 'UpdateProfileModal component'
  },

  // Components Chat
  {
    category: 'Components Trò chuyện (Chat)',
    name: 'LiveChatWidget.tsx',
    path: 'src/components/chat/LiveChatWidget.tsx',
    type: 'Widget Chat Nổi',
    target: 'Khách hàng',
    description: 'Nút chat nổi góc dưới màn hình giúp khách hàng nhắn tin trực tiếp với nhân viên CSKH/Điều phối viên qua SignalR.',
    keyExports: 'LiveChatWidget component'
  },
  {
    category: 'Components Trò chuyện (Chat)',
    name: 'OrderSellerChatModal.tsx',
    path: 'src/components/chat/OrderSellerChatModal.tsx',
    type: 'Modal Chat Đơn hàng',
    target: 'Khách hàng / Người bán',
    description: 'Khung chat trao đổi trực tiếp giữa Khách hàng và Chủ quán theo từng đơn hàng cụ thể.',
    keyExports: 'OrderSellerChatModal component'
  },
  {
    category: 'Components Trò chuyện (Chat)',
    name: 'RestaurantChatModal.tsx',
    path: 'src/components/chat/RestaurantChatModal.tsx',
    type: 'Modal Chat Quán ăn',
    target: 'Khách hàng / Người bán',
    description: 'Khung chat trực tiếp giữa khách hàng và nhà hàng khi xem trang chi tiết quán.',
    keyExports: 'RestaurantChatModal component'
  },
  {
    category: 'Components Trò chuyện (Chat)',
    name: 'SupportChatDashboard.tsx',
    path: 'src/components/chat/SupportChatDashboard.tsx',
    type: 'Bảng Quản lý Chat CSKH',
    target: 'Điều phối viên / Admin',
    description: 'Giao diện trung tâm tiếp nhận, lọc danh sách phòng chat và trả lời tin nhắn của nhiều khách hàng cùng lúc.',
    keyExports: 'SupportChatDashboard component'
  },

  // Components Payment & Order
  {
    category: 'Components Đơn hàng & Thanh toán',
    name: 'SepayQrPaymentModal.tsx',
    path: 'src/components/payment/SepayQrPaymentModal.tsx',
    type: 'Modal Quét mã VietQR SePay',
    target: 'Khách hàng / Đối tác',
    description: 'Hiển thị mã QR thanh toán động VietQR SePay kèm đồng hồ đếm ngược, tự động nhận diện thanh toán thành công qua SignalR.',
    keyExports: 'SepayQrPaymentModal component'
  },
  {
    category: 'Components Đơn hàng & Thanh toán',
    name: 'CustomerOrderDetailModal.tsx',
    path: 'src/components/order/CustomerOrderDetailModal.tsx',
    type: 'Modal Chi tiết Đơn Khách',
    target: 'Khách hàng',
    description: 'Xem toàn bộ lộ trình đơn hàng, món ăn, phí ship, hóa đơn, nút hủy đơn, nút mở chat với quán và đánh giá món sau giao.',
    keyExports: 'CustomerOrderDetailModal component'
  },
  {
    category: 'Components Đơn hàng & Thanh toán',
    name: 'ShipperOrderDetailModal.tsx',
    path: 'src/components/order/ShipperOrderDetailModal.tsx',
    type: 'Modal Chi tiết Đơn Tài xế',
    target: 'Tài xế / Shipper',
    description: 'Xem thông tin lộ trình lấy hàng, giao hàng, số điện thoại khách, tiền thu hộ COD và cước phí tài xế nhận được.',
    keyExports: 'ShipperOrderDetailModal component'
  },

  // Components Product & Restaurant
  {
    category: 'Components Sản phẩm & Nhà hàng',
    name: 'ProductCard.tsx',
    path: 'src/components/product/ProductCard.tsx',
    type: 'Component Thẻ món ăn',
    target: 'Khách hàng',
    description: 'Thẻ hiển thị món ăn gồm hình ảnh, tên món, giá gốc, giá flash sale, huy hiệu giảm giá và nút thêm vào giỏ.',
    keyExports: 'ProductCard component'
  },
  {
    category: 'Components Sản phẩm & Nhà hàng',
    name: 'ProductList.tsx',
    path: 'src/components/product/ProductList.tsx',
    type: 'Component Danh sách món ăn',
    target: 'Khách hàng',
    description: 'Hiển thị lưới danh sách các thẻ món ăn kèm phân trang.',
    keyExports: 'ProductList component'
  },
  {
    category: 'Components Sản phẩm & Nhà hàng',
    name: 'ProductSearch.tsx',
    path: 'src/components/product/ProductSearch.tsx',
    type: 'Component Tìm kiếm món ăn',
    target: 'Khách hàng',
    description: 'Thanh tìm kiếm món ăn theo từ khóa kèm bộ lọc danh mục nhanh.',
    keyExports: 'ProductSearch component'
  },
  {
    category: 'Components Sản phẩm & Nhà hàng',
    name: 'ProductReviews.tsx',
    path: 'src/components/product/ProductReviews.tsx',
    type: 'Component Đánh giá món ăn',
    target: 'Khách hàng',
    description: 'Hiển thị danh sách nhận xét, số sao đánh giá và form gửi đánh giá món ăn kèm phản hồi của quán.',
    keyExports: 'ProductReviews component'
  },
  {
    category: 'Components Sản phẩm & Nhà hàng',
    name: 'ProductLocationMeta.tsx',
    path: 'src/components/product/ProductLocationMeta.tsx',
    type: 'Component Khoảng cách & Thời gian giao',
    target: 'Khách hàng',
    description: 'Hiển thị khoảng cách (km) và thời gian giao hàng dự kiến từ quán ăn đến vị trí người dùng.',
    keyExports: 'ProductLocationMeta component'
  },
  {
    category: 'Components Sản phẩm & Nhà hàng',
    name: 'MemberTierPricingNote.tsx',
    path: 'src/components/product/MemberTierPricingNote.tsx',
    type: 'Component Ghi chú Giảm giá Hạng',
    target: 'Khách hàng',
    description: 'Hiển thị mức giá ưu đãi đặc quyền theo hạng thành viên (Bạc, Vàng, Kim Cương) trên thẻ món ăn.',
    keyExports: 'MemberTierPricingNote component'
  },
  {
    category: 'Components Sản phẩm & Nhà hàng',
    name: 'RestaurantCard.tsx',
    path: 'src/components/restaurant/RestaurantCard.tsx',
    type: 'Component Thẻ nhà hàng',
    target: 'Khách hàng',
    description: 'Thẻ hiển thị thông tin quán ăn: Ảnh bìa, tên quán, địa chỉ, khoảng cách km, đánh giá sao và trạng thái đóng/mở cửa.',
    keyExports: 'RestaurantCard component'
  },

  // Components Profile & Promotions & UI
  {
    category: 'Components Khuyến mãi & Hồ sơ & UI',
    name: 'FlashSaleSection.tsx',
    path: 'src/components/promotions/FlashSaleSection.tsx',
    type: 'Section Flash Sale Giờ Vàng',
    target: 'Khách hàng',
    description: 'Khu vực hiển thị danh sách các món ăn giảm giá sốc có đồng hồ đếm ngược thời gian kết thúc đợt.',
    keyExports: 'FlashSaleSection component'
  },
  {
    category: 'Components Khuyến mãi & Hồ sơ & UI',
    name: 'BuyXGetYSection.tsx',
    path: 'src/components/promotions/BuyXGetYSection.tsx',
    type: 'Section Mua X Tặng Y',
    target: 'Khách hàng',
    description: 'Khu vực hiển thị các combo ưu đãi mua món chính tặng kèm món phụ đặc biệt.',
    keyExports: 'BuyXGetYSection component'
  },
  {
    category: 'Components Khuyến mãi & Hồ sơ & UI',
    name: 'RecommendationSection.tsx',
    path: 'src/components/recommendations/RecommendationSection.tsx',
    type: 'Section Gợi ý Món Cá nhân hóa',
    target: 'Khách hàng',
    description: 'Gợi ý món ngon thông minh dựa trên lịch sử đặt hàng, xu hướng ẩm thực và khoảng cách gần nhất.',
    keyExports: 'RecommendationSection component'
  },
  {
    category: 'Components Khuyến mãi & Hồ sơ & UI',
    name: 'CustomerLoyalty.tsx',
    path: 'src/components/profile/CustomerLoyalty.tsx',
    type: 'Tab Điểm thưởng & Đổi quà',
    target: 'Khách hàng',
    description: 'Xem điểm tích lũy hiện tại, thanh tiến trình thăng hạng thành viên và danh sách voucher có thể đổi bằng điểm.',
    keyExports: 'CustomerLoyalty component'
  },
  {
    category: 'Components Khuyến mãi & Hồ sơ & UI',
    name: 'CustomerVouchers.tsx',
    path: 'src/components/profile/CustomerVouchers.tsx',
    type: 'Tab Ví Voucher của tôi',
    target: 'Khách hàng',
    description: 'Danh sách các mã giảm giá cá nhân đã lưu hoặc đổi được để sử dụng khi thanh toán.',
    keyExports: 'CustomerVouchers component'
  },
  {
    category: 'Components Khuyến mãi & Hồ sơ & UI',
    name: 'CustomerApplications.tsx',
    path: 'src/components/profile/CustomerApplications.tsx',
    type: 'Tab Lịch sử Đăng ký Đối tác',
    target: 'Khách hàng',
    description: 'Theo dõi tiến độ duyệt hồ sơ làm Người Bán (Seller) hoặc Tài Xế (Shipper) kèm nút cập nhật nộp lại khi bị từ chối.',
    keyExports: 'CustomerApplications component'
  },
  {
    category: 'Components Khuyến mãi & Hồ sơ & UI',
    name: 'FavoriteRestaurants.tsx',
    path: 'src/components/profile/FavoriteRestaurants.tsx',
    type: 'Tab Quán ăn Yêu thích',
    target: 'Khách hàng',
    description: 'Danh sách các nhà hàng khách hàng đã bấm yêu thích để đặt lại nhanh chóng.',
    keyExports: 'FavoriteRestaurants component'
  },
  {
    category: 'Components Khuyến mãi & Hồ sơ & UI',
    name: 'UserAddressManager.tsx',
    path: 'src/components/profile/UserAddressManager.tsx',
    type: 'Tab Quản lý Sổ Địa chỉ',
    target: 'Khách hàng',
    description: 'Thêm, sửa, xóa các địa chỉ nhận hàng (Nhà riêng, Cơ quan) kèm tọa độ GPS.',
    keyExports: 'UserAddressManager component'
  },
  {
    category: 'Components Khuyến mãi & Hồ sơ & UI',
    name: 'CarouselSlider.tsx',
    path: 'src/components/ui/CarouselSlider.tsx',
    type: 'Component Băng chuyền Trượt',
    target: 'Khách hàng',
    description: 'Thanh cuộn trượt ngang mượt mà cho danh sách sản phẩm, nhà hàng hoặc banner.',
    keyExports: 'CarouselSlider component'
  },
  {
    category: 'Components Khuyến mãi & Hồ sơ & UI',
    name: 'SectionHeader.tsx',
    path: 'src/components/ui/SectionHeader.tsx',
    type: 'Component Tiêu đề Mục',
    target: 'Khách hàng',
    description: 'Tiêu đề từng mục trang chủ kèm icon, tiêu đề phụ và nút "Xem tất cả".',
    keyExports: 'SectionHeader component'
  },
  {
    category: 'Components Khuyến mãi & Hồ sơ & UI',
    name: 'OrderHeatmap.tsx',
    path: 'src/components/admin/OrderHeatmap.tsx',
    type: 'Component Bản đồ Nhiệt Đơn hàng',
    target: 'Quản trị viên',
    description: 'Hiển thị bản đồ nhiệt (Heatmap Leaflet) biểu thị mật độ phân bố đơn hàng trên từng khu vực địa lý.',
    keyExports: 'OrderHeatmap component'
  },

  // ─── 8. PAGES ───────────────────────────────────────────────────────────────
  {
    category: 'Trang Giao diện (Pages - Chung & Khách hàng)',
    name: 'HomePage.tsx',
    path: 'src/pages/HomePage.tsx',
    type: 'Trang Chủ (Home Page)',
    target: 'Khách hàng',
    description: 'Trang chủ của sàn: Hero Banner, Flash Sale giờ vàng, Combo Mua X Tặng Y, Món ăn gợi ý cá nhân hóa, Quán ăn gần đây.',
    keyExports: 'HomePage component'
  },
  {
    category: 'Trang Giao diện (Pages - Chung & Khách hàng)',
    name: 'LoginPage.tsx',
    path: 'src/pages/LoginPage.tsx',
    type: 'Trang Đăng nhập',
    target: 'Toàn hệ thống',
    description: 'Màn hình đăng nhập tài khoản với giao diện banner thương hiệu.',
    keyExports: 'LoginPage component'
  },
  {
    category: 'Trang Giao diện (Pages - Chung & Khách hàng)',
    name: 'RegisterPage.tsx',
    path: 'src/pages/RegisterPage.tsx',
    type: 'Trang Đăng ký',
    target: 'Toàn hệ thống',
    description: 'Màn hình đăng ký thành viên mới hoặc đăng ký mở quán ăn.',
    keyExports: 'RegisterPage component'
  },
  {
    category: 'Trang Giao diện (Pages - Chung & Khách hàng)',
    name: 'ProductsPage.tsx',
    path: 'src/pages/ProductsPage.tsx',
    type: 'Trang Tìm kiếm Món ăn',
    target: 'Khách hàng',
    description: 'Khám phá toàn bộ món ăn: Lọc theo danh mục, lọc theo khoảng giá, sắp xếp theo giá tăng/giảm, bán chạy, đánh giá cao.',
    keyExports: 'ProductsPage component'
  },
  {
    category: 'Trang Giao diện (Pages - Chung & Khách hàng)',
    name: 'ProductDetailPage.tsx',
    path: 'src/pages/ProductDetailPage.tsx',
    type: 'Trang Chi tiết Món ăn',
    target: 'Khách hàng',
    description: 'Chi tiết món ăn: Chọn size, chọn topping ăn kèm, xem đánh giá của khách hàng, tính tổng tiền và thêm vào giỏ hàng.',
    keyExports: 'ProductDetailPage component'
  },
  {
    category: 'Trang Giao diện (Pages - Chung & Khách hàng)',
    name: 'RestaurantsPage.tsx',
    path: 'src/pages/RestaurantsPage.tsx',
    type: 'Trang Danh sách Nhà hàng',
    target: 'Khách hàng',
    description: 'Danh sách các quán ăn đối tác trên hệ thống kèm bộ lọc tìm kiếm.',
    keyExports: 'RestaurantsPage component'
  },
  {
    category: 'Trang Giao diện (Pages - Chung & Khách hàng)',
    name: 'RestaurantDetailPage.tsx',
    path: 'src/pages/RestaurantDetailPage.tsx',
    type: 'Trang Thực đơn Nhà hàng',
    target: 'Khách hàng',
    description: 'Xem toàn bộ thực đơn theo từng danh mục của một quán ăn cụ thể, thông tin quán, giờ mở cửa và nút nhắn tin với quán.',
    keyExports: 'RestaurantDetailPage component'
  },
  {
    category: 'Trang Giao diện (Pages - Chung & Khách hàng)',
    name: 'CheckoutPage.tsx',
    path: 'src/pages/CheckoutPage.tsx',
    type: 'Trang Thanh toán & Đặt hàng',
    target: 'Khách hàng',
    description: 'Xử lý đặt hàng: Chọn địa chỉ từ sổ/bản đồ Leaflet, áp dụng mã voucher, tính phí ship, chọn phương thức thanh toán (COD/SePay QR).',
    keyExports: 'CheckoutPage component'
  },
  {
    category: 'Trang Giao diện (Pages - Chung & Khách hàng)',
    name: 'FlashSalePage.tsx',
    path: 'src/pages/FlashSalePage.tsx',
    type: 'Trang Flash Sale Giờ Vàng',
    target: 'Khách hàng',
    description: 'Tập hợp tất cả các món ăn đang giảm giá sốc trong phiên Flash Sale hiện tại.',
    keyExports: 'FlashSalePage component'
  },
  {
    category: 'Trang Giao diện (Pages - Chung & Khách hàng)',
    name: 'BuyXGetYPage.tsx',
    path: 'src/pages/BuyXGetYPage.tsx',
    type: 'Trang Mua X Tặng Y',
    target: 'Khách hàng',
    description: 'Tập hợp toàn bộ các chương trình ưu đãi mua kèm tặng kèm của các nhà hàng.',
    keyExports: 'BuyXGetYPage component'
  },
  {
    category: 'Trang Giao diện (Pages - Chung & Khách hàng)',
    name: 'PromotionsPage.tsx',
    path: 'src/pages/PromotionsPage.tsx',
    type: 'Trang Trung tâm Khuyến mãi',
    target: 'Khách hàng',
    description: 'Tổng hợp toàn bộ các ưu đãi hot, mã giảm giá voucher và chương trình thành viên.',
    keyExports: 'PromotionsPage component'
  },
  {
    category: 'Trang Giao diện (Pages - Chung & Khách hàng)',
    name: 'ProfilePage.tsx',
    path: 'src/pages/ProfilePage.tsx',
    type: 'Trang Quản lý Tài khoản',
    target: 'Khách hàng',
    description: 'Trang trung tâm quản lý tài khoản khách hàng (Hồ sơ, Điểm thưởng, Voucher, Đơn đăng ký đối tác, Sổ địa chỉ).',
    keyExports: 'ProfilePage component'
  },
  {
    category: 'Trang Giao diện (Pages - Chung & Khách hàng)',
    name: 'CustomerMessagesPage.tsx',
    path: 'src/pages/CustomerMessagesPage.tsx',
    type: 'Trang Hộp thư Khách hàng',
    target: 'Khách hàng',
    description: 'Hộp thư tin nhắn trò chuyện của khách hàng với các nhà hàng theo từng đơn hàng.',
    keyExports: 'CustomerMessagesPage component'
  },
  {
    category: 'Trang Giao diện (Pages - Chung & Khách hàng)',
    name: 'SellerApplyPage.tsx',
    path: 'src/pages/SellerApplyPage.tsx',
    type: 'Trang Đăng ký Mở quán',
    target: 'Khách vãng lai / Đối tác',
    description: 'Trang giới thiệu quyền lợi và form đăng ký trở thành nhà hàng đối tác bán đồ ăn trên UniEats.',
    keyExports: 'SellerApplyPage component'
  },
  {
    category: 'Trang Giao diện (Pages - Chung & Khách hàng)',
    name: 'ShipperApplyPage.tsx',
    path: 'src/pages/ShipperApplyPage.tsx',
    type: 'Trang Đăng ký Làm Tài xế',
    target: 'Khách vãng lai / Tài xế',
    description: 'Trang giới thiệu quyền lợi và form đăng ký trở thành đối tác giao hàng.',
    keyExports: 'ShipperApplyPage component'
  },
  {
    category: 'Trang Giao diện (Pages - Chung & Khách hàng)',
    name: 'NotFoundPage.tsx',
    path: 'src/pages/NotFoundPage.tsx',
    type: 'Trang Lỗi 404',
    target: 'Toàn hệ thống',
    description: 'Trang thông báo lỗi 404 khi người dùng truy cập vào đường dẫn URL không tồn tại.',
    keyExports: 'NotFoundPage component'
  },
  {
    category: 'Trang Giao diện (Pages - Chung & Khách hàng)',
    name: 'index.ts',
    path: 'src/pages/index.ts',
    type: 'Export Barrel',
    target: 'Toàn hệ thống',
    description: 'Export tập trung toàn bộ các trang màn hình trong dự án.',
    keyExports: 'HomePage, LoginPage, RegisterPage, CheckoutPage...'
  },

  // Pages - Payment
  {
    category: 'Trang Giao diện (Pages - Thanh toán & Ví)',
    name: 'CustomerWalletPage.tsx',
    path: 'src/pages/payment/CustomerWalletPage.tsx',
    type: 'Trang Ví Khách hàng',
    target: 'Khách hàng',
    description: 'Ví điện tử khách hàng: Theo dõi số dư, nạp tiền vào ví qua VietQR SePay và xem lịch sử chi tiêu.',
    keyExports: 'CustomerWalletPage component'
  },
  {
    category: 'Trang Giao diện (Pages - Thanh toán & Ví)',
    name: 'PartnerWalletPages.tsx',
    path: 'src/pages/payment/PartnerWalletPages.tsx',
    type: 'Trang Ví Đối tác (Seller & Shipper)',
    target: 'Người bán / Tài xế',
    description: 'Quản lý tài chính đối tác: SellerWalletPage (doanh thu bán món, rút tiền về ngân hàng) & ShipperWalletPage (thu nhập giao hàng, nộp trả COD).',
    keyExports: 'SellerWalletPage, ShipperWalletPage, TransactionHistory'
  },
  {
    category: 'Trang Giao diện (Pages - Thanh toán & Ví)',
    name: 'PaymentHistoryPage.tsx',
    path: 'src/pages/payment/PaymentHistoryPage.tsx',
    type: 'Trang Lịch sử Giao dịch',
    target: 'Khách hàng',
    description: 'Danh sách các lần thanh toán đơn hàng online kèm mã hóa đơn và trạng thái giao dịch.',
    keyExports: 'PaymentHistoryPage component'
  },
  {
    category: 'Trang Giao diện (Pages - Thanh toán & Ví)',
    name: 'PaymentResultPages.tsx',
    path: 'src/pages/payment/PaymentResultPages.tsx',
    type: 'Trang Kết quả Thanh toán',
    target: 'Khách hàng',
    description: 'Thông báo kết quả sau thanh toán SePay: PaymentSuccessPage (thành công), PaymentErrorPage (thất bại), PaymentCancelPage (đã hủy).',
    keyExports: 'PaymentSuccessPage, PaymentErrorPage, PaymentCancelPage'
  },
  {
    category: 'Trang Giao diện (Pages - Thanh toán & Ví)',
    name: 'SepayRedirectPage.tsx',
    path: 'src/pages/payment/SepayRedirectPage.tsx',
    type: 'Trang Điều hướng SePay',
    target: 'Khách hàng',
    description: 'Trang trung gian mở modal quét mã QR khi khách truy cập từ link thanh toán bên ngoài.',
    keyExports: 'SepayRedirectPage component'
  },

  // Pages - Support & Shared
  {
    category: 'Trang Giao diện (Pages - Hỗ trợ & Thông tin)',
    name: 'HelpCenterPage.tsx',
    path: 'src/pages/support/HelpCenterPage.tsx',
    type: 'Trang Trung tâm Trợ giúp',
    target: 'Toàn hệ thống',
    description: 'Xem danh sách câu hỏi thường gặp FAQ và nút mở Live Chat hỗ trợ.',
    keyExports: 'HelpCenterPage component'
  },
  {
    category: 'Trang Giao diện (Pages - Hỗ trợ & Thông tin)',
    name: 'TermsOfUsePage.tsx',
    path: 'src/pages/support/TermsOfUsePage.tsx',
    type: 'Trang Điều khoản Sử dụng',
    target: 'Toàn hệ thống',
    description: 'Văn bản điều khoản dịch vụ cho Khách hàng, Người bán và Tài xế.',
    keyExports: 'TermsOfUsePage component'
  },
  {
    category: 'Trang Giao diện (Pages - Hỗ trợ & Thông tin)',
    name: 'PrivacyPolicyPage.tsx',
    path: 'src/pages/support/PrivacyPolicyPage.tsx',
    type: 'Trang Chính sách Bảo mật',
    target: 'Toàn hệ thống',
    description: 'Văn bản cam kết bảo mật thông tin cá nhân của người dùng.',
    keyExports: 'PrivacyPolicyPage component'
  },
  {
    category: 'Trang Giao diện (Pages - Hỗ trợ & Thông tin)',
    name: 'UserReportIncidentPage.tsx',
    path: 'src/pages/support/UserReportIncidentPage.tsx',
    type: 'Trang Báo cáo Sự cố',
    target: 'Khách hàng / Đối tác',
    description: 'Gửi khiếu nại hoặc báo cáo sự cố đơn hàng kèm tải ảnh bằng chứng.',
    keyExports: 'UserReportIncidentPage component'
  },
  {
    category: 'Trang Giao diện (Pages - Hỗ trợ & Thông tin)',
    name: 'DashboardProfilePage.tsx',
    path: 'src/pages/shared/DashboardProfilePage.tsx',
    type: 'Trang Hồ sơ Dashboard',
    target: 'Đối tác & Admin',
    description: 'Trang xem và cập nhật thông tin cá nhân của chủ quán, tài xế và nhân viên.',
    keyExports: 'DashboardProfilePage component'
  },
  {
    category: 'Trang Giao diện (Pages - Hỗ trợ & Thông tin)',
    name: 'MaintenancePage.tsx',
    path: 'src/pages/shared/MaintenancePage.tsx',
    type: 'Trang Thông báo Bảo trì',
    target: 'Toàn hệ thống',
    description: 'Hiển thị khi hệ thống đang trong thời gian bảo trì định kỳ.',
    keyExports: 'MaintenancePage component'
  },

  // Pages - Coordinator
  {
    category: 'Trang Giao diện (Pages - Điều phối viên)',
    name: 'DispatchBoardPage.tsx',
    path: 'src/pages/coordinator/DispatchBoardPage.tsx',
    type: 'Bảng Điều phối Thời gian thực',
    target: 'Điều phối viên',
    description: 'Bảng điều vận đơn hàng: Tìm và đề xuất shipper gần nhất với đếm ngược 60s, gán đơn thủ công và thu hồi đơn.',
    keyExports: 'DispatchBoardPage default component'
  },
  {
    category: 'Trang Giao diện (Pages - Điều phối viên)',
    name: 'MonitorShippersPage.tsx',
    path: 'src/pages/coordinator/MonitorShippersPage.tsx',
    type: 'Trang Giám sát Tài xế',
    target: 'Điều phối viên',
    description: 'Theo dõi tài xế đang Online/Offline, tạm khóa tài xế vi phạm, điều chỉnh điểm uy tín.',
    keyExports: 'MonitorShippersPage default component'
  },
  {
    category: 'Trang Giao diện (Pages - Điều phối viên)',
    name: 'CoordinatorIncidentsPage.tsx',
    path: 'src/pages/coordinator/CoordinatorIncidentsPage.tsx',
    type: 'Trang Xử lý Sự cố Giao hàng',
    target: 'Điều phối viên',
    description: 'Tiếp nhận các đơn giao thất bại, yêu cầu shipper giải trình, ra phán quyết bồi thường hoặc phạt điểm.',
    keyExports: 'CoordinatorIncidentsPage component'
  },
  {
    category: 'Trang Giao diện (Pages - Điều phối viên)',
    name: 'DispatchHistoryPage.tsx',
    path: 'src/pages/coordinator/DispatchHistoryPage.tsx',
    type: 'Trang Nhật ký Điều phối',
    target: 'Điều phối viên',
    description: 'Lưu vết lịch sử các thao tác gán đơn, chấp nhận, từ chối, hết hạn hoặc hủy đơn.',
    keyExports: 'DispatchHistoryPage default component'
  },
  {
    category: 'Trang Giao diện (Pages - Điều phối viên)',
    name: 'CoordinatorChatPage.tsx',
    path: 'src/pages/coordinator/CoordinatorChatPage.tsx',
    type: 'Trang Live Chat Điều phối',
    target: 'Điều phối viên',
    description: 'Hỗ trợ khách hàng và tài xế trực tiếp qua khung Live Chat.',
    keyExports: 'CoordinatorChatPage component'
  },
  {
    category: 'Trang Giao diện (Pages - Điều phối viên)',
    name: 'AdjustReputationModal.tsx',
    path: 'src/pages/coordinator/components/AdjustReputationModal.tsx',
    type: 'Modal Điều chỉnh Điểm Uy tín',
    target: 'Điều phối viên',
    description: 'Modal tăng/giảm sao uy tín của tài xế kèm lý do.',
    keyExports: 'AdjustReputationModal component'
  },
  {
    category: 'Trang Giao diện (Pages - Điều phối viên)',
    name: 'CreateTicketModal.tsx',
    path: 'src/pages/coordinator/components/CreateTicketModal.tsx',
    type: 'Modal Tạo Phiếu Hỗ trợ',
    target: 'Điều phối viên',
    description: 'Modal tạo ticket khiếu nại thay cho khách hàng hoặc tài xế.',
    keyExports: 'CreateTicketModal component'
  },

  // Pages - Seller
  {
    category: 'Trang Giao diện (Pages - Người bán / Quán ăn)',
    name: 'SellerDashboardPage.tsx',
    path: 'src/pages/SellerDashboardPage.tsx',
    type: 'Trang Tổng quan Người bán',
    target: 'Người bán / Seller',
    description: 'Tổng quan quán ăn: Doanh thu hôm nay, số đơn mới, biểu đồ bán hàng và đơn chờ xác nhận.',
    keyExports: 'SellerDashboardPage component'
  },
  {
    category: 'Trang Giao diện (Pages - Người bán / Quán ăn)',
    name: 'SellerOrdersPage.tsx',
    path: 'src/pages/seller/SellerOrdersPage.tsx',
    type: 'Trang Quản lý Đơn hàng Quán',
    target: 'Người bán / Seller',
    description: 'Xử lý đơn theo luồng thời gian thực: Xác nhận -> Nấu xong -> Báo shipper lấy món, in bill bếp và chat với khách.',
    keyExports: 'SellerOrdersPage component'
  },
  {
    category: 'Trang Giao diện (Pages - Người bán / Quán ăn)',
    name: 'SellerProductsPage.tsx',
    path: 'src/pages/seller/SellerProductsPage.tsx',
    type: 'Trang Quản lý Món ăn',
    target: 'Người bán / Seller',
    description: 'Quản lý món: Thêm món mới, tải ảnh, cấu hình kích cỡ (Size), topping ăn kèm, giá bán và bật/tắt còn hàng.',
    keyExports: 'SellerProductsPage component'
  },
  {
    category: 'Trang Giao diện (Pages - Người bán / Quán ăn)',
    name: 'SellerCategoriesPage.tsx',
    path: 'src/pages/seller/SellerCategoriesPage.tsx',
    type: 'Trang Quản lý Danh mục Thực đơn',
    target: 'Người bán / Seller',
    description: 'Tổ chức thực đơn quán theo danh mục (Cơm, Bún, Nước uống...) kèm thứ tự hiển thị.',
    keyExports: 'SellerCategoriesPage component'
  },
  {
    category: 'Trang Giao diện (Pages - Người bán / Quán ăn)',
    name: 'SellerToppingsPage.tsx',
    path: 'src/pages/seller/SellerToppingsPage.tsx',
    type: 'Trang Quản lý Topping',
    target: 'Người bán / Seller',
    description: 'Quản lý các loại topping / món thêm: Thêm mới, chỉnh giá và bật/tắt trạng thái còn hàng.',
    keyExports: 'SellerToppingsPage component'
  },
  {
    category: 'Trang Giao diện (Pages - Người bán / Quán ăn)',
    name: 'SellerDiscountsPage.tsx',
    path: 'src/pages/seller/SellerDiscountsPage.tsx',
    type: 'Trang Quản lý Voucher Quán',
    target: 'Người bán / Seller',
    description: 'Tạo mã giảm giá riêng của quán theo % hoặc tiền cố định, giới hạn lượt dùng và theo dõi thống kê sử dụng.',
    keyExports: 'SellerDiscountsPage component'
  },
  {
    category: 'Trang Giao diện (Pages - Người bán / Quán ăn)',
    name: 'SellerPromotionsPage.tsx',
    path: 'src/pages/seller/SellerPromotionsPage.tsx',
    type: 'Trang Khuyến mãi Mua X Tặng Y',
    target: 'Người bán / Seller',
    description: 'Cấu hình chương trình mua món X tặng món Y theo thời gian hiệu lực.',
    keyExports: 'SellerPromotionsPage component'
  },
  {
    category: 'Trang Giao diện (Pages - Người bán / Quán ăn)',
    name: 'SellerFlashSalesPage.tsx',
    path: 'src/pages/seller/SellerFlashSalesPage.tsx',
    type: 'Trang Đăng ký Flash Sale',
    target: 'Người bán / Seller',
    description: 'Đăng ký các món ăn tham gia đợt giảm giá giờ vàng của hệ thống.',
    keyExports: 'SellerFlashSalesPage component'
  },
  {
    category: 'Trang Giao diện (Pages - Người bán / Quán ăn)',
    name: 'SellerReviewsPage.tsx',
    path: 'src/pages/seller/SellerReviewsPage.tsx',
    type: 'Trang Đánh giá & Phản hồi Khách',
    target: 'Người bán / Seller',
    description: 'Theo dõi nhận xét của khách, gửi phản hồi chính thức của quán hoặc báo cáo đánh giá xấu sai sự thật.',
    keyExports: 'SellerReviewsPage component'
  },
  {
    category: 'Trang Giao diện (Pages - Người bán / Quán ăn)',
    name: 'SellerSettingsPage.tsx',
    path: 'src/pages/seller/SellerSettingsPage.tsx',
    type: 'Trang Cài đặt Thông tin Quán',
    target: 'Người bán / Seller',
    description: 'Cài đặt giờ mở/đóng cửa, tọa độ vị trí quán trên bản đồ Leaflet, ảnh đại diện, ảnh bìa và hotline.',
    keyExports: 'SellerSettingsPage component'
  },
  {
    category: 'Trang Giao diện (Pages - Người bán / Quán ăn)',
    name: 'SellerChatPage.tsx',
    path: 'src/pages/seller/SellerChatPage.tsx',
    type: 'Trang Live Chat của Quán',
    target: 'Người bán / Seller',
    description: 'Nhắn tin trực tiếp với khách hàng của từng đơn hàng qua SignalR realtime.',
    keyExports: 'SellerChatPage component'
  },
  {
    category: 'Trang Giao diện (Pages - Người bán / Quán ăn)',
    name: 'SellerMallApplicationPage.tsx',
    path: 'src/pages/seller/SellerMallApplicationPage.tsx',
    type: 'Trang Đăng ký Nâng cấp Mall',
    target: 'Người bán / Seller',
    description: 'Nộp hồ sơ nâng cấp quán ăn lên gian hàng chính hãng UniEats Mall.',
    keyExports: 'SellerMallApplicationPage component'
  },
  {
    category: 'Trang Giao diện (Pages - Người bán / Quán ăn)',
    name: 'SellerAppealPage.tsx',
    path: 'src/pages/seller/SellerAppealPage.tsx',
    type: 'Trang Gửi Khiếu nại Mở khóa',
    target: 'Người bán / Seller',
    description: 'Gửi đơn giải trình lên Admin xin xem xét mở lại quán khi bị khóa.',
    keyExports: 'SellerAppealPage default component'
  },
  {
    category: 'Trang Giao diện (Pages - Người bán / Quán ăn)',
    name: 'SellerShipperCancelsPage.tsx',
    path: 'src/pages/seller/SellerShipperCancelsPage.tsx',
    type: 'Trang Thống kê Đơn Tài xế Hủy',
    target: 'Người bán / Seller',
    description: 'Phân tích nguyên nhân các đơn hàng bị shipper từ chối hoặc hủy nhận.',
    keyExports: 'SellerShipperCancelsPage component'
  },

  // Pages - Shipper
  {
    category: 'Trang Giao diện (Pages - Tài xế / Shipper)',
    name: 'ShipperDashboard.tsx',
    path: 'src/pages/shipper/ShipperDashboard.tsx',
    type: 'Bảng Điều khiển Giao hàng',
    target: 'Tài xế / Shipper',
    description: 'Bật/tắt Online nhận đơn, popup nhận đơn 60s, quy trình lấy hàng bằng OTP và chụp ảnh giao thành công.',
    keyExports: 'ShipperDashboard component'
  },
  {
    category: 'Trang Giao diện (Pages - Tài xế / Shipper)',
    name: 'ShipperHistoryPage.tsx',
    path: 'src/pages/shipper/ShipperHistoryPage.tsx',
    type: 'Trang Lịch sử Chuyến giao',
    target: 'Tài xế / Shipper',
    description: 'Xem lại các đơn đã giao thành công, chi tiết cước phí và biểu đồ thu nhập từng ngày trong tháng.',
    keyExports: 'ShipperHistoryPage component'
  },
  {
    category: 'Trang Giao diện (Pages - Tài xế / Shipper)',
    name: 'ShipperIncomePage.tsx',
    path: 'src/pages/shipper/ShipperIncomePage.tsx',
    type: 'Trang Báo cáo Thu nhập',
    target: 'Tài xế / Shipper',
    description: 'Báo cáo thu nhập theo tuần / tháng (phí cơ bản, phí khoảng cách, thưởng giờ cao điểm).',
    keyExports: 'ShipperIncomePage component'
  },
  {
    category: 'Trang Giao diện (Pages - Tài xế / Shipper)',
    name: 'ShipperProfilePage.tsx',
    path: 'src/pages/shipper/ShipperProfilePage.tsx',
    type: 'Trang Hồ sơ & Khu vực Hoạt động',
    target: 'Tài xế / Shipper',
    description: 'Cài đặt tâm hoạt động GPS và bán kính nhận đơn (km), đăng ký ca làm việc và xem điểm uy tín.',
    keyExports: 'ShipperProfilePage component'
  },
  {
    category: 'Trang Giao diện (Pages - Tài xế / Shipper)',
    name: 'AuthShipperApplyPage.tsx',
    path: 'src/pages/shipper/AuthShipperApplyPage.tsx',
    type: 'Trang Nộp Hồ sơ Tài xế',
    target: 'Khách hàng',
    description: 'Form nộp hồ sơ đăng ký tài xế (CCCD 2 mặt, bằng lái xe, cavet xe) cho user đã đăng nhập.',
    keyExports: 'AuthShipperApplyPage component'
  },
  {
    category: 'Trang Giao diện (Pages - Tài xế / Shipper)',
    name: 'OrderProposalPopup.tsx',
    path: 'src/pages/shipper/components/OrderProposalPopup.tsx',
    type: 'Popup Đề xuất Đơn 60s',
    target: 'Tài xế / Shipper',
    description: 'Cửa sổ popup toàn màn hình hiển thị đơn giao hàng phù hợp kèm đếm ngược 60 giây.',
    keyExports: 'OrderProposalPopup component'
  },
  {
    category: 'Trang Giao diện (Pages - Tài xế / Shipper)',
    name: 'PickupCodeModal.tsx',
    path: 'src/pages/shipper/components/PickupCodeModal.tsx',
    type: 'Modal Mã Lấy hàng Đơn lẻ',
    target: 'Tài xế / Shipper',
    description: 'Nhập 6 ký tự OTP xác nhận đã nhận đúng đồ ăn từ quán.',
    keyExports: 'PickupCodeModal component'
  },
  {
    category: 'Trang Giao diện (Pages - Tài xế / Shipper)',
    name: 'BatchPickupCodeModal.tsx',
    path: 'src/pages/shipper/components/BatchPickupCodeModal.tsx',
    type: 'Modal Mã Lấy hàng Hàng loạt',
    target: 'Tài xế / Shipper',
    description: 'Nhập 1 mã OTP để xác nhận lấy nhiều đơn cùng một quán ăn.',
    keyExports: 'BatchPickupCodeModal component'
  },
  {
    category: 'Trang Giao diện (Pages - Tài xế / Shipper)',
    name: 'SuccessDeliveryModal.tsx',
    path: 'src/pages/shipper/components/SuccessDeliveryModal.tsx',
    type: 'Modal Xác nhận Giao thành công',
    target: 'Tài xế / Shipper',
    description: 'Tải lên hình ảnh chụp bằng chứng đã giao đồ ăn tận tay khách kèm tọa độ GPS.',
    keyExports: 'SuccessDeliveryModal component'
  },
  {
    category: 'Trang Giao diện (Pages - Tài xế / Shipper)',
    name: 'ReportIncidentModal.tsx',
    path: 'src/pages/shipper/components/ReportIncidentModal.tsx',
    type: 'Modal Báo cáo Giao thất bại',
    target: 'Tài xế / Shipper',
    description: 'Ghi nhận sự cố không giao được hàng (Không gọi được khách, sai địa chỉ, hỏng xe...).',
    keyExports: 'ReportIncidentModal component'
  },
  {
    category: 'Trang Giao diện (Pages - Tài xế / Shipper)',
    name: 'ShipperReputationTab.tsx',
    path: 'src/pages/shipper/components/ShipperReputationTab.tsx',
    type: 'Tab Lịch sử Điểm Uy tín',
    target: 'Tài xế / Shipper',
    description: 'Xem điểm sao hiện tại và nhật ký các lần cộng/trừ điểm uy tín.',
    keyExports: 'ShipperReputationTab component'
  },

  // Pages - Admin
  {
    category: 'Trang Giao diện (Pages - Quản trị viên / Admin)',
    name: 'AdminDashboardPage.tsx',
    path: 'src/pages/AdminDashboardPage.tsx',
    type: 'Trang Tổng quan Admin',
    target: 'Quản trị viên',
    description: 'Dashboard trung tâm: Tổng doanh thu toàn sàn, số đơn hàng, tăng trưởng người dùng và bản đồ nhiệt đơn hàng.',
    keyExports: 'AdminDashboardPage component'
  },
  {
    category: 'Trang Giao diện (Pages - Quản trị viên / Admin)',
    name: 'AdminApprovalsPage.tsx',
    path: 'src/pages/admin/AdminApprovalsPage.tsx',
    type: 'Trang Phê duyệt Hồ sơ & Món',
    target: 'Quản trị viên',
    description: 'Kiểm duyệt đơn đăng ký Người bán, Tài xế và phê duyệt các món ăn mới do quán tải lên.',
    keyExports: 'AdminApprovalsPage component'
  },
  {
    category: 'Trang Giao diện (Pages - Quản trị viên / Admin)',
    name: 'AdminUsersPage.tsx',
    path: 'src/pages/admin/AdminUsersPage.tsx',
    type: 'Trang Quản lý Người dùng',
    target: 'Quản trị viên',
    description: 'Quản lý toàn bộ tài khoản, khóa/mở khóa tài khoản, tạo tài khoản nhân viên điều phối.',
    keyExports: 'AdminUsersPage component'
  },
  {
    category: 'Trang Giao diện (Pages - Quản trị viên / Admin)',
    name: 'AdminRestaurantsPage.tsx',
    path: 'src/pages/admin/AdminRestaurantsPage.tsx',
    type: 'Trang Quản lý Nhà hàng',
    target: 'Quản trị viên',
    description: 'Giám sát toàn bộ quán ăn trên hệ thống và tạm khóa quán vi phạm.',
    keyExports: 'AdminRestaurantsPage component'
  },
  {
    category: 'Trang Giao diện (Pages - Quản trị viên / Admin)',
    name: 'AdminFinancePage.tsx',
    path: 'src/pages/admin/AdminFinancePage.tsx',
    type: 'Trang Quản trị Tài chính & Rút tiền',
    target: 'Quản trị viên',
    description: 'Đối soát dòng tiền thu/chi, tổng quan tiền thu hộ COD và phê duyệt giải ngân rút tiền kèm tải ảnh bill ngân hàng.',
    keyExports: 'AdminFinancePage component'
  },
  {
    category: 'Trang Giao diện (Pages - Quản trị viên / Admin)',
    name: 'AdminFinanceOperationsPage.tsx',
    path: 'src/pages/admin/AdminFinanceOperationsPage.tsx',
    type: 'Trang Cấu hình Vận hành & Phí',
    target: 'Quản trị viên',
    description: 'Cấu hình hoa hồng sàn (%), cước phí giao hàng, phí theo km, cước shipper và phụ phí giờ cao điểm.',
    keyExports: 'AdminFinanceOperationsPage component'
  },
  {
    category: 'Trang Giao diện (Pages - Quản trị viên / Admin)',
    name: 'AdminWithdrawalsPage.tsx',
    path: 'src/pages/admin/AdminWithdrawalsPage.tsx',
    type: 'Trang Duyệt Rút tiền Đối tác',
    target: 'Quản trị viên',
    description: 'Duyệt các yêu cầu rút tiền của chủ quán và tài xế về tài khoản ngân hàng.',
    keyExports: 'AdminWithdrawalsPage component'
  },
  {
    category: 'Trang Giao diện (Pages - Quản trị viên / Admin)',
    name: 'CodRemittancesPage.tsx',
    path: 'src/pages/admin/CodRemittancesPage.tsx',
    type: 'Trang Duyệt Nộp tiền COD',
    target: 'Quản trị viên',
    description: 'Kiểm tra và phê duyệt các lệnh nộp lại tiền thu hộ COD của tài xế qua chuyển khoản.',
    keyExports: 'CodRemittancesPage component'
  },
  {
    category: 'Trang Giao diện (Pages - Quản trị viên / Admin)',
    name: 'AdminSellerRevenuePage.tsx',
    path: 'src/pages/admin/AdminSellerRevenuePage.tsx',
    type: 'Trang Doanh thu theo Nhà hàng',
    target: 'Quản trị viên',
    description: 'Báo cáo chi tiết doanh thu từng quán ăn: Tiền món, tiền COD, phí chiết khấu sàn và thu nhập thực nhận.',
    keyExports: 'AdminSellerRevenuePage component'
  },
  {
    category: 'Trang Giao diện (Pages - Quản trị viên / Admin)',
    name: 'AdminShipperRevenuePage.tsx',
    path: 'src/pages/admin/AdminShipperRevenuePage.tsx',
    type: 'Trang Doanh thu theo Tài xế',
    target: 'Quản trị viên',
    description: 'Báo cáo chi tiết thu nhập từng shipper: Phí cơ bản, phí km, thưởng cao điểm, tiền COD đã thu.',
    keyExports: 'AdminShipperRevenuePage component'
  },
  {
    category: 'Trang Giao diện (Pages - Quản trị viên / Admin)',
    name: 'AdminFlashSalePage.tsx',
    path: 'src/pages/admin/AdminFlashSalePage.tsx',
    type: 'Trang Quản lý Flash Sale Toàn sàn',
    target: 'Quản trị viên',
    description: 'Tạo đợt Flash Sale giờ vàng và kiểm duyệt món ăn do các quán đăng ký tham gia.',
    keyExports: 'AdminFlashSalePage component'
  },
  {
    category: 'Trang Giao diện (Pages - Quản trị viên / Admin)',
    name: 'AdminDiscountsPage.tsx',
    path: 'src/pages/admin/AdminDiscountsPage.tsx',
    type: 'Trang Quản lý Voucher Toàn sàn',
    target: 'Quản trị viên',
    description: 'Tạo và phát hành mã giảm giá voucher áp dụng cho toàn bộ người dùng.',
    keyExports: 'AdminDiscountsPage component'
  },
  {
    category: 'Trang Giao diện (Pages - Quản trị viên / Admin)',
    name: 'AdminLoyaltyConfigPage.tsx',
    path: 'src/pages/admin/AdminLoyaltyConfigPage.tsx',
    type: 'Trang Cấu hình Điểm & Hạng',
    target: 'Quản trị viên',
    description: 'Thiết lập danh mục đổi quà bằng điểm thưởng và tiêu chí điểm cho các hạng thành viên.',
    keyExports: 'AdminLoyaltyConfigPage component'
  },
  {
    category: 'Trang Giao diện (Pages - Quản trị viên / Admin)',
    name: 'AdminMemberRanksPage.tsx',
    path: 'src/pages/admin/AdminMemberRanksPage.tsx',
    type: 'Trang Phân hạng Thành viên',
    target: 'Quản trị viên',
    description: 'Theo dõi cấp bậc hội viên của khách hàng và chạy tính toán thăng hạng tự động.',
    keyExports: 'AdminMemberRanksPage component'
  },
  {
    category: 'Trang Giao diện (Pages - Quản trị viên / Admin)',
    name: 'AdminOrderComplaintsPage.tsx',
    path: 'src/pages/admin/AdminOrderComplaintsPage.tsx',
    type: 'Trang Khiếu nại Đơn hàng Cấp cao',
    target: 'Quản trị viên',
    description: 'Phán quyết các vụ khiếu nại tranh chấp phức tạp, hoàn tiền khách và phạt bên có lỗi.',
    keyExports: 'AdminOrderComplaintsPage component'
  },
  {
    category: 'Trang Giao diện (Pages - Quản trị viên / Admin)',
    name: 'AdminProductReportsPage.tsx',
    path: 'src/pages/admin/AdminProductReportsPage.tsx',
    type: 'Trang Báo cáo Vi phạm Món ăn',
    target: 'Quản trị viên',
    description: 'Xử lý báo cáo vi phạm món ăn và tự động ẩn món vi phạm khỏi thực đơn.',
    keyExports: 'AdminProductReportsPage component'
  },
  {
    category: 'Trang Giao diện (Pages - Quản trị viên / Admin)',
    name: 'AdminReviewReportsPage.tsx',
    path: 'src/pages/admin/AdminReviewReportsPage.tsx',
    type: 'Trang Báo cáo Đánh giá Xấu',
    target: 'Quản trị viên',
    description: 'Kiểm duyệt và xóa các bình luận khiếm nhã, sai sự thật bị người dùng báo cáo.',
    keyExports: 'AdminReviewReportsPage component'
  },
  {
    category: 'Trang Giao diện (Pages - Quản trị viên / Admin)',
    name: 'AdminPermissionsPage.tsx',
    path: 'src/pages/admin/AdminPermissionsPage.tsx',
    type: 'Trang Phân quyền API',
    target: 'Quản trị viên',
    description: 'Thiết lập ma trận phân quyền truy cập từng API endpoint cho từng vai trò trong hệ thống.',
    keyExports: 'AdminPermissionsPage component'
  },
  {
    category: 'Trang Giao diện (Pages - Quản trị viên / Admin)',
    name: 'AdminBlacklistPage.tsx',
    path: 'src/pages/admin/AdminBlacklistPage.tsx',
    type: 'Trang Quản lý Từ khóa Cấm',
    target: 'Quản trị viên',
    description: 'Quản lý danh sách từ khóa cấm trong tên quán, món ăn, đánh giá và tin nhắn.',
    keyExports: 'AdminBlacklistPage component'
  },
  {
    category: 'Trang Giao diện (Pages - Quản trị viên / Admin)',
    name: 'AdminSettingsPage.tsx',
    path: 'src/pages/admin/AdminSettingsPage.tsx',
    type: 'Trang Danh mục Món Toàn sàn',
    target: 'Quản trị viên',
    description: 'Quản lý cây danh mục ẩm thực chung toàn hệ thống.',
    keyExports: 'AdminSettingsPage component'
  },
  {
    category: 'Trang Giao diện (Pages - Quản trị viên / Admin)',
    name: 'AdminLegalSettingsPage.tsx',
    path: 'src/pages/admin/AdminLegalSettingsPage.tsx',
    type: 'Trang Soạn thảo Điều khoản & Chính sách',
    target: 'Quản trị viên',
    description: 'Cập nhật văn bản điều khoản sử dụng và chính sách bảo mật hệ thống.',
    keyExports: 'AdminLegalSettingsPage component'
  },
  {
    category: 'Trang Giao diện (Pages - Quản trị viên / Admin)',
    name: 'AdminNotificationsPage.tsx',
    path: 'src/pages/admin/AdminNotificationsPage.tsx',
    type: 'Trang Gửi Thông báo Hệ thống',
    target: 'Quản trị viên',
    description: 'Phát thông báo đẩy sự kiện, khuyến mãi hoặc Flash Sale đến khách hàng theo từng phân khúc.',
    keyExports: 'AdminNotificationsPage component'
  },
  {
    category: 'Trang Giao diện (Pages - Quản trị viên / Admin)',
    name: 'AdminPaymentDashboardPage.tsx',
    path: 'src/pages/admin/AdminPaymentDashboardPage.tsx',
    type: 'Trang Giám sát Cổng Thanh toán',
    target: 'Quản trị viên',
    description: 'Giám sát kỹ thuật: Số phiên SePay QR, hàng đợi Message Queue và Webhook.',
    keyExports: 'AdminPaymentDashboardPage component'
  },
  {
    category: 'Trang Giao diện (Pages - Quản trị viên / Admin)',
    name: 'AdminSystemConfigPage.tsx',
    path: 'src/pages/admin/AdminSystemConfigPage.tsx',
    type: 'Trang Cấu hình Bảo trì Hệ thống',
    target: 'Quản trị viên',
    description: 'Bật tắt chế độ bảo trì tức thời hoặc lên lịch bảo trì định kỳ trong tương lai.',
    keyExports: 'AdminSystemConfigPage component'
  },
  {
    category: 'Trang Giao diện (Pages - Quản trị viên / Admin)',
    name: 'AdminSystemLogsPage.tsx',
    path: 'src/pages/admin/AdminSystemLogsPage.tsx',
    type: 'Trang Nhật ký Lỗi & Hành động',
    target: 'Quản trị viên',
    description: 'Tra cứu lịch sử thao tác của người dùng và nhật ký lỗi ngoại lệ Backend.',
    keyExports: 'AdminSystemLogsPage component'
  },
  {
    category: 'Trang Giao diện (Pages - Quản trị viên / Admin)',
    name: 'AdminChatPage.tsx',
    path: 'src/pages/admin/AdminChatPage.tsx',
    type: 'Trang Live Chat của Admin',
    target: 'Quản trị viên',
    description: 'Trực tiếp tiếp nhận và hỗ trợ khách hàng/đối tác qua Live Chat.',
    keyExports: 'AdminChatPage component'
  },
  {
    category: 'Trang Giao diện (Pages - Quản trị viên / Admin)',
    name: 'AdminFaqPage.tsx',
    path: 'src/pages/admin/AdminFaqPage.tsx',
    type: 'Trang Quản lý Câu hỏi FAQ',
    target: 'Quản trị viên',
    description: 'Thêm, sửa, xóa các câu hỏi thường gặp trợ giúp người dùng.',
    keyExports: 'AdminFaqPage component'
  },

  // ─── 9. UNIT TESTS ──────────────────────────────────────────────────────────
  {
    category: 'Kiểm thử Tự động (Unit Tests)',
    name: 'ProductCard.test.tsx',
    path: 'src/__tests__/components/product/ProductCard.test.tsx',
    type: 'Component Unit Test',
    target: 'Lập trình viên',
    description: 'Kiểm thử tự động hiển thị giá, tên, hình ảnh và sự kiện thêm vào giỏ của ProductCard.',
    keyExports: 'Vitest test suite'
  },
  {
    category: 'Kiểm thử Tự động (Unit Tests)',
    name: 'CartContext.test.tsx',
    path: 'src/__tests__/contexts/CartContext.test.tsx',
    type: 'Context Unit Test',
    target: 'Lập trình viên',
    description: 'Kiểm thử tự động tính toán tổng tiền giỏ hàng, combo Mua X Tặng Y, thêm/xóa món.',
    keyExports: 'Vitest test suite'
  },
  {
    category: 'Kiểm thử Tự động (Unit Tests)',
    name: 'useAuth.test.ts',
    path: 'src/__tests__/hooks/useAuth.test.ts',
    type: 'Hook Unit Test',
    target: 'Lập trình viên',
    description: 'Kiểm thử logic xác thực, đăng nhập và lưu token của hook useAuth.',
    keyExports: 'Vitest test suite'
  },
  {
    category: 'Kiểm thử Tự động (Unit Tests)',
    name: 'LoginPage.test.tsx',
    path: 'src/__tests__/pages/LoginPage.test.tsx',
    type: 'Page Unit Test',
    target: 'Lập trình viên',
    description: 'Kiểm thử giao diện đăng nhập và các sự kiện submit form.',
    keyExports: 'Vitest test suite'
  },
  {
    category: 'Kiểm thử Tự động (Unit Tests)',
    name: 'ProductDetailPage.test.tsx',
    path: 'src/__tests__/pages/ProductDetailPage.test.tsx',
    type: 'Page Unit Test',
    target: 'Lập trình viên',
    description: 'Kiểm thử tải chi tiết món, chọn topping, kích cỡ và tính tổng giá.',
    keyExports: 'Vitest test suite'
  }
];

async function createExcelWorkbook() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'UniEats Team';
  workbook.created = new Date();

  // Helper để format tiêu đề bảng
  const formatHeader = (row, color = 'FFEA580C') => {
    row.height = 30;
    row.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: color }
      };
      cell.font = {
        name: 'Segoe UI',
        size: 11,
        bold: true,
        color: { argb: 'FFFFFFFF' }
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        bottom: { style: 'medium', color: { argb: 'FF9CA3AF' } },
        right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
      };
    });
  };

  // Helper format các dòng dữ liệu
  const formatDataRows = (sheet) => {
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      row.height = 28;
      const isEven = rowNumber % 2 === 0;
      row.eachCell((cell, colNumber) => {
        cell.font = { name: 'Segoe UI', size: 10 };
        cell.alignment = {
          vertical: 'middle',
          horizontal: colNumber === 1 ? 'center' : (colNumber === 2 || colNumber === 5 || colNumber === 6 ? 'center' : 'left'),
          wrapText: true
        };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: isEven ? 'FFF9FAFB' : 'FFFFFFFF' }
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
        };

        // Highlight tên file
        if (colNumber === 3) {
          cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFEA580C' } };
        }
      });
    });
  };

  // ───────────────────────────────────────────────────────────────────────────
  // SHEET 1: TỔNG QUAN TẤT CẢ CÁC FILE
  // ───────────────────────────────────────────────────────────────────────────
  const sheetAll = workbook.addWorksheet('Tất Cả Files (Tổng Quan)', {
    views: [{ state: 'frozen', ySplit: 1 }]
  });

  sheetAll.columns = [
    { header: 'STT', key: 'stt', width: 8 },
    { header: 'Phân Loại Module', key: 'category', width: 35 },
    { header: 'Tên File', key: 'name', width: 28 },
    { header: 'Đường Dẫn Tương Đối', key: 'path', width: 45 },
    { header: 'Loại File / Vai Trò', key: 'type', width: 30 },
    { header: 'Đối Tượng Sử Dụng', key: 'target', width: 25 },
    { header: 'Tác Dụng & Chức Năng Chi Tiết (Tiếng Việt)', key: 'description', width: 65 },
    { header: 'Các Hàm / Export Chính', key: 'keyExports', width: 35 }
  ];

  fileData.forEach((item, index) => {
    sheetAll.addRow({
      stt: index + 1,
      category: item.category,
      name: item.name,
      path: item.path,
      type: item.type,
      target: item.target,
      description: item.description,
      keyExports: item.keyExports
    });
  });

  formatHeader(sheetAll.getRow(1), 'FFC2410C');
  formatDataRows(sheetAll);

  // ───────────────────────────────────────────────────────────────────────────
  // SHEET 2: PAGES (TRANG GIAO DIỆN)
  // ───────────────────────────────────────────────────────────────────────────
  const sheetPages = workbook.addWorksheet('Pages (Trang Màn Hình)', {
    views: [{ state: 'frozen', ySplit: 1 }]
  });

  sheetPages.columns = [
    { header: 'STT', key: 'stt', width: 8 },
    { header: 'Nhóm Trang', key: 'category', width: 35 },
    { header: 'Tên File Trang', key: 'name', width: 28 },
    { header: 'Đường Dẫn', key: 'path', width: 45 },
    { header: 'Đối Tượng Phục Vụ', key: 'target', width: 25 },
    { header: 'Chức Năng Nghiệp Vụ Của Trang', key: 'description', width: 70 },
    { header: 'Component Chính', key: 'keyExports', width: 35 }
  ];

  const pages = fileData.filter(f => f.category.includes('Pages'));
  pages.forEach((item, index) => {
    sheetPages.addRow({
      stt: index + 1,
      category: item.category.replace('Trang Giao diện (', '').replace(')', ''),
      name: item.name,
      path: item.path,
      target: item.target,
      description: item.description,
      keyExports: item.keyExports
    });
  });

  formatHeader(sheetPages.getRow(1), 'FF2563EB');
  formatDataRows(sheetPages);

  // ───────────────────────────────────────────────────────────────────────────
  // SHEET 3: COMPONENTS (THÀNH PHẦN GIAO DIỆN)
  // ───────────────────────────────────────────────────────────────────────────
  const sheetComponents = workbook.addWorksheet('Components (Thành Phần UI)', {
    views: [{ state: 'frozen', ySplit: 1 }]
  });

  sheetComponents.columns = [
    { header: 'STT', key: 'stt', width: 8 },
    { header: 'Nhóm Component', key: 'category', width: 35 },
    { header: 'Tên Component', key: 'name', width: 28 },
    { header: 'Đường Dẫn', key: 'path', width: 45 },
    { header: 'Loại Component', key: 'type', width: 28 },
    { header: 'Mô Tả Chức Năng', key: 'description', width: 65 },
    { header: 'Exports', key: 'keyExports', width: 35 }
  ];

  const components = fileData.filter(f => f.category.includes('Components'));
  components.forEach((item, index) => {
    sheetComponents.addRow({
      stt: index + 1,
      category: item.category.replace('Components ', ''),
      name: item.name,
      path: item.path,
      type: item.type,
      description: item.description,
      keyExports: item.keyExports
    });
  });

  formatHeader(sheetComponents.getRow(1), 'FF0D9488');
  formatDataRows(sheetComponents);

  // ───────────────────────────────────────────────────────────────────────────
  // SHEET 4: SERVICES (TẦNG GỌI API)
  // ───────────────────────────────────────────────────────────────────────────
  const sheetServices = workbook.addWorksheet('Services (Tầng Gọi API)', {
    views: [{ state: 'frozen', ySplit: 1 }]
  });

  sheetServices.columns = [
    { header: 'STT', key: 'stt', width: 8 },
    { header: 'Tên Service', key: 'name', width: 28 },
    { header: 'Đường Dẫn', key: 'path', width: 40 },
    { header: 'Vai Trò / Nghiệp Vụ', key: 'type', width: 30 },
    { header: 'Đối Tượng Phục Vụ', key: 'target', width: 25 },
    { header: 'Chi Tiết Các API Đảm Nhận', key: 'description', width: 65 },
    { header: 'Export Service Instance', key: 'keyExports', width: 35 }
  ];

  const services = fileData.filter(f => f.category.includes('Dịch vụ API'));
  services.forEach((item, index) => {
    sheetServices.addRow({
      stt: index + 1,
      name: item.name,
      path: item.path,
      type: item.type,
      target: item.target,
      description: item.description,
      keyExports: item.keyExports
    });
  });

  formatHeader(sheetServices.getRow(1), 'FF7C3AED');
  formatDataRows(sheetServices);

  // ───────────────────────────────────────────────────────────────────────────
  // SHEET 5: CONTEXTS, HOOKS & UTILS
  // ───────────────────────────────────────────────────────────────────────────
  const sheetUtils = workbook.addWorksheet('Contexts, Hooks, Utils', {
    views: [{ state: 'frozen', ySplit: 1 }]
  });

  sheetUtils.columns = [
    { header: 'STT', key: 'stt', width: 8 },
    { header: 'Nhóm', key: 'category', width: 30 },
    { header: 'Tên File', key: 'name', width: 28 },
    { header: 'Đường Dẫn', key: 'path', width: 40 },
    { header: 'Loại', key: 'type', width: 28 },
    { header: 'Mục Đích Sử Dụng', key: 'description', width: 65 },
    { header: 'Hàm & Đối Tượng Export', key: 'keyExports', width: 35 }
  ];

  const utilsAndHooks = fileData.filter(f =>
    f.category.includes('Tiện ích') ||
    f.category.includes('Contexts') ||
    f.category.includes('Hooks') ||
    f.category.includes('Cấu hình') ||
    f.category.includes('Điều hướng')
  );

  utilsAndHooks.forEach((item, index) => {
    sheetUtils.addRow({
      stt: index + 1,
      category: item.category,
      name: item.name,
      path: item.path,
      type: item.type,
      description: item.description,
      keyExports: item.keyExports
    });
  });

  formatHeader(sheetUtils.getRow(1), 'FFDB2777');
  formatDataRows(sheetUtils);

  // ───────────────────────────────────────────────────────────────────────────
  // SHEET 6: INTERFACES & DTOs
  // ───────────────────────────────────────────────────────────────────────────
  const sheetInterfaces = workbook.addWorksheet('Interfaces & DTOs', {
    views: [{ state: 'frozen', ySplit: 1 }]
  });

  sheetInterfaces.columns = [
    { header: 'STT', key: 'stt', width: 8 },
    { header: 'Tên File Interface', key: 'name', width: 28 },
    { header: 'Đường Dẫn', key: 'path', width: 40 },
    { header: 'Đối Tượng Liên Quan', key: 'target', width: 25 },
    { header: 'Mô Tả Cấu Trúc Dữ Liệu', key: 'description', width: 65 },
    { header: 'Các Interface / DTO Chính', key: 'keyExports', width: 35 }
  ];

  const interfaces = fileData.filter(f => f.category.includes('Kiểu dữ liệu'));
  interfaces.forEach((item, index) => {
    sheetInterfaces.addRow({
      stt: index + 1,
      name: item.name,
      path: item.path,
      target: item.target,
      description: item.description,
      keyExports: item.keyExports
    });
  });

  formatHeader(sheetInterfaces.getRow(1), 'FF059669');
  formatDataRows(sheetInterfaces);

  // Lưu file Excel
  const outputPath = path.resolve('Phan_Loai_File_Frontend_UniEats.xlsx');
  await workbook.xlsx.writeFile(outputPath);
  console.log(`Đã xuất file Excel thành công tại: ${outputPath}`);
}

createExcelWorkbook().catch(console.error);
