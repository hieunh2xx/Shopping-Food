# Tài liệu Quy trình: Shipper giao hàng (Shipper Delivery)

Tài liệu mô tả luồng tài xế từ **bật online** → nhận đề xuất → giao hàng → báo cáo sự cố / uy tín trong hệ thống **Shopping Food**.

> Đơn phải ở `WaitingForShipper` (Seller gọi waiting-for-shipper) hoặc được Coordinator force-assign.  
> Xem thêm: [Checkout_Order_Workflow.md](./Checkout_Order_Workflow.md) · [Coordinator_Dispatch_Workflow.md](./Coordinator_Dispatch_Workflow.md) · [Payment_Requirements.md](./Payment_Requirements.md) (settle COD khi delivered).

---


---

## Phần A — UI Interaction Trace (Nút bấm → Code → Data → Hiển thị)

> UI Trace — Shipper  
> Mỗi thao tác trả lời: **nút ở đâu** · **bấm chạy file/hàm nào** · **API/BE đâu** · **data trả về** · **hiển thị thế nào**.


**Route:** `/shipper` · **Page:** `pages/shipper/ShipperDashboard.tsx`  
**Service:** `services/ShipperService.ts`

---

## UT-SHP-01 — Toggle **「Bật / Tắt trực tuyến」**

### 1. Giao diện nút ở đâu?

| Mục | Giá trị |
|-----|---------|
| **Route** | `/shipper` |
| **Page** | `ShipperDashboard.tsx` |
| **Control** | Toggle / button `onClick={handleToggleOnline}` (~605) |
| **Nhãn UX** | BẬT / TẮT trạng thái trực tuyến |

### 2. FE chạy đâu?

```text
onClick
  → handleToggleOnline (ShipperDashboard.tsx ~385+)
       · newStatus = !isOnline
  → shipperService.toggleOnline({ isOnline: newStatus })
  → HttpClient POST /api/Shipper/toggle-online
```

### 3. BE chạy đâu?

```text
ShipperController → ToggleShipperOnlineHandler
  → Kiểm tra role Shipper, profile tồn tại
  → Nếu Suspended → Failure 403 + lý do / thời gian còn
  → IsOnline = newStatus → Save
```

### 4. Data trả về

```json
{ "code": 200, "error": false, "message": "...", "data": null }
```
Hoặc `error: true`, `message`: `"Tài khoản của bạn đã bị khóa. Lý do: ..."`

### 5. Hiển thị

| Nhánh | UI |
|-------|-----|
| OK | `setIsOnline(newStatus)` + `toast.success('Bạn đã BẬT/TẮT trạng thái trực tuyến!')` |
| Fail | `toast.error(res.message \|\| ...)` — **không** đổi toggle |

### 6. Sequence

```mermaid
sequenceDiagram
    participant B as Toggle UI
    participant D as ShipperDashboard
    participant API as toggle-online
    B->>D: click
    D->>API: POST
    API-->>D: ApiResponse
    D->>B: toast + setIsOnline
```

---

## UT-SHP-02 — Nút **「Nhận đơn」** trên card Available Offers

### 1. UI ở đâu?

| Mục | Giá trị |
|-----|---------|
| **Vùng** | Danh sách available offers trên Dashboard |
| **Nút** | Accept trên card — `onClick` → `handleAcceptOffer(offer.orderId)` (~860) |
| **Nút phụ** | Reject → `handleRejectOffer` (~874) |
| **Click card** | `setProposalPopupOffer(offer)` mở popup |

### 2. FE

```text
handleAcceptOffer(orderId)
  → nếu !isOnline: toast.error('Vui lòng bật trạng thái trực tuyến để nhận đơn'); return
  → shipperService.acceptOffer({ orderId })
  → POST /api/Shipper/accept-offer
  → success: toast 'Đã chấp nhận đơn hàng!' + refresh active delivery / offers
```

### 3. BE

```text
Accept offer handler
  → Gán ShipperId lên Order, Proposal Accepted
  → Có thể tạo notification cho Customer/Seller
```

### 4–5. Data & hiển thị

- Success: toast + `fetchAvailableOffers` / set `activeDelivery`  
- Error API: `toast.error(err.response?.data?.message || 'Không thể nhận đơn...')`

---

## UT-SHP-03 — Popup đề xuất **OrderProposalPopup** (Accept / Reject / Timeout)

