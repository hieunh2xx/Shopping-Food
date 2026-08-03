# Shopping Food — Onboarding

## Học một Feature = mở 1 file Workflow

Mỗi workflow đã **gộp UI Trace + luồng backend**:

1. **Phần A** — Nút ở đâu → chạy file nào → data → hiển thị  
2. **Phần B** — Workflow nghiệp vụ / API / bảo mật / checklist  

**Mục lục:** [workflows/README.md](./workflows/README.md)

### Gợi ý đọc trước

| Thứ tự | File |
|--------|------|
| 1 | [workflows/Login_Workflow.md](./workflows/Login_Workflow.md) |
| 2 | [workflows/Cart_Workflow.md](./workflows/Cart_Workflow.md) |
| 3 | [workflows/Checkout_Order_Workflow.md](./workflows/Checkout_Order_Workflow.md) |
| 4 | [workflows/Payment_Checkout_Workflow.md](./workflows/Payment_Checkout_Workflow.md) + [Payment_Sepay](./workflows/Payment_Sepay_Workflow.md) |
| 5 | [workflows/Revenue_Split_Requirements.md](./workflows/Revenue_Split_Requirements.md) |
| 6 | [workflows/Shipper_Delivery_Workflow.md](./workflows/Shipper_Delivery_Workflow.md) |

### Lớp bổ sung (khi cần)

| Lớp | Link |
|-----|------|
| Requirements (FR-ID) | [requirements/README.md](./requirements/README.md) |
| Cảnh báo / toast ID | [requirements/ALERTS_INDEX.md](./requirements/ALERTS_INDEX.md) |
| Tracking use case | [TRACKING_USE_CASES_APIS.md](./TRACKING_USE_CASES_APIS.md) |

> `docs/ui-traces/` chỉ còn trang chuyển hướng → workflows.

```bash
cd src/ShoppingFood.API && dotnet run   # :5091
cd ShoppingFood.FE && npm run dev       # :5173
```
