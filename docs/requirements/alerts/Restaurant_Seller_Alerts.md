# Cảnh báo — Restaurant / Seller

> Requirements: [../Restaurant_Seller_Requirements.md](../Restaurant_Seller_Requirements.md)

| ID | Message | Loại | Mức độ | Nơi hiện | File | Trigger | API |
|----|---------|------|--------|----------|------|---------|-----|
| AL-RES-01 | Đã lưu quán / Đã bỏ lưu quán | success | Info | Toast | `RestaurantDetailPage` | Favorite | `POST /Restaurant/{id}/Favorite` |
| AL-RES-02 | Không thể tải thông tin nhà hàng | error | Warn | Toast | RestaurantDetailPage | Load fail | `GET /Restaurant/{id}` |
| AL-RES-03 | Đã cập nhật thông tin / giờ / trạng thái / giao hàng | success | Info | Toast | `SellerSettingsPage` | Settings | `PUT /Restaurant/*` |
| AL-RES-04 | Bán kính > 0 / Phí VC hợp lệ / nhập đủ… | validation | Warn | Toast | SellerSettingsPage | Form | — |
| AL-RES-05 | Cửa hàng đã mở cửa / tạm đóng cửa | success | Info | Toast | SellerSettingsPage | Toggle status | `PUT /Restaurant/status` |
| AL-RES-06 | Nhà hàng không hỗ trợ giao đến địa chỉ này. | error | Warn | Toast | Checkout | Ngoài bán kính self | checkout |
| AL-RES-07 | Đăng ký thành công! Vui lòng chờ phê duyệt. | success | Info | Toast | `SellerApplyPage` | Apply | `/User/ApplySeller` |
| AL-RES-08 | Vui lòng tải GP / logo; file type/size | error | Warn | Toast | SellerApplyPage | Validation | — |
| AL-RES-09 | Admin: Đã treo/mở nhà hàng / nhãn tín nhiệm | success | Warn | Toast | `AdminRestaurantsPage` | Suspend/verify | Admin APIs |
| AL-RES-10 | Lỗi tải thống kê seller | error | Warn | Toast | `SellerDashboardPage` | Dashboard | `/Restaurant/DashboardStats` |
| AL-RES-11 | Cập nhật và gửi lại đơn Mall thành công! | success | Info | Toast | `SellerMallApplicationPage` | Mall update | Upgrade/Update |
| AL-RES-12 | Vui lòng điền đầy đủ thông tin và tải ảnh… | error | Warn | Toast | Mall/Apply pages | Validation | — |
| AL-RES-13 | Seller Suspended — chặn thao tác ghi | error | Critical | API/Toast | Filter | Write khi treo | AL-SYS-05 |
| AL-RES-14 | Admin duyệt/từ chối / yêu cầu bổ sung hồ sơ | success | Info | Toast | `AdminApprovalsPage` | Approve seller | ApproveSellerApplication |
| AL-RES-15 | Vui lòng nhập lý do/thông báo (khi reject) | validation | Warn | Toast | AdminApprovalsPage | Reject | — |

## Checklist QA Restaurant Alerts

- [ ] Favorite toggle → AL-RES-01
- [ ] Ngoài radius self-delivery → AL-RES-06
- [ ] Suspend → AL-RES-09 + AL-RES-13
