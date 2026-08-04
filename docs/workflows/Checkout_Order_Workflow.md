# Tài liệu Quy trình: Đặt hàng & Vòng đời đơn (Checkout / Order Lifecycle)

Tài liệu này mô tả chi tiết luồng **đặt hàng** từ trang Checkout đến `CheckoutHandler`, kèm **OTP guest checkout**, và các hành động vòng đời đơn (Seller / Customer).

> **Thanh toán:** Chi tiết COD / Ví / SePay / session / webhook **không lặp lại tại đây**. Đọc:
> - [Payment_Requirements.md](./Payment_Requirements.md) — yêu cầu nghiệp vụ thanh toán
> - [Payment_Checkout_Workflow.md](./Payment_Checkout_Workflow.md) — xử lý thanh toán lúc checkout
> - [Payment_Sepay_Workflow.md](./Payment_Sepay_Workflow.md) — QR / webhook / reconcile (nếu có)

Giao hàng sau `WaitingForShipper`: xem [Shipper_Delivery_Workflow.md](./Shipper_Delivery_Workflow.md) và [Coordinator_Dispatch_Workflow.md](./Coordinator_Dispatch_Workflow.md).

---


---

## Phần A — UI Interaction Trace (Nút bấm → Code → Data → Hiển thị)

> UI Trace — Checkout & Order  
> Mỗi thao tác trả lời: **nút ở đâu** · **bấm chạy file/hàm nào** · **API/BE đâu** · **data trả về** · **hiển thị thế nào**.


---

## UT-ORD-01 — Load trang Checkout

#### 1. Giao diện nút bấm ở đâu?

| Mục | Giá trị |
|-----|---------|
| **Route** | `/checkout?restaurantId={id}` |
| **Page** | `pages/CheckoutPage.tsx` |
| **Component** | Page mount (`useEffect`) — không phải nút, là entry |
| **Nhãn** | — |
| **Điều kiện** | Có `items` từ `useCart()`; nếu trống → toast + về home |

#### 2. Bấm xong chạy đến đâu? (Frontend)

```text
CheckoutPage mount
  → useCart(): items, clearCart
  → useAuth(): isAuthenticated, user
  → useEffect: nếu items.length===0 → toast('Giỏ hàng trống...') → navigate HOME
  → Lọc items theo restaurantId query
  → paymentService.getPaymentMethods() → setPaymentMethods
  → (auth) paymentService.getWallet() → setWalletBalance
  → (auth) userAddressService.list → setSavedAddresses
```

#### 3. Backend chạy đoạn nào?

```text
GET /api/Payment/methods → GetPaymentMethodsHandler
GET /api/Payment/wallet → wallet handler
GET /api/UserAddress → address query
```

#### 4. Dữ liệu trả về ở đâu?

| API | `data` dùng để |
|-----|----------------|
| methods | Render radio COD / SystemWallet / Sepay / … |
| wallet | Text "Số dư ví: …" khi chọn SystemWallet |
| addresses | `<select>` địa chỉ đã lưu |

#### 5. Làm sao hiển thị ra?

Form step 1: thông tin giao hàng + map + payment methods + summary tổng tiền (`finalTotal` useMemo).

#### 6. Sơ đồ nhanh

```mermaid
sequenceDiagram
    participant Page as CheckoutPage
    participant Pay as GET /Payment/methods
    participant Cart as CartContext items
    Page->>Cart: đọc items
    Page->>Pay: getPaymentMethods
    Pay-->>Page: setPaymentMethods → radio UI
```

---

## UT-ORD-02 — Nút "Áp dụng" mã giảm giá

#### 1. Giao diện nút bấm ở đâu?

| Mục | Giá trị |
|-----|---------|
| **Route** | `/checkout` |
| **Page** | `CheckoutPage.tsx` |
| **Nhãn nút** | `"Áp dụng"` trong modal mã giảm giá (~807) |
| **Loại control** | `<Button onClick={handleApplyCode}>` |
| **Điều kiện** | Modal mở; có `formData.discountCode` |

