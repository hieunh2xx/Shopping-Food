# Requirements: Đặt hàng & Vòng đời đơn (Order)

Tài liệu yêu cầu nghiệp vụ cho checkout, theo dõi đơn, vòng đời Seller, hủy/reorder, self-delivery.

> Workflow: [../workflows/Checkout_Order_Workflow.md](../workflows/Checkout_Order_Workflow.md)  
> Tiền / chia tiền: [Payment_Requirements.md](./Payment_Requirements.md) · [Revenue_Split_Requirements.md](./Revenue_Split_Requirements.md)  
> Giỏ: [Cart_Requirements.md](./Cart_Requirements.md)

---

## 1. Mục tiêu

1. Tạo đơn từ giỏ (Customer hoặc Guest + OTP).
2. Tính `TotalAmount`, `ShippingFee`, `ShipperIncome` theo DeliveryType quán.
3. Gắn thanh toán (COD / Wallet / Sepay / stub) qua PaymentSettlementService.
4. Seller xử lý: accept → prepare → waiting-for-shipper (hoặc self-delivery / reject / cancel).
5. Customer: xem đơn, hủy (điều kiện), reorder.
6. Sau giao thành công: settle tài chính (xem Revenue Split).

---

## 2. Actors

| Actor | Quyền |
|-------|--------|
| **Guest** | `checkout/sent-otp`, `checkout` (COD), `GuestOrders/{guestUserId}`, details |
| **Customer** | checkout mọi method (theo Payment), MyOrders, cancel, reorder, recent-items |
| **Seller / Mall** | RestaurantOrders, accept/reject/prepare/waiting, seller-cancel, self-delivery confirm |
| **Shipper / Coordinator** | Đổi status giao / gán shipper (xem Logistics requirements / workflows) — ngoài scope file này chi tiết |
| **Admin** | Giám sát / khiếu nại đơn |

---

## 3. Functional Requirements

### 3.1. Checkout

| ID | Requirement |
|----|-------------|
| FR-ORD-01 | `POST /api/Order/checkout` tạo Order + OrderItems từ Cart |
| FR-ORD-02 | Guest: bắt buộc OTP hợp lệ — `POST /api/Order/checkout/sent-otp` trước |
| FR-ORD-03 | Tính `ItemsSubtotal`, `ShippingFee`, `ShipperIncome` (+ breakdown base/distance/peak) trong `CheckoutHandler.CalculateTotalAmountAsync` |
| FR-ORD-04 | Áp dụng voucher qua flow Discount apply (FE gọi `/Discount/apply` trước/trong checkout) |
| FR-ORD-05 | Gọi `PaymentSettlementService.ProcessCheckoutPaymentAsync` theo `PaymentMethod` |
| FR-ORD-06 | Response flags: `requiresSepayRedirect`, `requiresPaymentConfirmation`, `paymentSessionId`, `orderId` |
| FR-ORD-07 | Guest thực tế chỉ COD (online methods requiresAuth) — xem Payment FR |
| FR-ORD-08 | Status đơn mới = `Pending`; PaymentStatus theo method |
| FR-ORD-09 | Lưu địa chỉ giao, contact, note, lat/lng nếu có |

### 3.2. Tra cứu đơn

| ID | Requirement |
|----|-------------|
| FR-ORD-10 | `GET /api/Order/MyOrders` — đơn của user đăng nhập |
| FR-ORD-11 | `GET /api/Order/GuestOrders/{guestUserId}` — đơn guest |
| FR-ORD-12 | `GET /api/Order/details/{idOrCode}` — chi tiết theo Id hoặc mã |
| FR-ORD-13 | `GET /api/Order/RestaurantOrders` — đơn của quán Seller |
| FR-ORD-14 | `GET /api/Order/recent-items` — món gần đây để mua lại |
| FR-ORD-15 | Phân quyền xem: chỉ chủ đơn / seller quán / role điều phối-admin theo handler |

### 3.3. Vòng đời Seller

| ID | Requirement |
|----|-------------|
| FR-ORD-20 | `POST /api/Order/accept` — Pending → **Confirmed** (chỉ quán sở hữu món) |
| FR-ORD-21 | `POST /api/Order/reject` — Pending → **Cancelled**; cần lý do |
| FR-ORD-22 | `POST /api/Order/prepare` — → **Preparing** |
| FR-ORD-23 | `POST /api/Order/waiting-for-shipper` — → **WaitingForShipper** (platform delivery) |
| FR-ORD-24 | `POST /api/Order/seller-cancel` — hủy bởi seller (điều kiện status); Prompt lý do trên FE |
| FR-ORD-25 | `POST /api/Order/{id}/self-delivery/confirm-success` — quán tự giao xong → Delivered + `SettleSelfDeliveryOrderAsync` |
| FR-ORD-26 | Seller chỉ thao tác đơn chứa món của restaurant mình |

