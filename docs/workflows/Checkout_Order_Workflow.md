# Tài liệu Quy trình: Đặt hàng & Vòng đời đơn (Checkout / Order Lifecycle)

Tài liệu này mô tả chi tiết luồng **đặt hàng** từ trang Checkout đến `CheckoutHandler`, kèm **OTP guest checkout**, và các hành động vòng đời đơn (Seller / Customer).

> **Thanh toán:** Chi tiết COD / Ví / SePay / session / webhook **không lặp lại tại đây**. Đọc:
> - [Payment_Requirements.md](./Payment_Requirements.md) — yêu cầu nghiệp vụ thanh toán
> - [Payment_Checkout_Workflow.md](./Payment_Checkout_Workflow.md) — xử lý thanh toán lúc checkout
> - [Payment_Sepay_Workflow.md](./Payment_Sepay_Workflow.md) — QR / webhook / reconcile (nếu có)

Giao hàng sau `WaitingForShipper`: xem [Shipper_Delivery_Workflow.md](./Shipper_Delivery_Workflow.md) và [Coordinator_Dispatch_Workflow.md](./Coordinator_Dispatch_Workflow.md).

---

## 1. Luồng Tổng Quan (Checkout)

1. **Yêu cầu:** User (đã login hoặc Guest) mở `/checkout` với món trong giỏ cùng một quán.
2. **Nhập thông tin:** Điền địa chỉ giao, liên hệ, chọn phương thức TT, (tuỳ chọn) mã giảm giá / GPS.
3. **Guest OTP (nếu chưa login):** Bấm tiếp → `POST /api/Order/checkout/sent-otp` → nhập OTP (Bước 2 UI).
4. **Gửi checkout:** `POST /api/Order/checkout` với payload giao hàng + `paymentMethod` (+ OTP/guestUserId nếu guest).
5. **Backend:** `OrderController.Checkout` → MediatR `CheckoutHandler`.
6. **Validate:** User/Guest, OTP (guest), giỏ không rỗng, tồn kho, giảm giá, tính phí ship.
7. **Tạo Order:** `Status = Pending`, insert `ORDER` + `ORDER_ITEM`, gọi `PaymentSettlementService.ProcessCheckoutPaymentAsync`.
8. **Xóa giỏ:** Clear cart items, commit transaction; COD → notify Seller.
9. **Response flags:** `requiresSepayRedirect` / `requiresPaymentConfirmation` / thành công ngay (COD, SystemWallet).
10. **FE:** Toast + mở QR SePay / confirm payment / clear cart — theo flags (chi tiết Payment docs).

```mermaid
sequenceDiagram
    actor U as Customer/Guest
    participant FE as CheckoutPage
    participant OS as OrderService
    participant API as OrderController
    participant H as CheckoutHandler
    participant Pay as PaymentSettlementService
    participant DB as SQL Server

    U->>FE: /checkout điền form
    alt Guest
        FE->>OS: sendCheckoutOtp
        OS->>API: POST checkout/sent-otp
        API->>H: SendCheckoutOtpHandler
        H->>DB: OtpRecord + Email
        U->>FE: Nhập OTP
    end
    FE->>OS: checkout(payload)
    OS->>API: POST /api/Order/checkout
    API->>H: CheckoutHandler
    H->>DB: Validate cart/OTP/stock
    H->>DB: Insert Order + Items
    H->>Pay: ProcessCheckoutPaymentAsync
    Pay-->>H: session / Paid / Pending
    H->>DB: Clear cart + Commit
    H-->>FE: OrderId + payment flags
    FE-->>U: Toast / SePay modal / success
```

### OrderStatus (vòng đời)

```text
Pending → Confirmed → Preparing → WaitingForShipper → Shipping → Delivered
                ↘ Cancelled (mọi nhánh hủy hợp lệ)
```