#### 2. Bấm xong chạy đến đâu? (Frontend)

```text
handleApplyCode (L262–285)
  → discountService.applyDiscount({ code, restaurantId, cartAmount: checkoutTotal })
  → httpClient.post('/Discount/apply', ...)
```

#### 3. Backend chạy đoạn nào?

```text
POST /api/Discount/apply
  → DiscountController → ApplyDiscountHandler
  → Check active/expiry/usage/min order
```

#### 4. Dữ liệu trả về ở đâu?

```json
{
  "error": false,
  "data": {
    "discountId": "...",
    "code": "SALE10",
    "discountAmount": 10000
  }
}
```

#### 5. Làm sao hiển thị ra?

| Nhánh | Hành vi UI |
|-------|------------|
| OK | `toast.success('Áp dụng mã giảm giá thành công')`; `setSelectedDiscount(...)`; đóng modal; `finalTotal` giảm |
| Fail | `toast.error(res.message \|\| 'Mã giảm giá không hợp lệ')` |
| Gỡ mã | Nút gỡ → `toast.success('Đã gỡ mã giảm giá')`; clear selectedDiscount |

#### 6. Sơ đồ nhanh

```mermaid
sequenceDiagram
    participant Btn as "Áp dụng"
    participant API as POST /Discount/apply
    participant UI as finalTotal + toast
    Btn->>API: applyDiscount
    API-->>UI: setSelectedDiscount
```

---

## UT-ORD-03 — Nút "Vị trí hiện tại" (GPS)

#### 1. Giao diện nút bấm ở đâu?

| Mục | Giá trị |
|-----|---------|
| **Page** | `CheckoutPage.tsx` map panel (~515–517) |
| **Nhãn nút** | `"Vị trí hiện tại"` + icon MapPin |
| **Loại control** | `<Button type="button" onClick={handleGetLocation}>` |

#### 2. Bấm xong chạy đến đâu? (Frontend)

```text
handleGetLocation (~330–351)
  → navigator.geolocation.getCurrentPosition
  → setFormData({ deliveryLatitude, deliveryLongitude })
  → fetchAddressFromCoordinates (Nominatim OpenStreetMap — không qua ShoppingFood API)
  → toast.success('Đã lấy vị trí hiện tại')
```

#### 3. Backend chạy đoạn nào?

Không gọi API Shopping Food. Gọi ngoài: `nominatim.openstreetmap.org/reverse`.

#### 4. Dữ liệu trả về ở đâu?

Nominatim `display_name` → ghi vào `formData.deliveryAddress`.

#### 5. Làm sao hiển thị ra?

| Nhánh | Hành vi UI |
|-------|------------|
| OK | Marker map cập nhật; ô địa chỉ fill; toast success |
| Deny GPS | `toast.error('Không thể lấy vị trí...')` |
| No API | `toast.error('Trình duyệt... không hỗ trợ định vị.')` |

#### 6. Sơ đồ nhanh

```mermaid
sequenceDiagram
    participant Btn as "Vị trí hiện tại"
    participant Geo as browser geolocation
    participant OSM as Nominatim
    Btn->>Geo: getCurrentPosition
    Geo->>OSM: reverse geocode
    OSM-->>Btn: setFormData address + lat/lng
```

---

## UT-ORD-04 — "Tiếp tục" / "Đặt hàng ngay" (step 1)

#### 1. Giao diện nút bấm ở đâu?

| Mục | Giá trị |
|-----|---------|
| **Page** | `CheckoutPage.tsx` ~630–634 |
| **Nhãn nút** | Guest: `"Tiếp tục"` · Auth: `"Đặt hàng ngay"` |
| **Loại control** | `onClick={handleNextStep}` |
| **Điều kiện** | `step === 1` |

#### 2. Bấm xong chạy đến đâu? (Frontend)