### 3.4. Customer cancel / reorder / update

| ID | Requirement |
|----|-------------|
| FR-ORD-30 | `PUT /api/Order/cancel` — customer hủy khi còn cho phép (thường Pending/Confirmed — theo handler) |
| FR-ORD-31 | Hủy đơn đã **Paid** online → `ProcessRefundAsync` hoàn ví Customer |
| FR-ORD-32 | Hủy COD chưa settle → không hoàn ví |
| FR-ORD-33 | `POST /api/Order/reorder` — thêm lại các món còn available vào cart |
| FR-ORD-34 | `PUT /api/Order/update` — chỉ đơn Pending; đúng chủ sở hữu |

### 3.5. Giao hàng (tham chiếu)

| ID | Requirement |
|----|-------------|
| FR-ORD-40 | Shipper accept → status **Shipping** (chi tiết Shipper workflow) |
| FR-ORD-41 | confirm-delivered → **Delivered** + `SettleOrderOnDeliveryAsync` |
| FR-ORD-42 | Tiền Seller/Shipper/Platform chỉ cộng ví khi settle — [Revenue_Split_Requirements.md](./Revenue_Split_Requirements.md) |

---

## 4. Business rules / State

### OrderStatus

```text
Pending
  → Confirmed          (accept)
  → Cancelled          (reject / cancel / seller-cancel)
Confirmed → Preparing → WaitingForShipper → Shipping → Delivered
Self-delivery: có thể bỏ WaitingForShipper/Shipping → confirm-success → Delivered
```

### PaymentStatus (tóm tắt)
`Pending` | `Paid` | `Failed` | `Refunded` | `Settled` — chi tiết Payment + Revenue Split.

### Idempotent settle
`IsFinancialSettled = true` sau settle lần đầu.

---

## 5. APIs chính

| Method | Route | Actor |
|--------|-------|-------|
| POST | `/api/Order/checkout` | Customer/Guest |
| POST | `/api/Order/checkout/sent-otp` | Guest |
| GET | `/api/Order/MyOrders` | Customer |
| GET | `/api/Order/GuestOrders/{guestUserId}` | Guest |
| GET | `/api/Order/details/{idOrCode}` | Mixed |
| GET | `/api/Order/RestaurantOrders` | Seller |
| GET | `/api/Order/recent-items` | Auth |
| PUT | `/api/Order/update` | Owner |
| PUT | `/api/Order/cancel` | Customer |
| POST | `/api/Order/reorder` | Customer |
| POST | `/api/Order/accept` | Seller |
| POST | `/api/Order/reject` | Seller |
| POST | `/api/Order/prepare` | Seller |
| POST | `/api/Order/waiting-for-shipper` | Seller |
| POST | `/api/Order/seller-cancel` | Seller |
| POST | `/api/Order/{id}/self-delivery/confirm-success` | Seller |

---

## 6. Key files

| Tầng | Path |
|------|------|
| Controller | `src/ShoppingFood.API/Controllers/OrderController.cs` |
| Checkout | `Application/Features/Orders/Commands/CheckoutHandler.cs` |
| Settle | `Application/Services/PaymentSettlementService.cs` |
| Other cmds | `Application/Features/Orders/Commands/*` |
| Queries | `Application/Features/Orders/Queries/*` |
| Entity | `Domain/Models/Order.cs`, `OrderItem.cs` |
| FE Checkout | `ShoppingFood.FE/src/pages/CheckoutPage.tsx` |
| FE Seller | `pages/seller/SellerOrdersPage.tsx` |
| FE Detail | `components/order/CustomerOrderDetailModal.tsx` |
| FE Service | `services/OrderService.ts` |

---

## 7. Acceptance Criteria

- [ ] Guest: gửi OTP → checkout COD → thấy GuestOrders
- [ ] Customer Wallet đủ tiền → Paid ngay; thiếu tiền → lỗi, không tạo Paid
- [ ] Sepay → flags redirect + QR (xem Payment)
- [ ] Seller accept → prepare → waiting-for-shipper đúng status
- [ ] Reject/cancel cần lý do trên FE; status Cancelled
- [ ] Self-delivery confirm → Delivered + seller nhận payout (+ship) theo split
- [ ] Customer cancel đơn Paid → hoàn ví
- [ ] Reorder chỉ thêm món còn available
- [ ] Delivered lần 2 không settle trùng

---