Enum: `src/ShoppingFood.Domain/Enums/Enums.cs` — `OrderStatus` (lines 56–65).

---

## Bước 1: Mở trang Checkout (Frontend)

**Thông tin:**
- **URL (FE):** `/checkout`
- **Page:** `ShoppingFood.FE/src/pages/CheckoutPage.tsx`
- **Guest ID:** `localStorage` key `sf_guest_id` nếu chưa authenticated

**Logic chính (`CheckoutPage.tsx`):**
- Lọc `checkoutItems` theo `restaurantId`
- Form: địa chỉ, tên, SĐT, email, `paymentMethod` (mặc định `COD`)
- `step`: `1` (info) | `2` (OTP guest)
- Load `paymentService.getPaymentMethods()`, phí ship theo GPS / freeship / min order

**Toast validate:**
- `Vui lòng điền đầy đủ thông tin giao hàng`
- `Vui lòng nhập mã OTP`

---

## Bước 2: Gửi OTP checkout (Guest)

**Thông tin:**
- **URL:** `/api/Order/checkout/sent-otp`
- **HTTP Method:** POST
- **Auth:** Public / guest-friendly

### 2.1. Frontend

**File:** `ShoppingFood.FE/src/services/OrderService.ts`

```typescript
public async sendCheckoutOtp(data: ISendCheckoutOtpRequest): Promise<IApiResponse<any>> {
  return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.ORDER.CHECKOUT_SEND_OTP, data);
}
```

**CheckoutPage** (guest path):

```typescript
await orderService.sendCheckoutOtp({ /* contact + guestUserId */ });
toast.success('Mã OTP đã được gửi đến email của bạn');
setStep(2);
```

### 2.2. Controller

**File:** `src/ShoppingFood.API/Controllers/OrderController.cs` — Lines 87–92

```csharp
[HttpPost("checkout/sent-otp")]
public async Task<IActionResult> SendCheckoutOtp([FromBody] SendCheckoutOtpCommand command)
{
    var respone = await _mediator.Send(command);
    return StatusCode(respone.Code, respone);
}
```

### 2.3. Handler

**File:** `src/ShoppingFood.Application/Features/Orders/Commands/SendCheckoutOtpHandler.cs`  
**Class:** `SendCheckoutOtpHandler`  
**Method:** `Handle`

- Khóa theo IP nếu `RetriesCount >= 3` trong 15 phút
- Rate limit guest orders (cùng logic checkout)
- Tạo `OtpRecord` + gửi email qua `IEmailService`

---

## Bước 3: Checkout API

**Thông tin:**
- **URL:** `/api/Order/checkout`
- **HTTP Method:** POST
- **Auth:** JWT **hoặc** Guest (`guestUserId` + OTP)

**Request (chính)** — `CheckoutCommand`:

```csharp
// src/.../Orders/Commands/CheckoutCommand.cs
public string DeliveryAddress { get; set; }
public string ContactName { get; set; }
public string ContactPhone { get; set; }
public string ContactEmail { get; set; }
public string OtpCode { get; set; }
public string? DiscountCode { get; set; }
public PaymentMethod PaymentMethod { get; set; } = PaymentMethod.COD;
public Guid? GuestUserId { get; set; }
public double? DeliveryLatitude { get; set; }
public double? DeliveryLongitude { get; set; }
```

### 3.1. Frontend gọi API

**File:** `OrderService.ts`

```typescript
public async checkout(data: ICheckoutRequest): Promise<IApiResponse<any>> {
  return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.ORDER.CHECKOUT, data);
}
```

**CheckoutPage** — sau response:

```typescript
const requiresSepay = res.data?.requiresSepayRedirect === true;
if (requiresSepay && sessionId) {
  toast.success('Đơn hàng đã tạo. Quét mã QR bên dưới để thanh toán.');
  // mở SepayQrPaymentModal — xem Payment_Checkout_Workflow / Payment_Sepay_Workflow
} else {
  toast.success(`Đặt hàng thành công! Mã đơn hàng của bạn là: ...`);
}
```