### 1. UI

| Mục | Giá trị |
|-----|---------|
| **Component** | `pages/shipper/components/OrderProposalPopup.tsx` |
| **Mở khi** | Coordinator broadcast / force-assign / click card → `proposalPopupOffer` state |
| **Nút** | Accept → `onAccept={handleAcceptProposal}` · Reject → `handleRejectProposal` |
| **Timeout** | Timer trong popup → `handleTimeoutProposal` |

### 2. FE

```text
handleAcceptProposal(orderId) (~271)
  → POST /Shipper/accept-offer
  → toast.success('Nhận đơn thành công!')
  → đóng popup, đưa đơn vào active

handleRejectProposal → POST /Shipper/reject-offer
handleTimeoutProposal → toast.error('Đã hết thời gian phản hồi đề xuất.')
```

**Force-assign qua SignalR** (~228): toast → `GET /Shipper/proposed-offer/{orderId}` → mở popup / set active.

### 3–5. BE / hiển thị

- Accept/Reject handlers cập nhật `OrderDeliveryProposal` + Order  
- Thu hồi: toast.error `'Đơn hàng đã bị thu hồi!...'` (~257)

---

## UT-SHP-04 — Nút **「Đã đến quán」** / **「Đã lấy hàng」**

### 1. UI

Trên card **active delivery** — các bước:

| Nhãn UX | Handler | API |
|---------|---------|-----|
| Đến quán / Next step | `handleStepTransition` → confirm-arrived hoặc confirm-picked-up tùy status | `POST /Shipper/confirm-arrived` · `confirm-picked-up` |
| (~756) | `onClick={() => handleStepTransition(activeDelivery.orderId)}` | |

### 2. FE (~431+)

```text
handleStepTransition(orderId)
  → shipperService.confirmArrived / confirmPickedUp (theo bước hiện tại)
  → cập nhật local activeDelivery status
  → lỗi: toast.error('Đơn hàng không còn hợp lệ hoặc đã bị thu hồi.')
```

### 3. BE

Handlers đổi `OrderStatus` / trạng thái giao tương ứng.

### 5. Hiển thị

- UI bước tiến trên card (không nhất thiết toast success mỗi bước — xem code nhánh success)
- Fail: toast error

---

## UT-SHP-05 — Nút **「Giao thành công」** → SuccessDeliveryModal

### 1. UI

| Mục | Giá trị |
|-----|---------|
| **Nút** | Mở modal — `setSuccessModalOrderId(activeDelivery.orderId)` (~766) |
| **Modal** | `components/SuccessDeliveryModal.tsx` |
| **Trong modal** | Upload ảnh chứng minh + nút xác nhận giao |

### 2. FE

```text
SuccessDeliveryModal submit
  → (upload ảnh nếu cần) authService.uploadImage / UploadImage
  → shipperService.confirmDelivered({ orderId, proofImageUrl? })
  → POST /api/Shipper/confirm-delivered
```

### 3. BE

```text
ConfirmDelivered handler
  → Order status Delivered
  → PaymentSettlementService.SettleOrderOnDeliveryAsync
       · Cộng ví Seller / Shipper / Platform (xem Revenue_Split)
  → ApiResponse success
```

### 4. Data trả về

`{ error: false, message: "..." }` — settle xảy ra server-side.

### 5. Hiển thị

| Success | `toast` trong modal: `'Chúc mừng! Giao hàng thành công.'` · đóng modal · xóa activeDelivery · refresh income nếu có |
| Thiếu ảnh | `toast.error('Vui lòng tải ảnh chứng minh giao hàng')` |

---

## UT-SHP-06 — Nút **「Giao thất bại」** (PromptModal)

### 1. UI

```text
onClick → handleDeliveryFailedClick(orderId) (~773)
  → mở PromptModal nhập lý do
  → confirm → POST /Shipper/confirm-failed
```

### 5. Hiển thị

- Hiện code: `toast.error('Đã báo cáo giao hàng thất bại.')` sau khi gửi OK (dùng error toast — xem AL-SHP-12)

---

## UT-SHP-07 — Nút **「Báo cáo sự cố」** → ReportIncidentModal

### 1. UI

| Mục | Giá trị |
|-----|---------|
| **Mở** | `setReportModalOrderId(...)` (~786) |
| **Modal** | `ReportIncidentModal.tsx` |
| **Nút gửi** | Submit form chi tiết sự cố |

