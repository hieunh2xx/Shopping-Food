# Tài liệu Quy trình: Khuyến mãi & Loyalty (Promotion / Loyalty)

Tài liệu mô tả **Discount (voucher)**, **Buy X Get Y**, **Flash Sale**, và **Loyalty điểm / đổi quà / hạng thành viên** trong **Shopping Food**.

---


---

## Phần A — UI Interaction Trace (Nút bấm → Code → Data → Hiển thị)

> UI Trace — Promo / Loyalty  
> Mỗi thao tác trả lời: **nút ở đâu** · **bấm chạy file/hàm nào** · **API/BE đâu** · **data trả về** · **hiển thị thế nào**.


---

### UT-PRO-01 — Áp mã giảm giá tại Checkout (cross-link)

#### 1. Giao diện

| Mục | Giá trị |
|-----|---------|
| **Route** | `/checkout` |
| **Page** | `CheckoutPage.tsx` |
| **Nút** | Áp dụng mã trong modal/form → `handleApplyCode` |

#### 2–3.

```text
discountService.applyDiscount({ code, restaurantId?, cartAmount })
  → POST /Discount/apply
  → data: { discountId, code, discountAmount, ... }
```

#### 5. Hiển thị

| OK | toast success + `setSelectedDiscount` → giảm `finalTotal` trên UI |
| Fail | toast `Mã giảm giá không hợp lệ` / message BE (expired, min order…) |
| Gỡ mã | toast `Đã gỡ mã giảm giá` + clear selectedDiscount |

---

### UT-PRO-02 — Lưu voucher vào ví (`CustomerVouchers`)

#### 1. Giao diện

| Mục | Giá trị |
|-----|---------|
| **Nơi** | Profile tab vouchers — `components/profile/CustomerVouchers.tsx` |
| **Nút** | Lưu mã `onClick={() => handleSaveVoucher(voucher.id)}` |

#### 2–3.

```text
discountService.saveDiscount({ discountId })
  → POST /Discount/save
  → CUSTOMER_DISCOUNT
```

#### 5. Hiển thị

toast `Đã lưu mã giảm giá vào ví!`; đã lưu rồi → toast error message API; reload list đã lưu.

---

### UT-PRO-03 — Đổi điểm lấy quà (`CustomerLoyalty`)

#### 1. Giao diện

| Mục | Giá trị |
|-----|---------|
| **Component** | `components/profile/CustomerLoyalty.tsx` |
| **Nút** | Đổi quà trên gift card → `handleRedeemGift(gift.id)` → ConfirmModal → confirm redeem |

#### 2–3.

```text
loyaltyPointService.redeemGift({ pointGiftConfigId })
  → POST /LoyaltyPoint/redeem
  → trừ điểm + tạo CustomerDiscount
```

#### 5. Hiển thị

| OK | toast `Đổi quà thành công! Mã giảm giá đã được thêm vào ví.` + refresh điểm/quà |
| Thiếu điểm | toast Insufficient points… |
| Confirm hủy | không gọi API |

---

### UT-PRO-04 — Seller: CRUD Discount / BuyXGetY / Flash register

#### Discount

| UI | `SellerDiscountsPage.tsx` |
| Submit create/update | `POST /Discount` hoặc update `POST /Discount/{id}` |
| Delete | ConfirmModal → `DELETE /Discount/{id}` |
| Hiển thị | toast tạo/sửa/xóa + reload table |

#### Buy X Get Y

| UI | `SellerPromotionsPage.tsx` |
| API | `GET/POST/DELETE /Promotion` |
| Hiển thị | toast CRUD |

#### Flash Sale đăng ký SP

| UI | `SellerFlashSalesPage.tsx` |
| API | `POST /FlashSale/register` |
| Hiển thị | toast đăng ký thành công; lỗi giá ≥ gốc / đã đăng ký / status không Pending |

---

### UT-PRO-05 — Admin: Flash Sale & Discount

#### Flash Admin (`AdminFlashSalePage.tsx`)

| Nút | Flow |
|-----|------|
| Tạo/sửa chương trình | `POST /FlashSale/flash-sales` / update |
| Xóa | `window.confirm` → `DELETE /FlashSale/flash-sales/{id}` |
| Duyệt/từ chối SP | `POST /FlashSale/review-product` (+ PromptModal lý do từ chối) |

#### Discount Admin (`AdminDiscountsPage.tsx`)

CRUD + ConfirmModal xóa/khóa → `PATCH /Discount/{id}/lock`.

#### Loyalty Admin (`AdminLoyaltyConfigPage.tsx`)

Gift config / tier / evaluate → `/LoyaltyPoint/tier-configs`, `evaluate-tiers`, Admin point-gift-config.

---

## Sơ đồ Redeem

