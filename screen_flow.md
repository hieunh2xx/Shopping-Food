# Screen Flow - Shopping Food System

Tài liệu này mô tả chi tiết luồng di chuyển giữa các màn hình (Screen Flow) trong ứng dụng **Shopping Food**, được xây dựng dựa trên đặc tả Use Cases (`Use_Cases.md`, `Use_Cases_Master_List.md`) và mã nguồn Front-end hiện tại (`AppRoutes.tsx`, `routeConfig.ts`).

---

## 1. Sơ đồ luồng màn hình tổng quát (Screen Flow Diagram)

Dưới đây là sơ đồ Mermaid trực quan hóa toàn bộ luồng màn hình, chia theo các khu vực (Layouts) và vai trò người dùng:

```mermaid
flowchart TD
    %% Define Styles
    classDef public fill:#f9f5ff,stroke:#8b5cf6,stroke-width:2px;
    classDef customer fill:#eff6ff,stroke:#3b82f6,stroke-width:2px;
    classDef seller fill:#ecfdf5,stroke:#10b981,stroke-width:2px;
    classDef admin fill:#fff1f2,stroke:#f43f5e,stroke-width:2px;
    classDef modal fill:#fafafa,stroke:#71717a,stroke-width:2px,stroke-dasharray: 5 5;

    %% Subgraph: Public Screens (Guest / Anyone)
    subgraph PublicSpace ["🌐 Khu Vực Công Cộng (Guest / Public)"]
        HomePage["🏠 HomePage (/)<br/>- Xem danh mục món<br/>- Gợi ý món ngon<br/>- Tìm kiếm nhanh"]
        ProductsPage["🔍 ProductsPage (/products)<br/>- Lọc & tìm kiếm nâng cao<br/>- Danh sách món ăn"]
        ProductDetailPage["🍜 ProductDetailPage (/products/:id)<br/>- Chi tiết món ăn<br/>- Chọn toppings / số lượng"]
        LoginPage["🔑 LoginPage (/login)<br/>- Đăng nhập (Email/SĐT)<br/>- Nút quên mật khẩu"]
        RegisterPage["📝 RegisterPage (/register)<br/>- Đăng ký Customer<br/>- OTP Email/SĐT"]
        RegisterSellerPage["🧑‍🍳 RegisterSellerPage (/register/seller)<br/>- Đăng ký tài khoản Seller"]
    end

    %% Subgraph: Modals & Overlays
    subgraph Overlays ["💬 Modals & Drawers"]
        CartDrawer["🛒 CartDrawer (Drawer)<br/>- Xem & sửa giỏ hàng<br/>- Gom món theo nhà hàng<br/>- Nút thanh toán"]
        ForgotPasswordModal["🔓 ForgotPasswordModal (Modal)<br/>- Nhập Email -> OTP -> Đổi MK"]
        ChangePasswordModal["🔒 ChangePasswordModal (Modal)<br/>- Đổi mật khẩu trong Profile"]
        UpdateProfileModal["👤 UpdateProfileModal (Modal)<br/>- Cập nhật thông tin cá nhân"]
    end

    %% Subgraph: Customer Area (UserLayout)
    subgraph CustomerSpace ["👤 Khách Hàng (UserLayout - Protected)"]
        ProfilePage["⚙️ ProfilePage (/profile)<br/>- Xem/Sửa thông tin cá nhân<br/>- Đổi SĐT/Email/Mật khẩu"]
        OrdersPage["📦 OrdersPage (/orders)<br/>- Xem lịch sử đơn hàng<br/>- Theo dõi trạng thái"]
        SellerApplyPage["🏪 SellerApplyPage (/seller/apply)<br/>- Gửi đơn đăng ký nhà hàng<br/>- Tải lên Logo/Giấy phép"]
    end

    %% Subgraph: Seller Workspace (SellerLayout)
    subgraph SellerSpace ["🧑‍🍳 Đối Tác Seller (SellerLayout - Protected)"]
        SellerDashboard["📊 SellerDashboardPage (/seller)<br/>- Thống kê doanh thu, đơn hàng"]
        SellerProducts["🍔 SellerProductsPage (/seller/products)<br/>- Quản lý món ăn<br/>- Thêm/Sửa/Xóa món & Toppings"]
        SellerOrders["📋 SellerOrdersPage (/seller/orders - Tương lai)<br/>- Tiếp nhận & chuẩn bị đơn<br/>- Tìm shipper"]
        SellerSettings["⚙️ SellerSettingsPage (/seller/settings - Tương lai)<br/>- Cấu hình cửa hàng, bán kính giao"]
    end

    %% Subgraph: Admin Workspace (AdminLayout)
    subgraph AdminSpace ["👮 Ban Quản Trị (AdminLayout - Protected)"]
        AdminDashboard["📈 AdminDashboardPage (/admin)<br/>- Tổng quan doanh số sàn, tăng trưởng"]
        AdminUsers["👥 AdminUsersPage (/admin/users)<br/>- Quản lý & khóa/mở tài khoản"]
        AdminPermissions["🔐 AdminPermissionsPage (/admin/permissions)<br/>- Phân quyền nhân viên"]
        AdminApprovals["🔍 AdminApprovalsPage (/admin/approvals - Tương lai)<br/>- Duyệt Seller & Shipper mới"]
        AdminSettings["⚙️ AdminSettingsPage (/admin/settings - Tương lai)<br/>- Cấu hình phí ship, cổng thanh toán"]
    end

    %% Page Flow Links
    HomePage -->|Tìm kiếm / Chọn món| ProductsPage
    HomePage -->|Xem chi tiết| ProductDetailPage
    ProductsPage -->|Xem chi tiết| ProductDetailPage
    
    %% Cart Interaction
    ProductDetailPage -->|Thêm vào giỏ| CartDrawer
    HomePage -->|Mở giỏ hàng| CartDrawer
    ProductsPage -->|Mở giỏ hàng| CartDrawer
    
    %% Checkout Interaction
    CartDrawer -->|Thanh toán (Chưa Logged in)| LoginPage
    CartDrawer -->|Thanh toán (Đã Logged in)| CheckoutPage["🛒 Checkout Page (/checkout - Dự kiến)"]

    %% Auth Flows
    LoginPage -->|Chưa có tài khoản| RegisterPage
    LoginPage -->|Đăng ký bán hàng| RegisterSellerPage
    LoginPage -->|Quên mật khẩu| ForgotPasswordModal
    
    %% Login Success Transitions
    LoginPage -->|Login Customer| HomePage
    LoginPage -->|Login Seller| SellerDashboard
    LoginPage -->|Login Admin| AdminDashboard
    
    %% Profile & Personal Info Details
    ProfilePage -->|Click đổi MK| ChangePasswordModal
    ProfilePage -->|Sửa thông tin| UpdateProfileModal
    
    %% Seller Apply
    ProfilePage -->|Đăng ký đối tác| SellerApplyPage
    SellerApplyPage -->|Gửi hồ sơ thành công| OrdersPage
    
    %% Apply classes
    class HomePage,ProductsPage,ProductDetailPage,LoginPage,RegisterPage,RegisterSellerPage public;
    class ProfilePage,OrdersPage,SellerApplyPage customer;
    class SellerDashboard,SellerProducts,SellerOrders,SellerSettings seller;
    class AdminDashboard,AdminUsers,AdminPermissions,AdminApprovals,AdminSettings admin;
    class CartDrawer,ForgotPasswordModal,ChangePasswordModal,UpdateProfileModal modal;
```

