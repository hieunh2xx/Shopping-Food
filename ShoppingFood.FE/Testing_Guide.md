# Hướng dẫn Test Giao diện (UniEats FE)

Dưới đây là danh sách các đường dẫn (Routes) quan trọng đã được cấu hình trên Front-end để bạn có thể sao chép và dán trực tiếp vào trình duyệt để test.

> **Lưu ý Quan Trọng:** Hiện tại, logic kiểm tra Đăng nhập & Phân quyền (Auth & Role Check) trong file `src/routes/PrivateRoute.tsx` đang được **TẠM ẨN (Bypass)** để bạn dễ dàng test UI. Do đó, bạn có thể truy cập thẳng vào trang Admin/Seller mà không cần tài khoản thực.

---

## 🛒 1. Giao diện Người mua (Customer)
Các trang dành cho khách hàng tìm kiếm và đặt món ăn.

- **Trang chủ (Home):**
  - URL: `http://localhost:5173/` (Hoặc port bạn đang chạy)
  - *Ghi chú: Kéo xuống dưới để test khu vực "Món bạn đã thử" và nút "Mua lại".*

- **Trang Danh sách Món ăn (Menu/Products):**
  - URL: `http://localhost:5173/products`
  - *Ghi chú: Test bộ lọc tìm kiếm.*

- **Trang Chi tiết Món ăn (Product Detail):**
  - URL: `http://localhost:5173/products/1` (Số `1` là mock ID)
  - *Ghi chú: Kéo xuống dưới cùng để test hệ thống **Đánh giá (5 sao) & Bình luận lồng nhau** (Reply).*

---

## 🔐 2. Xác thực (Authentication)
Các trang liên quan đến việc tạo tài khoản và đăng nhập.

- **Đăng nhập (Login):**
  - URL: `http://localhost:5173/login`

- **Đăng ký Khách hàng (Customer Register):**
  - URL: `http://localhost:5173/register`
  - *Ghi chú: Giao diện đăng ký 1 bước nhanh chóng.*

- **Đăng ký Đối tác (Seller Register):**
  - URL: `http://localhost:5173/register/seller`
  - *Ghi chú: Giao diện đăng ký **Đa bước (2 Steps)**. Hãy test chức năng **Upload File Hợp đồng** và bấm **"Xem trước"** để thấy Trình đọc file Document Viewer Modal hoạt động.*

---

## 🏪 3. Giao diện Quản lý Đối tác (Seller Dashboard)
Dành cho chủ nhà hàng quản lý món ăn và đơn hàng.

- **Tổng quan Cửa hàng:**
  - URL: `http://localhost:5173/seller`

- **Quản lý Thực đơn (Products):**
  - URL: `http://localhost:5173/seller/products`
  - *Ghi chú: Chứa bảng dữ liệu món ăn mock và các nút chức năng UI.*

- **Quản lý Đơn hàng (Orders):**
  - URL: `http://localhost:5173/seller/orders`

---

## 👑 4. Giao diện Quản trị hệ thống (Admin Dashboard)
Dành cho Super Admin quản lý toàn bộ platform.

- **Tổng quan Hệ thống:**
  - URL: `http://localhost:5173/admin`

- **Quản lý Người dùng (Users):**
  - URL: `http://localhost:5173/admin/users`
  - *Ghi chú: Bảng hiển thị danh sách người dùng, vai trò (Seller/Admin/Customer) và nút Khóa tài khoản.*

- **Duyệt Đối tác (Approvals):**
  - URL: `http://localhost:5173/admin/approvals`

---

## 🔧 Cách Test Giỏ hàng thông minh (Grouped Cart)
1. Bấm vào bất kỳ nút **"Thêm vào giỏ"** hoặc **"Mua lại"** trên trang chủ/chi tiết.
2. Bấm vào biểu tượng **Giỏ hàng** ở góc trên cùng bên phải để mở `CartDrawer`.
3. Bạn sẽ thấy các món ăn được **Gom nhóm theo Nhà hàng**.
4. Test tính năng bấm nút **Radio tròn** (Bên cạnh tên quán) để chọn quán bạn muốn thanh toán. Tổng tiền sẽ tự động nhảy theo đúng quán được chọn!