### 2–5

```text
→ shipperService.reportOrder / POST /Shipper/Orders/{orderId}/report
→ toast.success('Gửi báo cáo sự cố thành công. Coordinator sẽ xem xét...')
→ đóng modal
```

Validation: `toast.error('Vui lòng nhập chi tiết sự cố')`

---

## UT-SHP-08 — Nút **「Làm mới」** danh sách offers

```text
onClick={fetchAvailableOffers} (~814, ~893)
  → GET /Shipper/available-offers
  → setOffers(res.data)
  → nếu offline/API lỗi: toast theo message BE
```

---

## Bảng tóm tắt Shipper

| ID | Nhãn | FE hàm | API | Hiển thị |
|----|------|--------|-----|----------|
| UT-SHP-01 | Toggle online | handleToggleOnline | POST toggle-online | toast BẬT/TẮT |
| UT-SHP-02 | Nhận đơn (card) | handleAcceptOffer | accept-offer | toast + refresh |
| UT-SHP-03 | Popup accept/reject | handleAcceptProposal… | accept/reject-offer | toast + đóng popup |
| UT-SHP-04 | Đến quán / lấy hàng | handleStepTransition | confirm-arrived/picked-up | cập nhật bước UI |
| UT-SHP-05 | Giao thành công | SuccessDeliveryModal | confirm-delivered | toast chúc mừng + settle |
| UT-SHP-06 | Giao thất bại | PromptModal | confirm-failed | toast |
| UT-SHP-07 | Báo sự cố | ReportIncidentModal | Orders/{id}/report | toast success |
| UT-SHP-08 | Refresh offers | fetchAvailableOffers | available-offers | re-render list |

## File neo

| File |
|------|
| `ShoppingFood.FE/src/pages/shipper/ShipperDashboard.tsx` |
| `.../components/OrderProposalPopup.tsx` |
| `.../components/SuccessDeliveryModal.tsx` |
| `.../components/ReportIncidentModal.tsx` |
| `ShoppingFood.FE/src/services/ShipperService.ts` |
| `src/ShoppingFood.API/Controllers/ShipperController.cs` |
| `Application/Services/PaymentSettlementService.SettleOrderOnDeliveryAsync` |


---

## Phần B — Workflow nghiệp vụ & Backend (chi tiết luồng)
## 1. Luồng Tổng Quan (Workflow)

1. **Online:** Shipper mở `/shipper` → bật online (`POST /api/Shipper/toggle-online`).
2. **Nhận đề xuất:** Poll `available-offers` **hoặc** nhận Notification Force-Assign / Broadcast → `proposed-offer/{orderId}`.
3. **Accept / Reject:** `accept-offer` hoặc `reject-offer` (kèm lat/lng).
4. **Accept OK:** Order `ShipperId` gán, `Status = Shipping`; proposal `Accepted`.
5. **Đến quán:** `confirm-arrived` (có thể kèm mã / GPS).
6. **Lấy hàng:** `confirm-picked-up`.
7. **GPS / lộ trình:** `location`, `delivery-route/{orderId}` trong lúc giao.
8. **Giao thành công:** `confirm-delivered` → `Delivered` + `SettleOrderOnDeliveryAsync` (Payment).
9. **Giao thất bại:** `confirm-failed` + lý do.
10. **Khác:** Báo cáo sự cố đơn, xem `ReputationHistory`, thu nhập, lịch/khu vực.

```mermaid
sequenceDiagram
    actor S as Shipper
    participant FE as ShipperDashboard
    participant API as ShipperController
    participant H as MediatR Handlers
    participant DB as SQL Server
    participant Pay as PaymentSettlement

    S->>FE: Toggle Online
    FE->>API: POST /api/Shipper/toggle-online
    API->>H: ToggleShipperOnlineHandler
    H->>DB: ShipperProfile.IsOnline

    S->>FE: Xem/Accept offer
    FE->>API: POST accept-offer
    API->>H: AcceptDeliveryOfferHandler
    H->>DB: Order.Shipping + ShipperId

    S->>FE: Arrived → PickedUp → Delivered
    FE->>API: confirm-arrived / picked-up / delivered
    API->>H: Confirm*Handlers
    H->>Pay: SettleOrderOnDeliveryAsync
    H-->>FE: Success
    FE-->>S: Toast
```

