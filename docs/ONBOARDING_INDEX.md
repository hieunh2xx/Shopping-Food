# Shopping Food — Onboarding

## Một Feature = một Workflow (đã gộp UI + backend)

**Mục lục đủ luồng chính (25 mục checklist):**  
→ **[workflows/README.md](./workflows/README.md)**

### Hành trình tối thiểu

| # | Đọc |
|---|-----|
| 1 | [Login_Workflow](./workflows/Login_Workflow.md) |
| 2 | [Browse_Discovery](./workflows/Browse_Discovery_Workflow.md) |
| 3 | [Cart](./workflows/Cart_Workflow.md) → [Checkout_Order](./workflows/Checkout_Order_Workflow.md) |
| 4 | [Payment_Checkout](./workflows/Payment_Checkout_Workflow.md) + [Sepay](./workflows/Payment_Sepay_Workflow.md) |
| 5 | [Revenue_Split](./workflows/Revenue_Split_Requirements.md) |
| 6 | [Shipper_Delivery](./workflows/Shipper_Delivery_Workflow.md) + [Coordinator_Dispatch](./workflows/Coordinator_Dispatch_Workflow.md) |
| 7 | [Admin_Main](./workflows/Admin_Main_Workflow.md) |

### Bổ sung

| Lớp | Link |
|-----|------|
| Requirements FR | [requirements/README.md](./requirements/README.md) |
| Alerts / toast | [requirements/ALERTS_INDEX.md](./requirements/ALERTS_INDEX.md) |
| Tracking UC | [TRACKING_USE_CASES_APIS.md](./TRACKING_USE_CASES_APIS.md) |

```bash
cd src/ShoppingFood.API && dotnet run
cd ShoppingFood.FE && npm run dev
```
