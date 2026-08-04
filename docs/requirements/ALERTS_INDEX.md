# Cảnh báo / Thông báo hệ thống — Mục lục

Mỗi Feature có **1 file cảnh báo** riêng. Cột chuẩn:

| Cột | Ý nghĩa |
|-----|---------|
| **ID** | AL-<DOMAIN>-NN |
| **Message** | Nội dung hiển thị (hoặc fallback FE) |
| **Loại** | success / error / warning / info / confirm / validation / loading |
| **Mức độ** | Info / Warn / Critical |
| **Nơi hiện** | Toast / ConfirmModal / PromptModal / window.confirm / Inline / Redirect |
| **File** | FE (hoặc BE message) |
| **Trigger** | Sự kiện người dùng / hệ thống |
| **API / Hub** | Endpoint liên quan |

**Cơ chế UI toàn cục:** `react-hot-toast` trong `App.tsx` · HTTP **503 → `/maintenance`** (`HttpClient.ts`).

---

## Danh sách file cảnh báo

| Feature | File |
|---------|------|
| Auth | [alerts/Auth_Alerts.md](./alerts/Auth_Alerts.md) |
| Profile | [alerts/Profile_Alerts.md](./alerts/Profile_Alerts.md) |
| Cart | [alerts/Cart_Alerts.md](./alerts/Cart_Alerts.md) |
| Order | [alerts/Order_Alerts.md](./alerts/Order_Alerts.md) |
| Payment | [alerts/Payment_Alerts.md](./alerts/Payment_Alerts.md) |
| Revenue Split | [alerts/Revenue_Split_Alerts.md](./alerts/Revenue_Split_Alerts.md) |
| Product | [alerts/Product_Alerts.md](./alerts/Product_Alerts.md) |
| Restaurant / Seller | [alerts/Restaurant_Seller_Alerts.md](./alerts/Restaurant_Seller_Alerts.md) |
| Shipper | [alerts/Shipper_Alerts.md](./alerts/Shipper_Alerts.md) |
| Coordinator | [alerts/Coordinator_Alerts.md](./alerts/Coordinator_Alerts.md) |
| Promotion / Loyalty | [alerts/Promotion_Loyalty_Alerts.md](./alerts/Promotion_Loyalty_Alerts.md) |
| Chat | [alerts/Chat_Alerts.md](./alerts/Chat_Alerts.md) |
| Notification | [alerts/Notification_Alerts.md](./alerts/Notification_Alerts.md) |
| Support / Admin | [alerts/Support_Admin_Alerts.md](./alerts/Support_Admin_Alerts.md) |
| System (global) | [alerts/System_Alerts.md](./alerts/System_Alerts.md) |

---

## Requirements tương ứng

Xem [../README.md](./README.md).