### Trạng thái đơn liên quan Shipper

```text
WaitingForShipper --accept/force-assign--> Shipping --confirm-delivered--> Delivered
                                      \--confirm-failed--> (failed handling / escalate)
```

---

## Bước 1: Bật / tắt Online

**Thông tin:**
- **URL (FE):** `/shipper` (ShipperDashboard)
- **API:** `POST /api/Shipper/toggle-online`
- **HTTP Method:** POST
- **Auth:** Role **Shipper**

### 1.1. Frontend

**File:** `ShoppingFood.FE/src/pages/shipper/ShipperDashboard.tsx`  
**Service:** `ShoppingFood.FE/src/services/ShipperService.ts`

```typescript
async toggleOnline(data: IToggleShipperOnlineRequest): Promise<IApiResponse<any>> {
  return httpClient.post(API_ENDPOINTS.SHIPPER.TOGGLE_ONLINE, data);
}
```

**Toast:**
- Success: `Bạn đã BẬT trạng thái trực tuyến!` / `Bạn đã TẮT...`
- Error: `Không thể thay đổi trạng thái...` / message suspended

### 1.2. Controller

**File:** `src/ShoppingFood.API/Controllers/ShipperController.cs` — Lines 20–25

```csharp
[HttpPost("toggle-online")]
public async Task<ActionResult<ApiResponse>> ToggleOnline([FromBody] ToggleShipperOnlineCommand command)
{
    var response = await _mediator.Send(command);
    return StatusCode(response.Code, response);
}
```

### 1.3. Handler

**File:** `src/ShoppingFood.Application/Features/Users/Commands/ToggleShipperOnlineHandler.cs`  
**Class:** `ToggleShipperOnlineHandler`

```csharp
if (userProfile == null || userProfile.Role != UserRole.Shipper)
    return ApiResponse.Failure(403, "Forbidden. Only shipper can toggle online status.");

// SuspendedUntil còn hiệu lực → 403 + lý do / phút còn lại
shipperProfile.IsOnline = request.IsOnline;
shipperProfile.UpdatedAt = DateTime.UtcNow;
```

**DB:** `SHIPPER_PROFILE.IsOnline`, `SuspendedUntil`, `SuspendedReason`.

---

## Bước 2: Xem đề xuất / đơn khả dụng

### 2.1. Available offers

| Mục | Chi tiết |
|-----|----------|
| **API** | `GET /api/Shipper/available-offers?latitude=&longitude=` |
| **Controller** | `GetAvailableOffers` (L151–165) |
| **Query** | `GetAvailableOrdersForShipperQuery` |
| **FE** | `shipperService.getAvailableOffers(lat, lng)` |

### 2.2. Proposed offer (1 đơn)

| Mục | Chi tiết |
|-----|----------|
| **API** | `GET /api/Shipper/proposed-offer/{orderId}?latitude=&longitude=` |
| **Controller** | `GetProposedOffer` (L26–36) |
| **Query** | `GetProposedDeliveryOfferQuery` |
| **FE** | Popup `OrderProposalPopup` / sau Force-Assign notification |

**Controller:**

```csharp
[HttpGet("proposed-offer/{orderId}")]
public async Task<ActionResult<ApiResponse>> GetProposedOffer(Guid orderId, [FromQuery] double latitude, [FromQuery] double longitude)
{
    var query = new GetProposedDeliveryOfferQuery { OrderId = orderId, Latitude = latitude, Longitude = longitude };
    if (userDto != null) query.CurrentUserId = userDto.Id;
    var response = await _mediator.Send(query);
    return StatusCode(response.Code, response);
}
```

**Realtime:** `ShipperDashboard` listen notification Force Assign → gọi `getProposedOffer` → toast `Bạn vừa được điều phối viên gán trực tiếp một đơn hàng mới!`

---

## Bước 3: Accept / Reject offer

### 3.1. Accept

**API:** `POST /api/Shipper/accept-offer`  
**Controller:** L38–43  
**Handler:** `src/ShoppingFood.Application/Features/Orders/Commands/AcceptDeliveryOfferHandler.cs`

**Rules (Handle):**