```text
handleNextStep (L233–260)
  → Validate contactName/phone/deliveryAddress/contactEmail
       fail → toast.error('Vui lòng điền đầy đủ thông tin giao hàng')
  → Guest:
       orderService.sendCheckoutOtp({ fullName, phone, email, deliveryAddress, guestUserId })
       → POST /Order/checkout/sent-otp
       toast.success OTP gửi email → setStep(2)
  → Auth:
       handleCheckout()  // UT-ORD-06
```

#### 3. Backend chạy đoạn nào? (Guest)

```text
POST /api/Order/checkout/sent-otp
  → OrderController.SendCheckoutOtp
  → SendCheckoutOtpCommand handler
  → Tạo/gửi OTP email (OtpRecord)
```

#### 4. Dữ liệu trả về ở đâu?

Success message OTP đã gửi; error trong `error.response.data.message`.

#### 5. Làm sao hiển thị ra?

| Nhánh | Hành vi UI |
|-------|------------|
| Guest OK | `setStep(2)` hiện ô OTP + nút "Xác nhận Đặt hàng" |
| Auth | Nhảy thẳng checkout |
| Validate | Toast đỏ, ở step 1 |

#### 6. Sơ đồ nhanh

```mermaid
sequenceDiagram
    participant Btn as Tiếp tục / Đặt hàng ngay
    participant FE as handleNextStep
    participant OTP as POST checkout/sent-otp
    Btn->>FE: click
    alt Guest
      FE->>OTP: sendCheckoutOtp
      OTP-->>FE: setStep(2)
    else Auth
      FE->>FE: handleCheckout
    end
```

---

## UT-ORD-05 — Guest: "Xác nhận Đặt hàng" (nhập OTP step 2)

#### 1. Giao diện nút bấm ở đâu?

| Mục | Giá trị |
|-----|---------|
| **Nhãn nút** | `"Xác nhận Đặt hàng"` (~670–674) |
| **Điều kiện** | `step === 2` (guest) |
| **Input kèm** | `otpCode` state |

#### 2. Bấm xong chạy đến đâu? (Frontend)

```text
onClick={handleCheckout}
  → if !isAuthenticated && !otpCode → toast.error('Vui lòng nhập mã OTP')
  → tiếp UT-ORD-06
```

#### 3–6. Xem UT-ORD-06

---

## UT-ORD-06 — Đặt hàng (checkout API) — nhánh COD / Wallet / SePay / stub

#### 1. Giao diện nút bấm ở đâu?

| Mục | Giá trị |
|-----|---------|
| **Nhãn** | Auth step1: `"Đặt hàng ngay"` · Guest step2: `"Xác nhận Đặt hàng"` |
| **Hàm** | `handleCheckout` (CheckoutPage L365–417) |

#### 2. Bấm xong chạy đến đâu? (Frontend)

```text
handleCheckout
  → setIsSubmitting(true)
  → orderService.checkout(checkoutPayload)
       payload: formData + otpCode + guestUserId + discountCode + paymentMethod + card/eWallet fields
  → POST /api/Order/checkout
  → Đọc res.data:
       orderId, paymentSessionId
       requiresSepayRedirect, requiresPaymentConfirmation
```

#### 3. Backend chạy đoạn nào?

```text
POST /api/Order/checkout
  → OrderController.Checkout (L79–85)
  → CheckoutHandler
       CalculateTotalAmountAsync (ship + shipper income)
       Tạo Order + OrderItems
       PaymentSettlementService.ProcessCheckoutPaymentAsync
       Clear cart phía BE (theo handler)
  → Response flags requiresSepayRedirect / requiresPaymentConfirmation
```

#### 4. Dữ liệu trả về ở đâu?

```json
{
  "error": false,
  "data": {
    "orderId": "guid",
    "paymentSessionId": "guid|null",
    "requiresSepayRedirect": true,
    "requiresPaymentConfirmation": false,
    "totalAmount": 115000,
    "shippingFee": 15000
  }
}
```