## 8. Cảnh báo / Thông báo hệ thống

| Message | Loại | File FE | Trigger | API | Mức độ |
|---------|------|---------|---------|-----|--------|
| Vui lòng điền đầy đủ thông tin giao hàng | error | `CheckoutPage.tsx` | Thiếu địa chỉ | — | Warn |
| Mã OTP đã được gửi đến email của bạn | success | `CheckoutPage.tsx` | Guest OTP | `/Order/checkout/sent-otp` | Info |
| Lỗi khi gửi mã OTP | error | `CheckoutPage.tsx` | OTP fail | sent-otp | Warn |
| Vui lòng nhập mã OTP | error | `CheckoutPage.tsx` | Checkout guest | — | Warn |
| Áp dụng mã giảm giá thành công | success | `CheckoutPage.tsx` | Apply voucher | `/Discount/apply` | Info |
| Mã giảm giá không hợp lệ | error | `CheckoutPage.tsx` | Apply fail | `/Discount/apply` | Warn |
| Đã gỡ mã giảm giá | success | `CheckoutPage.tsx` | Remove voucher | — | Info |
| Đã lấy vị trí hiện tại | success | `CheckoutPage.tsx` | GPS OK | — | Info |
| Không thể lấy vị trí… / Trình duyệt không hỗ trợ định vị | error | `CheckoutPage.tsx` | GPS fail | — | Warn |
| Đơn hàng đã tạo. Quét mã QR bên dưới để thanh toán. | success | `CheckoutPage.tsx` | Sepay | `/Order/checkout` | Info |
| Đặt hàng thành công! Mã đơn hàng của bạn là: … | success | `CheckoutPage.tsx` | COD/Wallet/confirm | `/Order/checkout` | Info |
| Lỗi khi đặt hàng | error | `CheckoutPage.tsx` | Checkout fail | `/Order/checkout` | Critical |
| Giỏ hàng trống, quay lại trang chủ | info | `CheckoutPage.tsx` | Empty | — | Info |
| **Hủy đơn hàng** / Bạn có chắc muốn hủy…? | confirm | `CustomerOrderDetailModal.tsx` | Cancel | `PUT /Order/cancel` | Warn |
| Hủy đơn hàng thành công | success | `CustomerOrderDetailModal.tsx` | Cancel OK | `/Order/cancel` | Info |
| Đã thêm lại các món vào giỏ hàng | success | `CustomerOrderDetailModal.tsx` | Reorder | `/Order/reorder` | Info |
| Lỗi tải chi tiết đơn hàng | error | `CustomerOrderDetailModal.tsx` | Load detail | `/Order/details/*` | Warn |
| Đã chấp nhận đơn hàng! | success | `SellerOrdersPage.tsx` | Accept | `/Order/accept` | Info |
| Đang thực hiện nấu món! | success | `SellerOrdersPage.tsx` | Prepare | `/Order/prepare` | Info |
| Chuẩn bị xong! Đang chờ tài xế đến lấy... | success | `SellerOrdersPage.tsx` | Waiting | `/Order/waiting-for-shipper` | Info |
| Đã từ chối đơn hàng thành công | success | `SellerOrdersPage.tsx` | Reject | `/Order/reject` | Warn |
| Vui lòng nhập lý do từ chối | error | `SellerOrdersPage.tsx` | Reject empty | — | Warn |
| Đã hủy đơn hàng thành công | success | `SellerOrdersPage.tsx` | Seller cancel | `/Order/seller-cancel` | Warn |
| PromptModal nhập lý do hủy | confirm | `SellerOrdersPage.tsx` | Seller cancel | `/Order/seller-cancel` | Warn |
| Xác nhận giao hàng thành công! | success | `SellerOrdersPage.tsx` | Self-delivery | `/Order/{id}/self-delivery/confirm-success` | Info |
| Tải danh sách đơn hàng thất bại do lỗi kết nối mạng. | error | `SellerOrdersPage.tsx` | Load | `/Order/RestaurantOrders` | Warn |
| Gửi khiếu nại đơn hàng thành công | success | `CustomerOrderDetailModal.tsx` | Complaint | `/Support/order-complaint` | Info |
| Vui lòng nhập lý do khiếu nại | validation | `CustomerOrderDetailModal.tsx` | Form | — | Warn |

---

## 9. Tóm tắt

Order = **Checkout (+ OTP guest) → Seller lifecycle → Shipper/Self delivery → Settle tiền**.  
Không tách tiền ở file này — bắt buộc đọc [Revenue_Split_Requirements.md](./Revenue_Split_Requirements.md) và [Payment_Requirements.md](./Payment_Requirements.md).