### 3.2. Controller

**File:** `OrderController.cs` — Lines 79–85

```csharp
[HttpPost("checkout")]
public async Task<IActionResult> Checkout([FromBody] CheckoutCommand command)
{
    var response = await _mediator.Send(command);
    return StatusCode(response.Code, response);
}
```

### 3.3. Handler — lõi nghiệp vụ

**File:** `src/ShoppingFood.Application/Features/Orders/Commands/CheckoutHandler.cs`  
**Class:** `CheckoutHandler`  
**Method:** `Handle` (từ line ~81)

**Tóm tắt xử lý:**

| # | Việc | Ghi chú |
|---|------|---------|
| 1 | Bắt buộc `CurrentUserId` **hoặc** `GuestUserId` | 401 nếu thiếu |
| 2 | Guest: lock OTP / max **3 đơn/24h** theo IP | 403 / 429 |
| 3 | Guest: validate OTP email, max 3 retries | Đánh `IsUsed` khi đúng |
| 4 | Load cart + sync flash sale price | Giỏ rỗng → 400 |
| 5 | Validate stock | Out of stock → 400 |
| 6 | Tính total + shipping + shipper income | Theo lat/lng |
| 7 | Apply voucher + member tier discount | Tier bỏ qua nếu có flash sale item |
| 8 | `CreateOrderEntity` → `Status = Pending` | + OrderItems |
| 9 | `ProcessCheckoutPaymentAsync` | **→ Payment docs** |
| 10 | Clear cart, commit; COD notify seller | Notification |

**Đoạn payment + response flags** (lines ~183–232):

```csharp
var paymentError = await _paymentSettlementService.ProcessCheckoutPaymentAsync(
    order, request.CurrentUserId, request.CardLastFour, request.CardBrand, request.EWalletProvider);
if (paymentError != null)
{
    await transaction.RollbackAsync(cancellationToken);
    return ApiResponse.Failure(400, paymentError);
}
// ... clear cart, commit, COD notification ...

var responseData = new
{
    OrderId = order.Id,
    totalAmount = order.TotalAmount,
    paymentSessionId = order.PaymentSessionId,
    requiresPaymentConfirmation = order.PaymentSessionId.HasValue
        && order.PaymentMethod != PaymentMethod.Sepay,
    requiresSepayRedirect = order.PaymentMethod == PaymentMethod.Sepay
        && order.PaymentSessionId.HasValue
};
return ApiResponse.Success(responseData, "Checkout successful.");
```

### 3.4. Database lúc checkout

| Bảng | Việc |
|------|------|
| `CART` / `CART_ITEM` | Đọc + xóa items |
| `ORDER` / `ORDER_ITEM` | Insert |
| `OTP_RECORD` | Guest: đánh dấu dùng |
| `GUEST_USER` | Cập nhật contact |
| `DISCOUNT` / `CUSTOMER_DISCOUNT` | Apply usage |
| `PAYMENT_SESSION` / `WALLET` / … | Theo payment method — xem Payment docs |
| `NOTIFICATION` | COD → Seller |

---

## Bước 4: Nhánh thanh toán (tóm tắt + link)

| Method | Sau checkout | Đọc tiếp |
|--------|--------------|----------|
| **COD** | `PaymentStatus=Pending`, toast thành công | [Payment_Requirements.md](./Payment_Requirements.md) § COD settle khi giao |
| **SystemWallet** | Trừ ví ngay → `Paid` | Payment_Checkout_Workflow |
| **Sepay** | Tạo session 10 phút → QR modal | Payment_Sepay_Workflow |
| **CreditCard / EWallet** | Session stub → FE `POST /Payment/confirm` | Payment_Checkout_Workflow (fallback) |

---

## Phụ lục A — Vòng đời đơn (Seller / Customer)