```csharp
if (!shipperProfile.IsOnline)
    return ApiResponse.Failure(400, "Drivers must switch to online status to receive orders.");
if (order.ShipperId.HasValue)
    return ApiResponse.Failure(400, "This order has been accepted by another driver.");
if (order.Status != OrderStatus.WaitingForShipper)
    return ApiResponse.Failure(400, $"The order is not in waiting for shipper status...");

AssignOrderToShipper(order, shipperProfile.Id); // Status = Shipping
// Update proposal Accepted + DispatchHistory + Notify customer
```

**FE toast:** `Nhận đơn thành công!` / `Đã chấp nhận đơn hàng!`

### 3.2. Reject

**API:** `POST /api/Shipper/reject-offer`  
**Handler:** `RejectDeliveryOfferHandler.cs`  
**FE:** Prompt lý do → `rejectOffer` → toast `Đã từ chối đơn hàng`  
**DB:** `ORDER_DELIVERY_PROPOSAL.Status = Rejected` (+ history)

---

## Bước 4: Arrived → Picked up → Delivered / Failed

### 4.1. Confirm arrived

| Mục | Chi tiết |
|-----|----------|
| **API** | `POST /api/Shipper/confirm-arrived` |
| **Controller** | L45–54 — gán `CurrentUserId` từ `userDto` |
| **Handler** | `ConfirmArrivedAtRestaurantHandler.cs` |
| **FE** | Dashboard cập nhật bước lấy hàng |

### 4.2. Confirm picked up

| Mục | Chi tiết |
|-----|----------|
| **API** | `POST /api/Shipper/confirm-picked-up` |
| **Handler** | `ConfirmPickedUpHandler.cs` |
| **UI** | Có thể dùng `PickupCodeModal` |

### 4.3. Update location

| Mục | Chi tiết |
|-----|----------|
| **API** | `POST /api/Shipper/location` |
| **Handler** | `UpdateShipperLocationCommand` |
| **DB** | `SHIPPER_PROFILE.Latitude/Longitude` |

### 4.4. Delivery route

| Mục | Chi tiết |
|-----|----------|
| **API** | `GET /api/Shipper/delivery-route/{orderId}` |
| **Query** | `GetDeliveryRouteQuery` |

### 4.5. Confirm delivered (quan trọng — tài chính)

**API:** `POST /api/Shipper/confirm-delivered`  
**Handler:** `ConfirmDeliverySuccessHandler.cs`

```csharp
if (order.Status != OrderStatus.Shipping) // fail otherwise
order.Status = OrderStatus.Delivered;
await _paymentSettlementService.SettleOrderOnDeliveryAsync(order, shipperProfile);
```

> Chi tiết chia tiền / công nợ COD: [Payment_Requirements.md](./Payment_Requirements.md).

**FE:** `SuccessDeliveryModal` → `confirmDelivered`.

### 4.6. Confirm failed

**API:** `POST /api/Shipper/confirm-failed`  
**Handler:** `ConfirmDeliveryFailedHandler.cs`  
**FE toast:** `Đã báo cáo giao hàng thất bại.` / lỗi mạng

---

## Bước 5: Báo cáo sự cố đơn

**API:** `POST /api/Shipper/Orders/{orderId}/report`  
**Controller:** L199–208  
**Command:** `ReportOrderIncidentCommand`  
**FE:** `ReportIncidentModal` → `shipperService.reportOrderIncident`  
**DB:** `SYSTEM_REPORT` (target Order/Shipper…) → Coordinator xem incidents

```csharp
[HttpPost("Orders/{orderId}/report")]
public async Task<ActionResult<ApiResponse>> ReportOrderIncident(Guid orderId, [FromBody] ReportOrderIncidentCommand command)
{
    command.OrderId = orderId;
    if (userDto != null) command.CurrentUserId = userDto.Id;
    var response = await _mediator.Send(command);
    return StatusCode(response.Code, response);
}
```

---

## Bước 6: Uy tín, thu nhập, lịch khu vực

| API | Handler / Query | FE |
|-----|-----------------|-----|
| `GET /api/Shipper/ReputationHistory` | `GetReputationHistoryQuery` | `ShipperReputationTab` |
| `GET /api/Shipper/income-report` | `GetShipperIncomeReportQuery` | `ShipperIncomePage` |
| `GET/PUT /api/Shipper/schedule-area` | Get/Update schedule | Profile |
| `POST /api/Shipper/review` | `CreateShipperReviewCommand` | Customer review shipper sau giao |

