# Cảnh báo — Promotion / Loyalty

> Requirements: [../Promotion_Loyalty_Requirements.md](../Promotion_Loyalty_Requirements.md)

| ID | Message | Loại | Mức độ | Nơi hiện | File | Trigger | API |
|----|---------|------|--------|----------|------|---------|-----|
| AL-PRO-01 | Áp dụng mã giảm giá thành công | success | Info | Toast | CheckoutPage | Apply | `POST /Discount/apply` |
| AL-PRO-02 | Mã giảm giá không hợp lệ / inactive / expired / hết lượt / min order | error | Warn | Toast | Checkout / BE | Apply fail | apply |
| AL-PRO-03 | Đã gỡ mã giảm giá | success | Info | Toast | CheckoutPage | Remove | — |
| AL-PRO-04 | Đã lưu mã giảm giá vào ví! | success | Info | Toast | `CustomerVouchers` | Save | `POST /Discount/save` |
| AL-PRO-05 | Đổi quà thành công! Mã đã thêm vào ví | success | Info | Toast | `CustomerLoyalty` | Redeem | `POST /LoyaltyPoint/redeem` |
| AL-PRO-06 | Insufficient points balance. | error | Warn | Toast | CustomerLoyalty | Thiếu điểm | redeem |
| AL-PRO-07 | This discount code is already saved… | error | Warn | Toast | — | Trùng voucher | redeem/save |
| AL-PRO-08 | Đã tạo/cập nhật/xóa mã giảm giá | success | Info | Toast | Seller/Admin Discounts | CRUD | `/Discount` |
| AL-PRO-09 | ConfirmModal xóa / khóa mã giảm giá | confirm | Warn | ConfirmModal | Admin/Seller Discounts | Delete/lock | DELETE / PATCH lock |
| AL-PRO-10 | Đã tạo/cập nhật/xóa Buy X Get Y | success | Info | Toast | `SellerPromotionsPage` | CRUD | `/Promotion` |
| AL-PRO-11 | Đăng ký sản phẩm Flash Sale thành công | success | Info | Toast | `SellerFlashSalesPage` | Register | `/FlashSale/register` |
| AL-PRO-12 | Flash sale price must be lower… / already registered / only Pending… | error | Warn | Toast | — | Register fail | register |
| AL-PRO-13 | Admin Flash Sale CRUD / duyệt SP / từ chối (PromptModal) | success/confirm | Warn | Toast/Prompt/window.confirm | `AdminFlashSalePage` | Admin FS | `/FlashSale*` |
| AL-PRO-14 | Loyalty gift/tier/evaluate success | success | Info | Toast | `AdminLoyaltyConfigPage` | Config | `/LoyaltyPoint/*` |
| AL-PRO-15 | Broadcast noti gắn Flash Sale — thiếu chương trình/nội dung | validation | Warn | Toast | `AdminNotificationsPage` | Broadcast | `/Admin/notifications/broadcast` |

## Checklist QA Promo Alerts

- [ ] Apply code hết hạn → AL-PRO-02
- [ ] Redeem thiếu điểm → AL-PRO-06
- [ ] Flash price ≥ gốc → AL-PRO-12