### A.1. Seller Accept

| Mục | Chi tiết |
|-----|----------|
| **API** | `POST /api/Order/accept` |
| **Controller** | `OrderController.AcceptOrder` (L126–135) |
| **Handler** | `AcceptOrderHandler.cs` |
| **Rule** | Chỉ `Pending` → `Confirmed`; verify ownership quán |
| **FE** | `SellerOrdersPage.tsx` → `orderService.acceptOrder` |
| **Noti** | Customer: *"Đơn hàng đã được xác nhận"* |

```csharp
if(order.Status != OrderStatus.Pending) return ApiResponse.Failure(400, "Only pending orders can be accepted.");
order.Status = OrderStatus.Confirmed;
```

### A.2. Seller Reject

| Mục | Chi tiết |
|-----|----------|
| **API** | `POST /api/Order/reject` |
| **Handler** | `RejectOrderHandler.cs` |
| **FE** | Prompt lý do → `orderService.rejectOrder` |
| **Kết quả** | Thường → `Cancelled` + refund nếu đã Paid (Payment) |

### A.3. Seller Prepare

| Mục | Chi tiết |
|-----|----------|
| **API** | `POST /api/Order/prepare` |
| **Handler** | `PrepareOrderHandler.cs` |
| **Rule** | `Confirmed` → `Preparing` |

### A.4. Waiting for Shipper (hoặc Self-delivery)

| Mục | Chi tiết |
|-----|----------|
| **API** | `POST /api/Order/waiting-for-shipper` |
| **Handler** | `WaitingShipperOrderHandler.cs` |
| **Rule** | Từ `Preparing`: Platform delivery → `WaitingForShipper`; Self-delivery có thể gán thẳng `Shipping` |

### A.5. Customer Cancel

| Mục | Chi tiết |
|-----|----------|
| **API** | `PUT /api/Order/cancel` |
| **Handler** | `CancelOrderHandler.cs` |
| **FE** | `CustomerOrderDetailModal` + `ConfirmModal` |
| **Rule** | Thường chỉ hủy khi còn `Pending` (sau Confirm bị hạn chế — xem message noti accept) |

### A.6. Seller Cancel

| Mục | Chi tiết |
|-----|----------|
| **API** | `POST /api/Order/seller-cancel` |
| **Handler** | `SellerCancelOrderHandler.cs` |
| **FE** | `SellerOrdersPage` |

### A.7. Reorder

| Mục | Chi tiết |
|-----|----------|
| **API** | `POST /api/Order/reorder` |
| **Handler** | `ReorderHandler` / `ReorderCommand` |
| **FE** | Order history → thêm lại món vào cart |

### A.8. Self-delivery confirm success

| Mục | Chi tiết |
|-----|----------|
| **API** | `POST /api/Order/{id}/self-delivery/confirm-success` |
| **Handler** | `ConfirmSelfDeliverySuccessHandler.cs` |
| **FE** | `orderService.confirmSelfDelivery(orderId)` |
| **Finance** | `SettleSelfDeliveryOrderAsync` — xem Payment_Requirements |

### A.9. Query đơn

| API | Mục đích | FE |
|-----|----------|-----|
| `GET /api/Order/MyOrders` | Đơn user | Profile / order list |
| `GET /api/Order/GuestOrders/{guestUserId}` | Đơn guest | Guest history |
| `GET /api/Order/details/{idOrCode}` | Chi tiết | Modal detail |
| `GET /api/Order/RestaurantOrders` | Đơn quán | SellerOrdersPage |
| `GET /api/Order/recent-items` | Món gần đây | Home / Profile |

---

## Sơ đồ file đi qua (Checkout call chain)

