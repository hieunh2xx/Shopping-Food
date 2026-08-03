# Shopping Food — Workflow Docs

Mỗi file mô tả **một quy trình nghiệp vụ** (bước chạy + code).

> **Requirements (FR) & Alerts:** xem [../requirements/README.md](../requirements/README.md) và [../requirements/ALERTS_INDEX.md](../requirements/ALERTS_INDEX.md) — đây là lớp “phải làm gì” + “cảnh báo hệ thống”.

Format workflow: Luồng số → Mermaid → URL/API/code → call chain → toast → bảo mật → checklist.

---

## Danh mục đầy đủ

### Thanh toán & chia tiền (đọc trước khi đụng tiền) — ƯU TIÊN CAO NHẤT

| Ưu tiên | Feature | File |
|---------|---------|------|
| ★★★ | **Chia tiền Sàn / Seller / Shipper (Requirements + ví dụ số)** | [Revenue_Split_Requirements.md](./Revenue_Split_Requirements.md) |
| ★★★ | **Payment — Requirements (FR/NFR)** | [Payment_Requirements.md](./Payment_Requirements.md) |
| ★★★ | Payment — Checkout theo method | [Payment_Checkout_Workflow.md](./Payment_Checkout_Workflow.md) |
| ★★★ | Payment — SePay QR / Webhook / Reconcile | [Payment_Sepay_Workflow.md](./Payment_Sepay_Workflow.md) |
| ★★★ | Payment — Ví / Nạp / Rút / COD debt | [Payment_Wallet_Withdraw_Workflow.md](./Payment_Wallet_Withdraw_Workflow.md) |

### Auth & Profile

| Feature | File |
|---------|------|
| Đăng nhập (+ OAuth / OTP 2FA) | [Login_Workflow.md](./Login_Workflow.md) |
| Đăng ký Customer / Seller / Shipper | [Register_Workflow.md](./Register_Workflow.md) |
| Quên mật khẩu | [ForgotPassword_Workflow.md](./ForgotPassword_Workflow.md) |
| Đổi MK / Hồ sơ / Địa chỉ / Lock / Xóa TK | [ChangePassword_Profile_Workflow.md](./ChangePassword_Profile_Workflow.md) |

### Commerce

| Feature | File |
|---------|------|
| Giỏ hàng (auth + guest) | [Cart_Workflow.md](./Cart_Workflow.md) |
| Checkout & vòng đời đơn | [Checkout_Order_Workflow.md](./Checkout_Order_Workflow.md) |
| Catalog sản phẩm + duyệt Admin | [Product_Catalog_Workflow.md](./Product_Catalog_Workflow.md) |
| Nhà hàng / ApplySeller / Mall | [Restaurant_Seller_Workflow.md](./Restaurant_Seller_Workflow.md) |
| KM / Flash / Loyalty | [Promotion_Loyalty_Workflow.md](./Promotion_Loyalty_Workflow.md) |

### Logistics

| Feature | File |
|---------|------|
| Shipper giao hàng | [Shipper_Delivery_Workflow.md](./Shipper_Delivery_Workflow.md) |
| Coordinator điều phối | [Coordinator_Dispatch_Workflow.md](./Coordinator_Dispatch_Workflow.md) |

### Support & Realtime & Admin

| Feature | File |
|---------|------|
| Chat + Notification realtime | [Chat_Notification_Workflow.md](./Chat_Notification_Workflow.md) |
| FAQ / Complaint / RBAC / Maintenance / Logs | [Support_Admin_Workflow.md](./Support_Admin_Workflow.md) |

---

## Thứ tự đọc đề xuất

1. **Revenue_Split_Requirements** (ai kiếm bao nhiêu) → **Payment_Requirements** → Payment_Checkout → Payment_Sepay → Payment_Wallet_Withdraw  
2. Login → Register → ForgotPassword → ChangePassword_Profile  
3. Cart → Checkout_Order (link sang Payment)  
4. Product_Catalog → Restaurant_Seller → Promotion_Loyalty  
5. Shipper_Delivery → Coordinator_Dispatch  
6. Chat_Notification → Support_Admin  

---

## Liên kết onboarding

- [../ONBOARDING_INDEX.md](../ONBOARDING_INDEX.md)  
- [../ONBOARDING_PART2_FEATURES_FLOWS.md](../ONBOARDING_PART2_FEATURES_FLOWS.md)  
- [../TRACKING_USE_CASES_APIS.md](../TRACKING_USE_CASES_APIS.md)  