```mermaid
sequenceDiagram
    participant Btn as Đổi quà
    participant CF as ConfirmModal
    participant API as POST redeem
    participant UI as Điểm + Voucher ví
    Btn->>CF: confirm
    CF->>API: pointGiftConfigId
    API-->>UI: toast + refresh loyalty
```


---

## Phần B — Workflow nghiệp vụ & Backend (chi tiết luồng)
## 1. Luồng Tổng Quan (Workflow)

1. **Seller/Admin tạo voucher** → `POST /api/Discount` → khách **lưu** `POST /api/Discount/save` → **apply** lúc checkout `POST /api/Discount/apply`.
2. **Buy X Get Y:** Seller CRUD `api/Promotion` → khách xem `/buy-x-get-y`.
3. **Flash Sale:** Admin tạo chiến dịch `POST /api/FlashSale/flash-sales` → Seller `POST /register` SP → Admin `POST /review-product` → khách xem `/flash-sale` (`GET /active`).
4. **Loyalty:** Khách xem điểm `GET /api/LoyaltyPoint`, quà `GET /gifts`, đổi `POST /redeem`; Admin cấu hình tier / adjust; worker đánh giá hạng định kỳ / `POST /evaluate-tiers`.

```mermaid
sequenceDiagram
    participant Seller as Seller/Admin FE
    participant Cust as Customer FE
    participant D as DiscountController
    participant P as PromotionController
    participant F as FlashSaleController
    participant L as LoyaltyPointController
    participant DB as SQL Server

    Seller->>D: POST /api/Discount
    Cust->>D: POST /save → POST /apply (checkout)
    Seller->>P: CRUD BuyXGetY
    Seller->>F: register product
    Seller->>F: review-product (Admin)
    Cust->>F: GET /active
    Cust->>L: GET / + GET /gifts + POST /redeem
```

---

## Luồng A — Discount (Voucher)

### A1. API

| Method | Route | Việc |
|--------|-------|------|
| GET | `/api/Discount` | List |
| POST | `/api/Discount` | Tạo (Seller quán / Admin platform) |
| POST | `/api/Discount/save` | Customer lưu voucher |
| GET | `/api/Discount/{id}` | Chi tiết |
| POST | `/api/Discount/{id}` | Update |
| DELETE | `/api/Discount/{id}` | Xóa |
| POST | `/api/Discount/apply` | Tính giảm giá (checkout) |
| GET | `/api/Discount/stats` | Thống kê |
| PATCH | `/api/Discount/{id}/lock` | Khóa voucher |

**Controller:** `src/ShoppingFood.API/Controllers/DiscountController.cs`  
**FE:** `DiscountService.ts`, `SellerDiscountsPage.tsx`, `AdminDiscountsPage.tsx`, `CustomerVouchers.tsx`, apply trong `CheckoutPage.tsx`.

```typescript
async createDiscount(data: ICreateDiscountRequest) { return httpClient.post(...); }
async saveDiscount(data: ISaveDiscountRequest) { ... }
async applyDiscount(data: IApplyDiscountRequest) { ... }
```

**DB:** `DISCOUNT`, `CUSTOMER_DISCOUNT` (UsageCount), gắn `ORDER.AppliedDiscountId`.

**Types:** `DiscountType` Percentage | FixedAmount | FreeShipping; `DiscountStatus` Active/Inactive/Cancelled.

---

## Luồng B — Buy X Get Y (Promotion)

| Method | Route | Việc |
|--------|-------|------|
| GET | `/api/Promotion` | List |
| POST | `/api/Promotion` | Tạo |
| POST | `/api/Promotion/{id}` | Update |
| DELETE | `/api/Promotion/{id}` | Xóa |

**Controller:** `PromotionController.cs`  
**FE:** `PromotionService.ts`, `SellerPromotionsPage.tsx`, `BuyXGetYPage.tsx`, `BuyXGetYSection.tsx`  
**DB:** `BUY_X_GET_Y_PROMOTION` (RestaurantId, TriggerProductId, GiftProductId).

---

## Luồng C — Flash Sale

| Method | Route | Việc |
|--------|-------|------|
| GET | `/api/FlashSale/active` | Flash đang chạy (public) |
| GET | `/api/FlashSale/flash-sales` | List quản trị |
| POST | `/api/FlashSale/flash-sales` | Admin tạo |
| POST | `/api/FlashSale/flash-sales/{id}` | Update |
| DELETE | `/api/FlashSale/flash-sales/{id}` | Xóa (soft) |
| POST | `/api/FlashSale/register` | Seller đăng ký SP |
| GET | `/api/FlashSale/flash-sales/{id}/products` | SP trong sale |
| POST | `/api/FlashSale/review-product` | Admin duyệt SP |

**FE:** `FlashSaleService.ts`, `AdminFlashSalePage.tsx`, `SellerFlashSalesPage.tsx`, `FlashSalePage.tsx`  
**DB:** `FLASH_SALE`, `FLASH_SALE_PRODUCT` (status Pending/Approved/Rejected)  
**Pricing:** `IFlashSalePricingService` dùng khi checkout/giá hiển thị.

