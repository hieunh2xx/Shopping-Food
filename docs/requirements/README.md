# Shopping Food — Requirements Docs

Bộ **Functional Requirements (FR-ID)** cho toàn bộ Feature.  
Bộ **Cảnh báo / Thông báo** nằm ở [ALERTS_INDEX.md](./ALERTS_INDEX.md) và thư mục [alerts/](./alerts/).

Mỗi file Requirements gồm: Mục tiêu · Actors · FR tables · Business rules · APIs · Key files · Acceptance Criteria · Link workflow · Link file cảnh báo.

---

## 1. Requirements theo Feature

### Thanh toán & chia tiền (ưu tiên cao nhất)

| File | Nội dung | Cảnh báo |
|------|----------|----------|
| [Revenue_Split_Requirements.md](./Revenue_Split_Requirements.md) | Sàn / Seller / Shipper kiếm tiền thế nào | [alerts/Revenue_Split_Alerts.md](./alerts/Revenue_Split_Alerts.md) |
| [Payment_Requirements.md](./Payment_Requirements.md) | COD, Wallet, SePay, ví, rút, webhook | [alerts/Payment_Alerts.md](./alerts/Payment_Alerts.md) |

### Auth & Profile

| File | Cảnh báo |
|------|----------|
| [Auth_Requirements.md](./Auth_Requirements.md) | [alerts/Auth_Alerts.md](./alerts/Auth_Alerts.md) |
| [Profile_Requirements.md](./Profile_Requirements.md) | [alerts/Profile_Alerts.md](./alerts/Profile_Alerts.md) |

### Commerce

| File | Cảnh báo |
|------|----------|
| [Cart_Requirements.md](./Cart_Requirements.md) | [alerts/Cart_Alerts.md](./alerts/Cart_Alerts.md) |
| [Order_Requirements.md](./Order_Requirements.md) | [alerts/Order_Alerts.md](./alerts/Order_Alerts.md) |
| [Product_Requirements.md](./Product_Requirements.md) | [alerts/Product_Alerts.md](./alerts/Product_Alerts.md) |
| [Restaurant_Seller_Requirements.md](./Restaurant_Seller_Requirements.md) | [alerts/Restaurant_Seller_Alerts.md](./alerts/Restaurant_Seller_Alerts.md) |
| [Promotion_Loyalty_Requirements.md](./Promotion_Loyalty_Requirements.md) | [alerts/Promotion_Loyalty_Alerts.md](./alerts/Promotion_Loyalty_Alerts.md) |

### Logistics

| File | Cảnh báo |
|------|----------|
| [Logistics_Shipper_Requirements.md](./Logistics_Shipper_Requirements.md) | [alerts/Shipper_Alerts.md](./alerts/Shipper_Alerts.md) |
| [Logistics_Coordinator_Requirements.md](./Logistics_Coordinator_Requirements.md) | [alerts/Coordinator_Alerts.md](./alerts/Coordinator_Alerts.md) |

### Support / Realtime / Admin

| File | Cảnh báo |
|------|----------|
| [Chat_Notification_Requirements.md](./Chat_Notification_Requirements.md) | [alerts/Chat_Alerts.md](./alerts/Chat_Alerts.md) · [alerts/Notification_Alerts.md](./alerts/Notification_Alerts.md) |
| [Support_Admin_Requirements.md](./Support_Admin_Requirements.md) | [alerts/Support_Admin_Alerts.md](./alerts/Support_Admin_Alerts.md) |

### Hệ thống toàn cục

| File cảnh báo | Nội dung |
|---------------|----------|
| [alerts/System_Alerts.md](./alerts/System_Alerts.md) | 503 maintenance, 401 refresh, RBAC 403, seller suspend, exception middleware |

**Mục lục cảnh báo đầy đủ:** [ALERTS_INDEX.md](./ALERTS_INDEX.md)

---

## 2. Map Requirements → Workflows

| Requirements | Workflow |
|--------------|----------|
| Auth | [Login](../workflows/Login_Workflow.md), [Register](../workflows/Register_Workflow.md), [ForgotPassword](../workflows/ForgotPassword_Workflow.md) |
| Profile | [ChangePassword_Profile](../workflows/ChangePassword_Profile_Workflow.md) |
| Cart | [Cart](../workflows/Cart_Workflow.md) |
| Order | [Checkout_Order](../workflows/Checkout_Order_Workflow.md) |
| Product | [Product_Catalog](../workflows/Product_Catalog_Workflow.md) |
| Restaurant | [Restaurant_Seller](../workflows/Restaurant_Seller_Workflow.md) |
| Payment | [Payment_*](../workflows/README.md) |
| Revenue Split | [Revenue_Split](../workflows/Revenue_Split_Requirements.md) (cùng nội dung requirements) |
| Shipper | [Shipper_Delivery](../workflows/Shipper_Delivery_Workflow.md) |
| Coordinator | [Coordinator_Dispatch](../workflows/Coordinator_Dispatch_Workflow.md) |
| Promo | [Promotion_Loyalty](../workflows/Promotion_Loyalty_Workflow.md) |
| Chat/Noti | [Chat_Notification](../workflows/Chat_Notification_Workflow.md) |
| Support/Admin | [Support_Admin](../workflows/Support_Admin_Workflow.md) |

---

## 3. Quy ước ID

```text
FR-<DOMAIN>-<NN>     Functional requirement
AL-<DOMAIN>-<NN>     Alert / warning / toast / confirm
NFR-<DOMAIN>-<NN>    Non-functional (bảo mật, hiệu năng…)
```

**Mức độ cảnh báo:** `Info` | `Warn` | `Critical`

---

## 4. Thứ tự đọc đề xuất

1. [Revenue_Split_Requirements](./Revenue_Split_Requirements.md) + [Payment_Requirements](./Payment_Requirements.md) + alerts Payment/Revenue  
2. Auth → Profile → Cart → Order  
3. Product → Restaurant → Promotion  
4. Shipper → Coordinator  
5. Chat/Notification → Support/Admin  
6. [alerts/System_Alerts.md](./alerts/System_Alerts.md)

Onboarding: [../ONBOARDING_INDEX.md](../ONBOARDING_INDEX.md)  
Workflows: [../workflows/README.md](../workflows/README.md)