(Tên field có thể PascalCase — FE đọc cả hai.)

#### 5. Làm sao hiển thị ra?

| Nhánh | Hành vi UI |
|-------|------------|
| **SePay** | `setSepaySessionId` + `setIsSepayModalOpen(true)`; toast `"Đơn hàng đã tạo. Quét mã QR..."`; **chưa** clearCart / navigate (đợi paid) |
| **requiresConfirm** (Card/EWallet stub) | `paymentService.confirmPayment(sessionId)` rồi clearCart + toast success + navigate `/?track=true&orderId=` |
| **COD / SystemWallet** | `clearCart()`; toast mã đơn; `navigate(HOME?track=true&orderId=)` |
| **onPaid SePay modal** | `clearCart()`; đóng modal; navigate track (xem CheckoutPage ~861–870) |
| Error | `toast.error(error.response?.data?.message \|\| 'Lỗi khi đặt hàng')` |

#### 6. Sơ đồ nhanh

```mermaid
sequenceDiagram
    participant Btn as Đặt hàng
    participant FE as handleCheckout
    participant API as POST /Order/checkout
    participant QR as SepayQrPaymentModal
    participant Home as /?track=true

    Btn->>FE: click
    FE->>API: checkout
    alt SePay
      API-->>FE: requiresSepayRedirect + sessionId
      FE->>QR: open modal
    else COD/Wallet/Confirm
      API-->>FE: orderId
      FE->>Home: clearCart + toast + navigate
    end
```

---

## UT-ORD-07 — Customer: Hủy đơn (ConfirmModal)

#### 1. Giao diện nút bấm ở đâu?

| Mục | Giá trị |
|-----|---------|
| **Component** | `components/order/CustomerOrderDetailModal.tsx` |
| **Mở modal từ** | `ShoppingDrawer` tab Đơn hàng → click đơn → `detailModal` |
| **Nhãn** | Nút hủy → mở `ConfirmModal` (`cancelConfirmModal`) |
| **Confirm title** | Hủy đơn hàng (ConfirmModal common) |

#### 2. Bấm xong chạy đến đâu? (Frontend)

```text
confirmCancelOrder (L81–91)
  → orderService.cancelOrder({ orderId })
  → PUT /api/Order/cancel
  → toast.success('Hủy đơn hàng thành công')
  → setCancelConfirmModal(false)
  → loadOrderDetails()  // GET details/{id}
```

#### 3. Backend chạy đoạn nào?

```text
PUT /api/Order/cancel
  → OrderController → CancelOrderHandler
  → (Refund ví nếu đã Paid online)
```

#### 4. Dữ liệu trả về ở đâu?

ApiResponse success/error message.

#### 5. Làm sao hiển thị ra?

| Nhánh | Hành vi UI |
|-------|------------|
| OK | Toast; `setOrderData` status mới (Cancelled); badge màu đổi |
| Fail | `toast.error(msg)` |
| Realtime | SignalR notification `targetId===orderId` → `loadOrderDetails` lại |

#### 6. Sơ đồ nhanh

```mermaid
sequenceDiagram
    participant C as Confirm hủy
    participant API as PUT /Order/cancel
    participant UI as orderData status
    C->>API: cancelOrder
    API-->>UI: reload details + toast
```

---

## UT-ORD-08 — Customer: Đặt lại (Reorder)

#### 1. Giao diện nút bấm ở đâu?

| Mục | Giá trị |
|-----|---------|
| **Component** | `CustomerOrderDetailModal.tsx` |
| **Nhãn** | Nút đặt lại / reorder (gọi `handleReorder`) |
| **Icon** | `RefreshCw` trong imports |

#### 2. Bấm xong chạy đến đâu? (Frontend)

```text
handleReorder (L93–104)
  → orderService.reorder({ orderId })
  → POST /api/Order/reorder
  → refreshCart()  // CartContext.fetchCart → GET /Cart
  → window.dispatchEvent('openCartTab')
  → toast.success('Đã thêm lại các món vào giỏ hàng')
  → onClose()
```

