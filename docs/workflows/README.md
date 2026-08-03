# Shopping Food — Workflow Docs (đã gộp UI Trace)

Mỗi file workflow là **một chỗ học đủ** cho Feature đó:

| Phần | Nội dung |
|------|----------|
| **Phần A — UI Interaction Trace** | Nút ở đâu → bấm chạy file/hàm nào → API/BE → data trả về → hiển thị (toast/state/navigate) |
| **Phần B — Workflow nghiệp vụ & Backend** | Luồng số, Mermaid, bước backend, bảo mật, checklist |

> Thư mục `docs/ui-traces/` chỉ còn **chuyển hướng** sang đây — không đọc tách nữa.

---

## Cách đọc một Feature

1. Mở file workflow tương ứng bên dưới  
2. Đọc **Phần A** (nút bấm / UI) trước — dễ hình dung  
3. Đọc **Phần B** (backend / nghiệp vụ)  
4. Đối chiếu Requirements / Alerts nếu cần rule & danh sách toast  

---

## Danh mục Workflow

### Thanh toán & chia tiền (ưu tiên)

| File | Ghi chú |
|------|---------|
| [Revenue_Split_Requirements.md](./Revenue_Split_Requirements.md) | Công thức chia tiền (FR) |
| [Payment_Requirements.md](./Payment_Requirements.md) | FR thanh toán |
| [Payment_Checkout_Workflow.md](./Payment_Checkout_Workflow.md) | **Có Phần A UI Trace Payment** + checkout methods |
| [Payment_Sepay_Workflow.md](./Payment_Sepay_Workflow.md) | QR / Webhook / Workers |
| [Payment_Wallet_Withdraw_Workflow.md](./Payment_Wallet_Withdraw_Workflow.md) | Nạp / rút / COD debt |

### Auth & Profile

| File |
|------|
| [Login_Workflow.md](./Login_Workflow.md) — Login + OTP + OAuth (**Phần A UI**) |
| [Register_Workflow.md](./Register_Workflow.md) |
| [ForgotPassword_Workflow.md](./ForgotPassword_Workflow.md) — đã có UI 3 bước trong cùng file |
| [ChangePassword_Profile_Workflow.md](./ChangePassword_Profile_Workflow.md) |

### Commerce

| File |
|------|
| [Cart_Workflow.md](./Cart_Workflow.md) |
| [Checkout_Order_Workflow.md](./Checkout_Order_Workflow.md) |
| [Product_Catalog_Workflow.md](./Product_Catalog_Workflow.md) |
| [Restaurant_Seller_Workflow.md](./Restaurant_Seller_Workflow.md) |
| [Promotion_Loyalty_Workflow.md](./Promotion_Loyalty_Workflow.md) |

### Logistics

| File |
|------|
| [Shipper_Delivery_Workflow.md](./Shipper_Delivery_Workflow.md) |
| [Coordinator_Dispatch_Workflow.md](./Coordinator_Dispatch_Workflow.md) |

### Support / Realtime / Admin

| File |
|------|
| [Chat_Notification_Workflow.md](./Chat_Notification_Workflow.md) |
| [Support_Admin_Workflow.md](./Support_Admin_Workflow.md) |

---

## Liên kết

- Requirements: [../requirements/README.md](../requirements/README.md)  
- Alerts: [../requirements/ALERTS_INDEX.md](../requirements/ALERTS_INDEX.md)  
- Onboarding: [../ONBOARDING_INDEX.md](../ONBOARDING_INDEX.md)  
