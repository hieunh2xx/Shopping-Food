# Shopping Food — Mục lục Workflow (đủ luồng chính)

Mỗi file = **Phần A (UI nút → code → data → hiển thị)** + **Phần B (nghiệp vụ/backend)**.

---

## Checklist phủ Feature (luồng chính)

| # | Luồng chính | Workflow | Đủ? |
|---|-------------|----------|-----|
| 1 | Đăng nhập (password / OTP / Google / MS / Phone) | [Login_Workflow.md](./Login_Workflow.md) | ✅ |
| 2 | Đăng ký Customer / Seller / Shipper | [Register_Workflow.md](./Register_Workflow.md) | ✅ |
| 3 | Quên mật khẩu (OTP 3 bước) | [ForgotPassword_Workflow.md](./ForgotPassword_Workflow.md) | ✅ |
| 4 | Hồ sơ / đổi MK / địa chỉ / khóa / xóa TK | [ChangePassword_Profile_Workflow.md](./ChangePassword_Profile_Workflow.md) | ✅ |
| 5 | Duyệt Home / Search SP / Quán / Chi tiết | [Browse_Discovery_Workflow.md](./Browse_Discovery_Workflow.md) | ✅ |
| 6 | Giỏ hàng auth + guest | [Cart_Workflow.md](./Cart_Workflow.md) | ✅ |
| 7 | Checkout + vòng đời đơn (Seller/Customer) | [Checkout_Order_Workflow.md](./Checkout_Order_Workflow.md) | ✅ |
| 8 | Thanh toán COD / Wallet / Sepay / stub | [Payment_Checkout_Workflow.md](./Payment_Checkout_Workflow.md) | ✅ |
| 9 | SePay QR / Webhook / Reconcile | [Payment_Sepay_Workflow.md](./Payment_Sepay_Workflow.md) | ✅ |
| 10 | Nạp ví / Rút tiền / COD debt | [Payment_Wallet_Withdraw_Workflow.md](./Payment_Wallet_Withdraw_Workflow.md) | ✅ |
| 11 | Chia tiền Sàn–Seller–Shipper | [Revenue_Split_Requirements.md](./Revenue_Split_Requirements.md) | ✅ |
| 12 | FR thanh toán tổng | [Payment_Requirements.md](./Payment_Requirements.md) | ✅ |
| 13 | Catalog SP (CRUD seller + browse) | [Product_Catalog_Workflow.md](./Product_Catalog_Workflow.md) | ✅ |
| 14 | Danh mục quán + Topping | [Seller_Menu_Topping_Workflow.md](./Seller_Menu_Topping_Workflow.md) | ✅ |
| 15 | Đánh giá SP (Customer + Seller reply) | [Seller_Reviews_Workflow.md](./Seller_Reviews_Workflow.md) | ✅ |
| 16 | Nhà hàng / ApplySeller / Settings | [Restaurant_Seller_Workflow.md](./Restaurant_Seller_Workflow.md) | ✅ |
| 17 | Nâng cấp Mall | [Mall_Upgrade_Workflow.md](./Mall_Upgrade_Workflow.md) | ✅ |
| 18 | Voucher / BuyXGetY / Flash / Loyalty | [Promotion_Loyalty_Workflow.md](./Promotion_Loyalty_Workflow.md) | ✅ |
| 19 | Shipper online → giao hàng | [Shipper_Delivery_Workflow.md](./Shipper_Delivery_Workflow.md) | ✅ |
| 20 | Coordinator điều phối | [Coordinator_Dispatch_Workflow.md](./Coordinator_Dispatch_Workflow.md) | ✅ |
| 21 | Chat support / order chat | [Chat_Notification_Workflow.md](./Chat_Notification_Workflow.md) | ✅ |
| 22 | Notification realtime + Bell | [Notification_Realtime_Workflow.md](./Notification_Realtime_Workflow.md) | ✅ |
| 23 | FAQ / Khiếu nại / Appeal | [Help_FAQ_Appeal_Workflow.md](./Help_FAQ_Appeal_Workflow.md) | ✅ |
| 24 | Admin portal (approvals→finance→RBAC…) | [Admin_Main_Workflow.md](./Admin_Main_Workflow.md) | ✅ |
| 25 | Support/Admin bổ sung (tổng) | [Support_Admin_Workflow.md](./Support_Admin_Workflow.md) | ✅ |

---

## Học theo hành trình người dùng

### Khách (Guest → Customer)

```text
Browse_Discovery → Cart → Checkout_Order → Payment_* → (Shipper giao)
  → Seller_Reviews / Help_FAQ_Appeal / Chat / Notification
  → Profile / Loyalty (Promotion_Loyalty)
```

### Seller / Mall

```text
Register/ApplySeller → Product_Catalog + Seller_Menu_Topping
  → SellerOrders (trong Checkout_Order) → Settings (Restaurant)
  → Discounts/Flash (Promotion) → Reviews → Chat
  → Wallet rút (Payment_Wallet) → Mall_Upgrade → Appeal (Help)
```

### Shipper

```text
Register shipper → Shipper_Delivery → Wallet/COD debt → Notification
```

### Coordinator

```text
Coordinator_Dispatch → Incidents → Chat → (link Admin complaints)
```

### Admin

```text
Admin_Main (Approvals, Users, Restaurants, Finance, Permissions,
  Maintenance, Blacklist, Reports, Broadcast, Logs, FAQ, Promo…)
```

---

## Map Controller → Workflow

| Controller | Workflow chính |
|------------|----------------|
| User | Login, Register, Forgot, Profile, Mall |
| Cart | Cart |
| Order | Checkout_Order |
| Payment / Sepay | Payment_* |
| Product / MenuCategory / Topping | Product_Catalog, Seller_Menu_Topping, Seller_Reviews |
| Restaurant | Browse_Discovery, Restaurant_Seller |
| Discount / Promotion / FlashSale / Loyalty | Promotion_Loyalty |
| Shipper | Shipper_Delivery |
| Coordinator | Coordinator_Dispatch |
| Chat / Notification | Chat_Notification, Notification_Realtime |
| Faq / Support / System | Help_FAQ_Appeal, Support_Admin |
| Admin | Admin_Main |

---

## Cách đọc một file

1. **Phần A** — tìm nút bạn đang nhìn trên UI  
2. **Phần B** — hiểu rule backend / DB  
3. Requirements/Alerts — nếu cần FR-ID hoặc danh sách toast  

Requirements: [../requirements/README.md](../requirements/README.md)  
Alerts: [../requirements/ALERTS_INDEX.md](../requirements/ALERTS_INDEX.md)  
Onboarding: [../ONBOARDING_INDEX.md](../ONBOARDING_INDEX.md)  