```text
CheckoutPage.tsx
  ↓
OrderService.ts  (sendCheckoutOtp / checkout)
  ↓
HttpClient.ts
  ↓
OrderController.cs  (checkout / checkout/sent-otp)
  ↓
SendCheckoutOtpHandler.cs  |  CheckoutHandler.cs
  ↓
PaymentSettlementService.ProcessCheckoutPaymentAsync  →  [Payment_* docs]
  ↓
ShoppingFoodContext → ORDER, ORDER_ITEM, CART_ITEM, OTP_RECORD, NOTIFICATION, …
```

| Vai trò | Đường dẫn |
|---------|-----------|
| FE Page | `ShoppingFood.FE/src/pages/CheckoutPage.tsx` |
| FE Service | `ShoppingFood.FE/src/services/OrderService.ts` |
| Controller | `src/ShoppingFood.API/Controllers/OrderController.cs` |
| Checkout | `.../Features/Orders/Commands/CheckoutHandler.cs` |
| OTP Guest | `.../Features/Orders/Commands/SendCheckoutOtpHandler.cs` |
| Command | `.../CheckoutCommand.cs` |
| Payment | `.../Services/PaymentSettlementService.cs` |
| Seller UI | `ShoppingFood.FE/src/pages/seller/SellerOrdersPage.tsx` |

---

## Các thông báo (Toast / Message)

| Message | Nơi | Trigger |
|---------|-----|---------|
| Mã OTP đã được gửi đến email của bạn | CheckoutPage | sendCheckoutOtp OK |
| Đơn hàng đã tạo. Quét mã QR… | CheckoutPage | Sepay redirect |
| Đặt hàng thành công! Mã đơn… | CheckoutPage | COD/Wallet/after confirm |
| Lỗi khi đặt hàng / Invalid OTP… | CheckoutPage | API error |
| Áp dụng mã giảm giá thành công | CheckoutPage | apply discount |
| (Seller) toast nhận/từ chối/chuẩn bị | SellerOrdersPage | lifecycle APIs |

---

## Các cơ chế bảo mật / ràng buộc quan trọng

1. **Guest OTP bắt buộc** trước khi tạo đơn; OTP one-time; max **3 retries** → lock 15 phút theo IP.
2. **Rate limit guest:** tối đa **3 đơn / 24 giờ / IP**.
3. **Giỏ phải cùng quán** (FE filter `restaurantId`); stock check trước khi tạo order.
4. **Transaction DB** bọc checkout; payment fail → rollback.
5. **Seller ownership** verify trên mọi action accept/reject/prepare…
6. **Payment online** yêu cầu login (Guest thực tế chỉ COD) — chi tiết Payment_Requirements.
7. Sau **Confirmed**, customer bị hạn chế tự hủy (noti hướng dẫn chat seller).

---

## Checklist tự test (Screen Run)

- [ ] Login Customer: thêm giỏ → `/checkout` → COD → đơn `Pending`, seller nhận noti
- [ ] Guest: OTP email → checkout COD thành công; sai OTP 3 lần → bị khóa
- [ ] Guest quá 3 đơn/ngày → 429
- [ ] SystemWallet đủ/thiếu số dư
- [ ] Sepay: flags `requiresSepayRedirect` + modal QR (theo Payment docs)
- [ ] Seller: Accept → Prepare → WaitingForShipper
- [ ] Customer cancel khi Pending; seller-cancel; reorder
- [ ] Self-delivery confirm-success

---

## Tóm tắt

Checkout tạo đơn `Pending` qua `CheckoutHandler`, gắn payment qua `PaymentSettlementService`, rồi Seller đẩy trạng thái tới `WaitingForShipper` / self-delivery. **Chi tiết tiền** → bộ tài liệu Payment; **giao hàng** → Shipper / Coordinator workflows.

> [INDEX](../ONBOARDING_INDEX.md) · [Payment_Requirements](./Payment_Requirements.md) · [Shipper_Delivery](./Shipper_Delivery_Workflow.md) · [Coordinator_Dispatch](./Coordinator_Dispatch_Workflow.md)
