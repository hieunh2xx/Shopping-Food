# Use Case: Review Seller Application

**Description:** Admin duyệt hồ sơ đăng ký của nhà hàng, xác thực giấy phép kinh doanh để cấp quyền bán hàng.

**Precondition:** Nhà hàng đã nộp đơn đăng ký qua cổng thông tin.

**Postcondition:** Tài khoản nhà hàng được kích hoạt hoặc chuyển trạng thái sang bị từ chối/cần bổ sung.

## Actors
- **Seller**
- **Admin**

## Flows
### ALT: Reject Application
Admin chọn 'Từ chối'. Admin nhập lý do từ chối (bắt buộc). Hệ thống gửi thông báo cho Seller qua email/ứng dụng về lý do từ chối và hướng dẫn bổ sung thông tin.

### MAIN: Main Flow
Admin xem danh sách các đơn đăng ký nhà hàng mới. Admin mở hồ sơ của nhà hàng. Admin kiểm tra các giấy tờ đính kèm (Giấy phép kinh doanh, ảnh chụp cửa hàng, thông tin liên hệ). Admin chọn 'Duyệt' hoặc 'Từ chối'. Nếu duyệt, hệ thống kích hoạt tài khoản Seller.

## Business Rules
- Admin phải phản hồi kết quả xét duyệt trong vòng 48 giờ làm việc.
- Thông tin địa chỉ phải khớp với thông tin trên giấy phép.
- Tất cả hồ sơ đăng ký phải đính kèm giấy phép kinh doanh hợp lệ.