#### 3. Backend chạy đoạn nào?

```text
POST /api/Order/reorder → ReorderHandler
  (fail nếu không còn món available)
```

#### 4. Dữ liệu trả về ở đâu?

Success hoặc `"None of the items... available for reorder"`.

#### 5. Làm sao hiển thị ra?

| Nhánh | Hành vi UI |
|-------|------------|
| OK | Modal đóng; Drawer mở tab giỏ (`openCartTab` listener trong ShoppingDrawer L112–114); items mới trong Context |
| Fail | toast.error |

#### 6. Sơ đồ nhanh

```mermaid
sequenceDiagram
    participant Btn as Reorder
    participant API as POST /reorder
    participant Cart as refreshCart
    participant Dr as openCartTab
    Btn->>API: reorder
    API->>Cart: GET /Cart
    Cart->>Dr: event openCartTab
```

---

## UT-ORD-09 — Seller: Chấp nhận đơn

#### 1. Giao diện nút bấm ở đâu?

| Mục | Giá trị |
|-----|---------|
| **Route** | `/seller/orders` |
| **Page** | `pages/seller/SellerOrdersPage.tsx` |
| **Nhãn** | Nút chấp nhận (gọi `handleAccept(orderId)`) — status Pending |
| **Loading toast** | `'Đang chấp nhận đơn hàng...'` |

#### 2. Bấm xong chạy đến đâu? (Frontend)

```text
handleAccept (L145–161)
  → orderService.acceptOrder({ orderId })
  → POST /api/Order/accept
  → toast.success('Đã chấp nhận đơn hàng!')
  → fetchOrders()  // GET RestaurantOrders
  → setSelectedOrder status 'Confirmed' nếu đang mở
```

#### 3. Backend chạy đoạn nào?

```text
POST /api/Order/accept → AcceptOrderHandler
  Pending → Confirmed (chỉ owner restaurant)
```

#### 4. Dữ liệu trả về ở đâu?

ApiResponse; list orders refresh.

#### 5. Làm sao hiển thị ra?

Badge status → `"Đã xác nhận"` (blue); list re-fetch; toast thay loading.

#### 6. Sơ đồ nhanh

```mermaid
sequenceDiagram
    participant Btn as Accept
    participant API as POST /Order/accept
    participant List as fetchOrders
    Btn->>API: acceptOrder
    API-->>List: re-render badges
```

---

## UT-ORD-10 — Seller: Chuẩn bị (Prepare)

#### 1. Giao diện

`SellerOrdersPage` — khi status Confirmed → `handlePrepare`.

#### 2. Frontend

```text
handlePrepare → orderService.prepareOrder → POST /Order/prepare
toast: 'Đang thực hiện nấu món!'
setSelectedOrder status Preparing
```

#### 3. Backend

`PrepareOrderHandler` — Confirmed → Preparing.

#### 4–5. Response + UI

Badge `"Đang chuẩn bị"` (yellow); `fetchOrders()`.

#### 6. Mermaid

```mermaid
sequenceDiagram
    participant Btn as Prepare
    participant API as POST /prepare
    Btn->>API: prepareOrder
    API-->>Btn: toast + status Preparing
```

---

## UT-ORD-11 — Seller: Chờ tài xế (WaitingForShipper)

#### 1. Giao diện

Nút chờ shipper khi Preparing (platform delivery).

#### 2. Frontend

```text
handleWaitingForShipper → POST /Order/waiting-for-shipper
toast: 'Chuẩn bị xong! Đang chờ tài xế đến lấy...'
status → WaitingForShipper
```

#### 3. Backend

Handler chuyển WaitingForShipper — sẵn sàng dispatch.

#### 4–5. UI

Badge purple `"Chờ tài xế"`; coordinator board có thể thấy đơn.