---

## 2. Chi tiết các luồng nghiệp vụ chính của User

### 2.1. Luồng mua sắm & Thanh toán (Shopping & Checkout Flow)
Dành cho cả **Guest** và **Customer**:
1. **Khám phá (Discovery)**: Người dùng bắt đầu từ `HomePage` (`/`), xem danh sách món ăn/nhà hàng nổi bật hoặc chuyển qua `ProductsPage` (`/products`) để tìm kiếm, lọc theo thể loại.
2. **Chi tiết món ăn**: Click vào từng món ăn để mở `ProductDetailPage` (`/products/:id`), chọn các tùy chọn (Toppings, size) và số lượng, sau đó click **"Thêm vào giỏ"**.
3. **Quản lý giỏ hàng**: Drawer `CartDrawer` trượt ra từ bên phải, cho phép người dùng điều chỉnh số lượng hoặc xóa món ăn.
4. **Tiến trình Thanh toán**:
   - Nếu chưa đăng nhập: Hệ thống chuyển hướng người dùng sang `LoginPage` (`/login`). Sau khi đăng nhập thành công, người dùng được điều hướng tiếp tục thanh toán.
   - Nếu đã đăng nhập: Hệ thống chuyển tiếp sang màn hình thanh toán `/checkout` (tại đây người dùng chọn địa chỉ nhận hàng, phương thức thanh toán, áp dụng mã giảm giá và đặt hàng).

---