```typescript
async getActiveFlashSales() { ... }
async createFlashSale(data) { ... }
// register + review-product qua cùng service
```

---

## Luồng D — Loyalty Points

| Method | Route | Auth | Việc |
|--------|-------|------|------|
| GET | `/api/LoyaltyPoint` | Customer | Điểm + tier của tôi |
| GET | `/api/LoyaltyPoint/gifts` | Public/Auth | Quà đổi điểm |
| POST | `/api/LoyaltyPoint/redeem` | Customer | Đổi quà → voucher |
| POST | `/api/LoyaltyPoint/evaluate-tiers` | Admin | Chạy đánh giá hạng |
| GET | `/api/LoyaltyPoint/tier-configs` | Auth/Admin | Mốc hạng |
| POST | `/api/LoyaltyPoint/tier-configs?tier=&minPoints=` | Admin | Add/update mốc |
| PUT | `/api/LoyaltyPoint/adjust-user-tier?userId=&newTier=` | Admin | Chỉnh hạng tay |

> **Lưu ý:** Backend dùng **POST** `tier-configs` (query `tier`, `minPoints`). FE `LoyaltyPointService.updateTierConfig` đang gọi **PUT** — khi implement/test cần khớp Method với Controller.

**Controller excerpt** — `LoyaltyPointController.cs`:

```csharp
[HttpPost("redeem")]
public async Task<ActionResult<ApiResponse>> Redeem([FromBody] RedeemPointGiftCommand command)
{
    if (userDto != null) command.CurrentUserId = userDto.Id;
    var response = await _mediator.Send(command);
    return Ok(response);
}

[HttpPost("tier-configs")]
public async Task<ActionResult<ApiResponse>> AddOrUpdateTierConfig([FromQuery] MemberTier tier, [FromQuery] int minPoints)
{ ... }

[HttpPut("adjust-user-tier")]
public async Task<ActionResult<ApiResponse>> AdjustUserTier([FromQuery] Guid userId, [FromQuery] MemberTier newTier)
{
    // cập nhật LoyaltyPoint.Tier + tạo Notification Loyalty
}
```

**FE:** `LoyaltyPointService.ts`, `CustomerLoyalty.tsx`, `AdminLoyaltyConfigPage.tsx`  
**DB:** `LOYALTY_POINT`, `LOYALTY_POINT_HISTORY`, `POINT_GIFT_CONFIG`, `MEMBER_TIER_CONFIG`  
**Worker:** `MemberTierEvaluationWorker` (đánh giá theo lịch).

**Admin point-gift-config:** CRUD qua `AdminController` (`/api/Admin/point-gift-config*`) — cấu hình quà gắn `DiscountId`.

---

## Call chain (tóm tắt)

```text
Seller/Admin/Customer Pages
  ↓
DiscountService | PromotionService | FlashSaleService | LoyaltyPointService
  ↓
DiscountController | PromotionController | FlashSaleController | LoyaltyPointController
  ↓
Features/Discounts | Promotions | FlashSales | LoyaltyPoints
  ↓
DISCOUNT / CUSTOMER_DISCOUNT / BUY_X_GET_Y / FLASH_SALE* / LOYALTY_* / POINT_GIFT_CONFIG
```

---

## Toast / Message

| Nơi | Trigger |
|-----|---------|
| SellerDiscountsPage / AdminDiscountsPage | CRUD voucher |
| CustomerVouchers | save voucher |
| CheckoutPage | apply discount fail/ok |
| FlashSale pages | create/register/review |
| CustomerLoyalty | redeem gift |
| AdminLoyaltyConfig | tier config / adjust |

---

## Bảo mật / nghiệp vụ

1. Apply discount validate hạn dùng, Audience (ByTier/Specific), UsageCount.
2. FlashSaleProduct phải **Approved** mới tính giá flash.
3. Redeem trừ điểm + tạo CustomerDiscount từ PointGiftConfig.
4. Adjust tier tạo **Notification** type Loyalty (push SignalR qua interceptor).
5. RBAC theo role trên từng endpoint.

---

## Checklist

- [ ] Tạo voucher Seller + Admin platform
- [ ] Customer save + apply đúng số tiền giảm ở checkout
- [ ] BuyXGetY CRUD + trang public
- [ ] Flash: create → register → review → active list
- [ ] Loyalty GET điểm, redeem gift, tier-configs POST
- [ ] adjust-user-tier có notification

---

## Tóm tắt

Bốn nhánh KM độc lập nhưng cùng phục vụ giảm giá / giữ chân khách: **Discount**, **BuyXGetY**, **FlashSale**, **Loyalty**.

> [Checkout_Order_Workflow.md](./Checkout_Order_Workflow.md) · [Payment_Requirements.md](./Payment_Requirements.md) · [README](./README.md)