#### 6. Mermaid

```mermaid
sequenceDiagram
    participant Btn as Waiting
    participant API as POST /waiting-for-shipper
    Btn->>API: waitingForShipper
```

---

## UT-ORD-12 — Seller: Từ chối đơn (PromptModal lý do)

#### 1. Giao diện nút bấm ở đâu?

| Mục | Giá trị |
|-----|---------|
| **Page** | `SellerOrdersPage.tsx` |
| **Modal** | Reject modal / Prompt — state `isRejectModalOpen`, `rejectReason` |
| **Confirm action** | `handleReject` |

#### 2. Bấm xong chạy đến đâu? (Frontend)

```text
handleReject (L199–222)
  → if !rejectReason.trim() → toast.error('Vui lòng nhập lý do từ chối')
  → orderService.rejectOrder({ orderId, rejectReason })
  → POST /api/Order/reject
  → đóng modal, clear selectedOrder, fetchOrders
  → toast.success('Đã từ chối đơn hàng thành công')
```

#### 3. Backend

`RejectOrderHandler` — chỉ Pending; ghi lý do.

#### 4–5. Response + UI

Đơn biến mất khỏi Pending list / status Cancelled-Rejected; toast.

#### 6. Mermaid

```mermaid
sequenceDiagram
    participant M as Reject modal
    participant API as POST /reject
    M->>API: rejectOrder + reason
    API-->>M: close + refresh list
```

---

## UT-ORD-13 — Seller: Hủy đơn (PromptModal)

#### 1. Giao diện

`handleSellerCancelClick` → `PromptModal` (`isCancelModalOpen`) nhập lý do → `handleSellerCancelConfirm(reason)`.

#### 2. Frontend

```text
orderService.sellerCancelOrder({ orderId, reason })
→ POST /api/Order/seller-cancel
toast success 'Đã hủy đơn hàng thành công'
```

#### 3. Backend

Seller-cancel handler + refund rules nếu cần.

#### 4–5. UI

List refresh; selectedOrder null.

#### 6. Mermaid

```mermaid
sequenceDiagram
    participant P as PromptModal
    participant API as POST /seller-cancel
    P->>API: sellerCancelOrder
```

---

## UT-ORD-14 — Seller: Xác nhận tự giao thành công

#### 1. Giao diện

Khi đơn self-delivery ở trạng thái phù hợp — `handleConfirmSelfDelivery(orderId)`.

#### 2. Frontend

```text
orderService.confirmSelfDelivery(orderId)
→ POST /api/Order/{id}/self-delivery/confirm-success
toast: 'Xác nhận giao hàng thành công!'
status → Delivered
```

#### 3. Backend

```text
→ SettleSelfDeliveryOrderAsync (chia tiền Seller + Commission)
```

#### 4–5. UI

Badge Delivered; ví seller cập nhật (không hiện ngay trên page orders — xem wallet).

#### 6. Mermaid

```mermaid
sequenceDiagram
    participant Btn as Self-delivery confirm
    participant API as POST self-delivery/confirm-success
    participant Pay as PaymentSettlementService
    Btn->>API: confirmSelfDelivery
    API->>Pay: SettleSelfDeliveryOrderAsync
```

---

## Tóm tắt Order UI files

| File | Vai trò |
|------|---------|
| `CheckoutPage.tsx` | UT-ORD-01…06 |
| `CustomerOrderDetailModal.tsx` | UT-ORD-07…08 |
| `SellerOrdersPage.tsx` | UT-ORD-09…14 |
| `OrderService.ts` | HTTP wrapper |
| `OrderController.cs` + `Features/Orders/**` | BE |
| `ShoppingDrawer.tsx` | Mở detail / track tab |

**Payment chi tiết sau checkout SePay:** [06_Payment_UI_Trace.md](./06_Payment_UI_Trace.md).


---

## Phần B — Workflow nghiệp vụ & Backend (chi tiết luồng)
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
