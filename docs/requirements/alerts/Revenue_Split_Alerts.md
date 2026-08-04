# Cảnh báo — Revenue Split (chia tiền)

> Requirements: [../Revenue_Split_Requirements.md](../Revenue_Split_Requirements.md)

Phần chia tiền **ít toast UI trực tiếp**; cảnh báo chủ yếu là **rule nghiệp vụ / audit** khi settle sai hoặc config lệch.

| ID | Message / Điều kiện cảnh báo | Loại | Mức độ | Nơi hiện | File / Nguồn | Trigger | API / Job |
|----|------------------------------|------|--------|----------|--------------|---------|-----------|
| AL-REV-01 | Đơn settle khi `IsFinancialSettled=true` → bỏ qua (không cộng trùng) | info | Info | Server | `SettleOrderOnDeliveryAsync` | Settle lần 2 | confirm-delivered |
| AL-REV-02 | COD: tăng `CodCollectedAmount` = SellerPayout + Commission | info | Warn | DB/Shipper UI | Settlement COD branch | Giao COD xong | Shipper deliver |
| AL-REV-03 | Shipper vượt `DefaultShipperDebtLimit` (5M) | warning | Critical | Ops/Admin | `ShipperProfile` + config | Nợ COD cao | debt-limit / monitor |
| AL-REV-04 | `CustomCommissionRate` quán **không** áp dụng khi settle (gap) | warning | Warn | Docs/Tech debt | `CalculateSplit` vs RestaurantProfile | Admin set rate quán | finance-config/restaurants |
| AL-REV-05 | CommissionRate = 0 hoặc null config → tạo default 10% | info | Warn | Server | `GetConfigAsync` | Config thiếu | finance-config |
| AL-REV-06 | Self-delivery: Seller nhận ship + phải trừ Commission | info | Info | Txn log | `SettleSelfDeliveryOrderAsync` | Self confirm | self-delivery |
| AL-REV-07 | Online Paid cancel → Refund full TotalAmount ví Customer | success/info | Warn | Toast (order cancel path) | `ProcessRefundAsync` | Cancel paid order | cancel |
| AL-REV-08 | Seller/Shipper chưa thấy tiền sau checkout (chưa giao) | info | Info | UX expectation | Docs | User hỏi “sao chưa có tiền?” | — |
| AL-REV-09 | Rút tiền Seller/Shipper min 50k / Admin reject hoàn ví | error/success | Warn | Toast | PartnerWallet / AdminFinance | Withdraw flow | withdraw/approve |
| AL-REV-10 | Sai lệch ShippingFee vs ShipperIncome (biên phí sàn) | info | Info | Báo cáo | Order fields | Audit | dashboard/reconciliation |

## Checklist QA Revenue Alerts

- [ ] Sau deliver: ví Seller/Shipper/Platform đúng công thức (xem ví dụ 100k/10%)
- [ ] Settle 2 lần không double credit (AL-REV-01)
- [ ] COD debt tăng đúng (AL-REV-02)
- [ ] Document gap CustomCommissionRate (AL-REV-04) khi training team
