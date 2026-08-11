# Requirements: Thanh toán & Tài chính (Payment & Finance)

Tài liệu **yêu cầu nghiệp vụ** cho phân hệ thanh toán UniEats. Đọc trước khi đọc các workflow chi tiết.

> Workflow liên quan:
> - [Payment_Checkout_Workflow.md](./Payment_Checkout_Workflow.md) — thanh toán khi đặt hàng
> - [Payment_Sepay_Workflow.md](./Payment_Sepay_Workflow.md) — QR / Webhook / IPN / Reconcile / Expiry
> - [Payment_Wallet_Withdraw_Workflow.md](./Payment_Wallet_Withdraw_Workflow.md) — nạp ví / rút tiền / công nợ COD

---

## 1. Mục tiêu nghiệp vụ

1. Cho phép khách thanh toán đơn hàng bằng **COD**, **Ví hệ thống**, hoặc **SePay VietQR**.
2. Khi SePay không cấu hình: fallback **CreditCard / EWallet giả lập** (confirm thủ công qua API — không phải cổng thật).
3. Quản lý **ví** (Customer / Seller / Shipper / Platform), **hoa hồng sàn**, **công nợ COD shipper**, **rút tiền**.
4. Đảm bảo xác nhận thanh toán online **idempotent**, khớp số tiền, có cơ chế **đối soát** và **hết hạn phiên**.

---

## 2. Actors & quyền

| Actor | Quyền thanh toán / tài chính |
|-------|------------------------------|
| **Guest** | Chỉ **COD** khi checkout (online method yêu cầu đăng nhập) |
| **Customer** | COD, SystemWallet, Sepay; nạp ví; xem lịch sử; xin e-invoice |
| **Seller / Mall** | Nhận payout vào ví quán; rút tiền; xem giao dịch |
| **Shipper** | Nhận thu nhập; tích/nộp công nợ COD; rút tiền |
| **Admin** | Duyệt rút tiền; cấu hình finance; dashboard; reconcile/diagnostics |
| **SePay (hệ thống ngoài)** | Gọi Webhook / IPN (public, bảo vệ bằng secret) |

---

## 3. Phương thức thanh toán (Functional Requirements)

### FR-PM-01 — Liệt kê phương thức

- API: `GET /api/Payment/methods`
- Luôn có: `COD`, `SystemWallet` (`requiresAuth: true`)
- Nếu SePay **enabled** và resolve được tài khoản ngân hàng → thêm `Sepay` (ưu tiên)
- Nếu SePay **không** khả dụng → thêm stub `CreditCard`, `EWallet`

### FR-PM-02 — COD

| ID | Requirement |
|----|-------------|
| FR-COD-01 | Checkout tạo Order với `PaymentStatus = Pending`, không tạo `PaymentSession` |
| FR-COD-02 | Guest được dùng COD |
| FR-COD-03 | Khi giao thành công: settle tài chính → `PaymentStatus = Settled`, tăng công nợ COD shipper (platform delivery) hoặc settle self-delivery |
| FR-COD-04 | Hủy đơn COD trước settle: không hoàn tiền ví (chưa thu) |

### FR-PM-03 — SystemWallet

| ID | Requirement |
|----|-------------|
| FR-WAL-01 | Bắt buộc đăng nhập |
| FR-WAL-02 | Số dư ví ≥ `Order.TotalAmount` — nếu thiếu → lỗi `"Số dư ví không đủ..."` |
| FR-WAL-03 | Trừ ví ngay (`FinancialTransactionType.Payment`), `PaymentStatus = Paid` |
| FR-WAL-04 | Không tạo PaymentSession / không cần QR |
| FR-WAL-05 | Khi giao xong: split hoa hồng / seller / shipper; đánh dấu `IsFinancialSettled` |

### FR-PM-04 — SePay VietQR (ưu tiên online)

| ID | Requirement |
|----|-------------|
| FR-SPY-01 | Bắt buộc đăng nhập |
| FR-SPY-02 | Tạo `PaymentSession`: invoice `SF` + hex, `ExpiresAt = now + 10 phút`, status `Pending` |
| FR-SPY-03 | FE hiển thị QR + nội dung CK; poll status; lắng nghe SignalR notification |
| FR-SPY-04 | **Không** cho `POST /Payment/confirm` với Sepay (chặn giả Paid) |
| FR-SPY-05 | Xác nhận chỉ qua Webhook / IPN / Reconcile (khớp invoice + số tiền ±1₫) |
| FR-SPY-06 | Thành công → session `Completed`, Order `Paid`, thông báo seller |
| FR-SPY-07 | Hết hạn → session `Expired` (worker mỗi 1 phút); vẫn có thể reconcile late-pay trong cửa sổ 24h |

### FR-PM-05 — CreditCard / EWallet (fallback giả lập)

