# Cảnh báo — Profile

> Requirements: [../Profile_Requirements.md](../Profile_Requirements.md)

| ID | Message | Loại | Mức độ | Nơi hiện | File | Trigger | API |
|----|---------|------|--------|----------|------|---------|-----|
| AL-PRF-01 | Cập nhật thông tin thành công! | success | Info | Toast | `ProfilePage` / `UpdateProfileModal` | Save profile | `PUT /User/UpdateProfile` |
| AL-PRF-02 | Vui lòng nhập họ tên | validation | Warn | Inline/Toast | Profile / modal | Submit | — |
| AL-PRF-03 | Cập nhật ảnh đại diện thành công! | success | Info | Toast | `ProfilePage` | Avatar | `POST /User/UploadAvatar` |
| AL-PRF-04 | Ảnh không được vượt quá 5MB | error | Warn | Toast | ProfilePage | Upload | — |
| AL-PRF-05 | Chỉ cho phép jpg/jpeg/png/webp | error | Warn | Toast | ProfilePage | Upload | — |
| AL-PRF-06 | Thay đổi mật khẩu thành công! | success | Info | Toast | `ChangePasswordModal` | Change MK | `POST /User/ChangePassword` |
| AL-PRF-07 | Mật khẩu cũ không chính xác. | error | Warn | Toast | ChangePasswordModal | Wrong old | ChangePassword |
| AL-PRF-08 | Vui lòng nhập MK hiện tại / mới / xác nhận | validation | Warn | Inline | ChangePasswordModal | Form | — |
| AL-PRF-09 | Mã OTP đã gửi / Xác thực email thành công! | success | Info | Toast | `ChangeContactModal` | Contact OTP | Request/VerifyUpdateContact |
| AL-PRF-10 | Tài khoản đã bị khóa. | success | Warn | Toast | ProfilePage | Lock | `POST /User/LockAccount` |
| AL-PRF-11 | Đã gửi yêu cầu xóa tài khoản. | success | Warn | Toast | ProfilePage | Deletion | `POST /User/RequestDeletion` |
| AL-PRF-12 | Đã thêm/cập nhật/xóa địa chỉ / đặt mặc định | success | Info | Toast | `UserAddressManager` | Address CRUD | `/UserAddress*` |
| AL-PRF-13 | Vui lòng nhập tên người nhận / SĐT / địa chỉ | validation | Warn | Inline | UserAddressManager | Form | — |
| AL-PRF-14 | Không tìm thấy địa chỉ. | error | Warn | Toast | — | API 404 | Update/Delete address |
| AL-PRF-15 | Cập nhật và gửi lại đơn thành công! | success | Info | Toast | `CustomerApplications` / Mall page | Resubmit app | Seller/Shipper update |
| AL-PRF-16 | **Đăng ký lên Mall** (PromptModal nhập lý do) | confirm | Warn | PromptModal | `SellerLayout` | Upgrade | `/User/UpgradeToMall` |
| AL-PRF-17 | Lỗi khi tải thông tin cá nhân / lỗi mạng | error | Warn | Toast | ProfilePage | Load profile | `GET /User/Profile` |

## Checklist QA Profile Alerts

- [ ] Avatar >5MB → AL-PRF-04
- [ ] Sai MK cũ → AL-PRF-07
- [ ] Lock / RequestDeletion có toast rõ