### 2.2. Luồng đăng ký & Quản lý tài khoản (Auth & Profile Flow)
Dành cho **Guest** muốn trở thành thành viên hoặc chỉnh sửa thông tin cá nhân:
1. **Đăng ký tài khoản mới**: Người dùng truy cập `RegisterPage` (`/register`), nhập thông tin đăng ký và thực hiện xác thực mã OTP gửi về Email/SĐT để kích hoạt tài khoản.
2. **Quên mật khẩu**: Trên `LoginPage`, click nút quên mật khẩu để mở `ForgotPasswordModal`. Người dùng nhập Email -> Xác thực OTP -> Cấu hình mật khẩu mới.
3. **Cập nhật thông tin cá nhân**: Khi đã đăng nhập, người dùng truy cập `ProfilePage` (`/profile`) nằm trong `UserLayout`.
   - Click nút đổi mật khẩu để mở `ChangePasswordModal`.
   - Click nút cập nhật thông tin cá nhân để mở `UpdateProfileModal`.
4. **Xem lịch sử mua hàng**: Từ Header, người dùng có thể điều hướng nhanh sang `OrdersPage` (`/orders`) để theo dõi tình trạng đơn hàng thời gian thực (Đang chuẩn bị, Đang giao, Đã giao) hoặc hủy đơn hàng nếu đơn hàng chưa được xác nhận.

---

### 2.3. Luồng Đăng ký & Trở thành Seller (Seller Application Flow)
Dành cho **Customer** muốn mở gian hàng kinh doanh trên hệ thống:
1. **Gửi hồ sơ đăng ký**: Khách hàng truy cập `ProfilePage` (`/profile`), chọn tính năng đăng ký bán hàng hoặc truy cập trực tiếp `SellerApplyPage` (`/seller/apply`).
2. **Điền thông tin cửa hàng**: Nhập tên cửa hàng, địa chỉ, số điện thoại, tải lên giấy phép kinh doanh và **Store Logo/Avatar**.
3. **Gửi hồ sơ**: Hồ sơ sẽ được gửi đến hệ thống Admin để chờ kiểm duyệt.
4. **Kiểm duyệt (Phía Admin)**: Admin truy cập `/admin/approvals` để xem thông tin hồ sơ và bấm **Approve** (Duyệt) hoặc **Reject** (Từ chối kèm lý do).
5. **Kích hoạt & Đăng nhập**: Sau khi được duyệt, tài khoản của người dùng được nâng cấp lên vai trò `Seller`. Lần đăng nhập tiếp theo, hệ thống tự động nhận diện và đưa thẳng Seller vào màn hình quản lý `SellerDashboard` (`/seller`).

---

### 2.4. Luồng Nghiệp vụ của Đối tác bán hàng (Seller Workspace Flow)
Dành riêng cho người dùng có vai trò **Seller**:
1. **Trang chủ quản trị**: Seller bắt đầu tại `SellerDashboardPage` (`/seller`) để xem thống kê doanh thu ngày/tháng và các biểu đồ đơn hàng.
2. **Quản lý thực đơn**: Chuyển sang `SellerProductsPage` (`/seller/products`) để:
   - Thêm món ăn mới (Nhập tên, giá, mô tả, chọn danh mục và upload ảnh món ăn).
   - Chỉnh sửa thông tin món ăn hoặc gỡ bỏ/ẩn món ăn khi hết hàng.
3. **Xử lý đơn hàng (Đang phát triển)**: Theo dõi đơn hàng mới, bấm tiếp nhận, chuẩn bị món ăn và nhấn xác nhận hoàn thành món để hệ thống tự động tìm tài xế (Shipper) gần nhất qua bản đồ GPS.

---

### 2.5. Luồng Quản trị hệ thống (Admin Workspace Flow)
Dành riêng cho vai trò **Admin**:
1. **Giám sát hệ thống**: Xem thống kê thời gian thực trên `AdminDashboardPage` (`/admin`).
2. **Quản lý người dùng**: Vào trang `AdminUsersPage` (`/admin/users`) để xem danh sách tài khoản, thực hiện khóa hoặc mở khóa tài khoản vi phạm.
3. **Phân quyền nội bộ**: Sử dụng `AdminPermissionsPage` (`/admin/permissions`) để cấu hình quyền hạn cho các nhân viên chăm sóc khách hàng hoặc duyệt hồ sơ.
4. **Phê duyệt đối tác**: Vào trang `/admin/approvals` để phê duyệt đơn đăng ký của Seller hoặc tài xế mới.