| ID | Requirement |
|----|-------------|
| FR-CARD-01 | Chỉ hiện khi SePay không khả dụng |
| FR-CARD-02 | Tạo session expiry **15 phút** |
| FR-CARD-03 | FE gọi ngay `POST /api/Payment/confirm` → đánh dấu Paid (không tích hợp PSP thật) |
| FR-CARD-04 | Tài liệu / QA phải ghi rõ đây là **stub** |

---

## 4. Phiên thanh toán (PaymentSession)

| ID | Requirement |
|----|-------------|
| FR-SES-01 | Mỗi lần checkout online / top-up tạo 1 session |
| FR-SES-02 | Trạng thái: `Pending` → `Completed` \| `Expired` \| `Failed` |
| FR-SES-03 | SePay expiry mặc định **10 phút** (`SepayOptions.QrExpiryMinutes`) |
| FR-SES-04 | Khớp số tiền: `\|paid − session.Amount\| ≤ 1` VND |
| FR-SES-05 | “Đã thanh toán SePay” = Status Completed **và** có `ExternalTransactionId` hoặc `SepayOrderId` |
| FR-SES-06 | Liên kết Order qua `Order.PaymentSessionId` / `PaymentSession.OrderId` (logical, có thể không có FK DB) |

---

## 5. Ví & giao dịch (Wallet)

| ID | Requirement |
|----|-------------|
| FR-WLT-01 | Ví theo `(OwnerType, OwnerId)`: Customer, Seller, Shipper, Platform |
| FR-WLT-02 | Mọi biến động ghi `FINANCIAL_TRANSACTION` |
| FR-WLT-03 | Nạp ví Customer: tối thiểu **10.000₫**, tạo session SePay (OrderId = null) |
| FR-WLT-04 | Rút tiền: chỉ **Seller** và **Shipper**; Customer bị 403 |
| FR-WLT-05 | Rút tối thiểu mặc định **50.000₫** (`MinWithdrawalAmount`) |
| FR-WLT-06 | Request rút → debit ví ngay + `WithdrawalRequest = Pending` |
| FR-WLT-07 | Admin duyệt: Approved; từ chối: hoàn tiền ví (Refund txn) |
| FR-WLT-08 | Ngưỡng rút lớn cấu hình **5.000.000₫** (`LargeWithdrawalThreshold`) — policy/reporting |

---

## 6. Hoa hồng & settle khi giao hàng

> **Chi tiết + ví dụ số (Sàn / Seller / Shipper):** xem **[Revenue_Split_Requirements.md](./Revenue_Split_Requirements.md)**.

| ID | Requirement |
|----|-------------|
| FR-SET-01 | Hoa hồng mặc định **10%** trên `ItemsSubtotal` (= TotalAmount − ShippingFee) |
| FR-SET-02 | SellerPayout = itemsSubtotal − commission (+ shipping nếu self-delivery theo rule split) |
| FR-SET-03 | Shipper earning từ `Order.ShipperIncome` (base + km>5 + peak) — **không** bằng ShippingFee khách trả |
| FR-SET-04 | Settle chỉ chạy 1 lần (`IsFinancialSettled` guard — idempotent); **ví Seller/Shipper chỉ cộng khi giao xong** |
| FR-SET-05 | COD platform delivery: tăng `ShipperProfile.CodCollectedAmount` = SellerPayout + Commission |
| FR-SET-06 | Hạn mức nợ COD mặc định **5.000.000₫**; shipper nộp nợ qua `POST /Payment/shipper/repay-debt` |
| FR-SET-07 | Hủy đơn đã Paid online → hoàn tiền vào ví Customer |
| FR-SET-08 | `RestaurantProfile.CustomCommissionRate` Admin có thể set nhưng **settle hiện chưa áp dụng** (gap) |

---

## 7. SePay tích hợp (Non-functional / Integration)

| ID | Requirement |
|----|-------------|
| NFR-SPY-01 | IPN: header `X-Secret-Key` khớp `IpnSecretKey` (**nếu secret rỗng → verify pass — nguy hiểm production**) |
| NFR-SPY-02 | Webhook: `Authorization: Apikey …` hoặc HMAC-SHA256 `sha256=` với skew ≤ 300s |
| NFR-SPY-03 | Idempotency: `SEPAY_WEBHOOK_LOG.EventKey` unique (`ipn:…`, `wh:…`, `reconcile:…`) |
| NFR-SPY-04 | Queue xử lý in-memory; boot replay webhook chưa processed |
| NFR-SPY-05 | Worker expiry: mỗi **1 phút** |
| NFR-SPY-06 | Worker reconcile: mỗi **2 phút**; cooldown 30s/session; cửa sổ 24h |
| NFR-SPY-07 | Public bypass JWT: `/ipn`, `/webhook`, `/session/status` |
| NFR-SPY-08 | Nội dung chuyển khoản / invoice resolve theo `SepayService` (prefix cấu hình) |

---