Coordinator có thể **adjust reputation** / **suspend** — xem Coordinator workflow.

**Thu hồi đơn:** Notification release → Dashboard toast `Đơn hàng đã bị thu hồi!` và gỡ khỏi list.

---

## Sơ đồ file đi qua (Call chain)

```text
ShipperDashboard.tsx (+ OrderProposalPopup, SuccessDeliveryModal, ReportIncidentModal)
  ↓
ShipperService.ts
  ↓
ShipperController.cs
  ↓
ToggleShipperOnlineHandler
AcceptDeliveryOfferHandler / RejectDeliveryOfferHandler
ConfirmArrivedAtRestaurantHandler / ConfirmPickedUpHandler
ConfirmDeliverySuccessHandler / ConfirmDeliveryFailedHandler
UpdateShipperLocation / GetDeliveryRoute / ReportOrderIncident
  ↓
ORDER, SHIPPER_PROFILE, ORDER_DELIVERY_PROPOSAL, ORDER_DISPATCH_HISTORY,
NOTIFICATION, SYSTEM_REPORT, WALLET (settle)
```

| Vai trò | Đường dẫn |
|---------|-----------|
| FE Dashboard | `ShoppingFood.FE/src/pages/shipper/ShipperDashboard.tsx` |
| FE Service | `ShoppingFood.FE/src/services/ShipperService.ts` |
| Controller | `src/ShoppingFood.API/Controllers/ShipperController.cs` |
| Toggle online | `.../Users/Commands/ToggleShipperOnlineHandler.cs` |
| Accept offer | `.../Orders/Commands/AcceptDeliveryOfferHandler.cs` |
| Delivered | `.../Orders/Commands/ConfirmDeliverySuccessHandler.cs` |
| Payment settle | `.../Services/PaymentSettlementService.cs` |

---

## Các thông báo (Toast)

| Message | Trigger |
|---------|---------|
| Bạn đã BẬT/TẮT trạng thái trực tuyến! | toggle-online |
| Vui lòng bật trạng thái trực tuyến để nhận đơn | Accept khi offline |
| Nhận đơn thành công! / Đã chấp nhận đơn hàng! | accept-offer |
| Đã từ chối đơn hàng | reject-offer |
| Đã hết thời gian phản hồi đề xuất. | Timeout popup |
| Force Assign / gán trực tiếp… | SignalR notification |
| Đơn hàng đã bị thu hồi! | Release từ Coordinator |
| Đã báo cáo giao hàng thất bại. | confirm-failed |

---

## Các cơ chế bảo mật / ràng buộc

1. Chỉ role **Shipper** + profile **Active** mới toggle/nhận đơn.
2. **Phải online** mới accept; tài khoản **Suspended** bị chặn (permanent hoặc còn phút).
3. Chỉ nhận đơn `WaitingForShipper` và **chưa có** `ShipperId` (tránh double-accept).
4. Delivered chỉ từ `Shipping`; settle tài chính **idempotent** (`IsFinancialSettled`).
5. GPS gửi kèm accept/location để tính khoảng cách / monitoring.
6. Force-assign / release từ Coordinator ghi `ORDER_DISPATCH_HISTORY` + push notification.

---

## Checklist tự test

- [ ] Toggle online/offline; bị suspend thì không bật được
- [ ] Seller đưa đơn sang WaitingForShipper → xuất hiện available/proposed
- [ ] Accept → Status Shipping; shipper khác không nhận được
- [ ] Reject → proposal Rejected
- [ ] Arrived → PickedUp → Delivered; ví/COD cập nhật (Payment)
- [ ] Confirm failed + report incident hiện ở Coordinator
- [ ] Force-assign từ Coord → toast + đơn vào dashboard
- [ ] Release → đơn biến mất khỏi shipper

---

## Tóm tắt

Shipper vận hành trên `ShipperDashboard`: **Online → Offer → Shipping pipeline → Delivered/Failed**. Accept gắn `ShipperId` và `OrderStatus.Shipping`; Delivered kích hoạt **settlement tài chính**. Điều phối thủ công nằm ở Coordinator workflow.

> [Checkout_Order](./Checkout_Order_Workflow.md) · [Coordinator_Dispatch](./Coordinator_Dispatch_Workflow.md) · [Payment_Requirements](./Payment_Requirements.md)
