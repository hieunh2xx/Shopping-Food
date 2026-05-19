# Use Case: Add Menu Item

**Description:** Seller thêm một món ăn mới vào thực đơn, bao gồm thông tin chi tiết, giá cả và hình ảnh.

**Precondition:** Nhà hàng đã được Admin xét duyệt và tài khoản đang hoạt động.

**Postcondition:** Món ăn mới được tạo và hiển thị trong danh mục của nhà hàng.

## Actors
- **Seller**

## Flows
### EXCEPTION: Invalid Input
Seller nhập sai dữ liệu (ví dụ: Giá bán <= 0 hoặc thiếu Tên món). Hệ thống hiển thị thông báo lỗi chi tiết cho từng trường bị lỗi. Seller chỉnh sửa lại dữ liệu cho đúng và lưu lại.

### MAIN: Main Flow
Seller chọn 'Thêm món mới'. Seller nhập Tên món, Mô tả, Giá bán, Chọn danh mục. Seller tải lên ít nhất 1 ảnh. Seller chọn 'Lưu'. Hệ thống kiểm tra dữ liệu và cập nhật món ăn vào thực đơn.

## Business Rules
- Tồn kho mặc định là 'Còn hàng'.
- Mỗi món ăn phải có ít nhất 1 hình ảnh đại diện định dạng JPG/PNG.
- Giá bán phải lớn hơn 0.
- Tên món ăn là bắt buộc và tối đa 100 ký tự.