## 8. API surface (tóm tắt)

### PaymentController — `api/Payment`

| Method | Route | Actor |
|--------|-------|-------|
| GET | `/methods` | Public |
| GET | `/wallet` | Auth |
| POST | `/wallet/top-up` | Customer |
| POST | `/confirm` | Auth (không dùng cho Sepay) |
| POST | `/withdraw` | Seller/Shipper |
| GET | `/withdrawals` | Auth/Admin |
| POST | `/withdrawals/approve` | Admin |
| GET | `/transactions` | Auth |
| POST | `/invoice` | Auth |
| POST | `/shipper/repay-debt` | Shipper |
| PUT | `/shipper/debt-limit` | Admin |
| GET | `/reconciliation` | Admin |
| GET | `/history` | Auth |
| GET | `/dashboard` | Admin |

### SepayController — `api/Payment/sepay`

| Method | Route | Auth |
|--------|-------|------|
| GET | `/qr/{sessionId}` | Auth |
| GET | `/checkout/{sessionId}` | Auth |
| GET | `/session/status` | Public bypass |
| GET/POST | `/ipn` | Public + secret |
| GET/POST | `/webhook` | Public + API key/HMAC |
| POST | `/reconcile` | Auth |
| GET | `/webhook/diagnostics` | Admin/RBAC |

---

## 9. State machines

### PaymentSessionStatus

```text
Pending ──confirm/webhook/reconcile──► Completed
Pending ──ExpiryWorker────────────────► Expired
Expired ──reconcile late (allowExpired)─► Completed (trường hợp đặc biệt)
```

### Order.PaymentStatus

```text
Pending ──SystemWallet / SePay confirm / Card confirm──► Paid
Pending (COD) ──deliver settle─────────────────────────► Settled
Paid ──deliver settle──────────────────────────────────► Settled
Paid ──cancel refund───────────────────────────────────► Refunded
```

### WithdrawalStatus

```text
Pending ──Admin approve──► Approved / Completed
Pending ──Admin reject───► Rejected (+ hoàn ví)
```

---

## 10. Acceptance Criteria (QA)

### Checkout COD
- [ ] Guest checkout COD thành công, không QR
- [ ] Sau giao hàng: Order Settled, shipper COD debt tăng (platform delivery)

### Checkout SystemWallet
- [ ] Thiếu tiền → lỗi rõ
- [ ] Đủ tiền → Paid ngay, số dư giảm đúng `TotalAmount`

### Checkout SePay
- [ ] Có QR, expiry ~10 phút
- [ ] Webhook/IPN đúng số tiền → Paid
- [ ] Sai số tiền (>1₫) → không confirm
- [ ] Gọi `/confirm` với Sepay → bị từ chối
- [ ] Hết hạn hiển thị expired; reconcile vẫn có thể cứu trong 24h

### Top-up / Withdraw
- [ ] Top-up < 10.000 → lỗi
- [ ] Withdraw < 50.000 → lỗi; Customer không rút được
- [ ] Reject withdraw → hoàn ví

### Bảo mật
- [ ] Production: IPN/Webhook secret **không** để trống
- [ ] EventKey trùng không double-credit

---

## 11. Ràng buộc & nợ kỹ thuật (ghi rõ cho team)

1. CreditCard/EWallet là **stub** — không dùng production như cổng thật.
2. Payment queue **in-memory** — restart phụ thuộc replay webhook log.
3. IPN/Webhook verify “pass if secret empty” — **bắt buộc** set secret trên môi trường thật.
4. `Order` ↔ `PaymentSession` chưa chắc có FK vật lý — truy vấn theo Id logic.
5. Hoa hồng / debt limit đọc từ `PLATFORM_FINANCE_CONFIG` (Admin có thể đổi).

---

## 12. File neo (implementation)

| Vai trò | File |
|---------|------|
| Methods | `Application/Features/Payments/Queries/GetPaymentMethodsHandler.cs` |
| Checkout settle | `Application/Services/PaymentSettlementService.cs` |
| Orchestration | `Application/Services/PaymentOrchestrationService.cs` |
| SePay API client | `Application/Services/SepayService.cs` |
| Options | `Application/Options/SepayOptions.cs` |
| Controllers | `API/Controllers/PaymentController.cs`, `SepayController.cs` |
| Workers | `API/Workers/PaymentProcessingWorker.cs`, `PaymentExpiryWorker.cs`, `SepayReconciliationWorker.cs` |
| Checkout entry | `Application/Features/Orders/Commands/CheckoutHandler.cs` |
| FE | `CheckoutPage.tsx`, `SepayQrPaymentModal.tsx`, `PaymentService.ts`, wallet pages |

---

**Tiếp theo đọc:** [Payment_Checkout_Workflow.md](./Payment_Checkout_Workflow.md) → [Payment_Sepay_Workflow.md](./Payment_Sepay_Workflow.md).
