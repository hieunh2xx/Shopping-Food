# Requirements: Khuyến mãi & Loyalty (Promotion / Loyalty)

Tài liệu **yêu cầu nghiệp vụ** cho Discount, Buy X Get Y, Flash Sale, điểm thưởng / hạng thành viên / đổi quà.

> Workflow: [../workflows/Promotion_Loyalty_Workflow.md](../workflows/Promotion_Loyalty_Workflow.md)

---

## 1. Mục tiêu nghiệp vụ

1. Tạo / lưu / áp / khóa **voucher (Discount)** — platform hoặc theo quán.
2. Chương trình **Buy X Get Y** theo quán.
3. **Flash Sale**: Admin tạo chiến dịch; Seller đăng ký SP; Admin duyệt SP.
4. **Loyalty**: tích/đổi điểm, quà (`PointGiftConfig`), hạng (Silver/Gold/Diamond), Admin chỉnh tier.

---

## 2. Actors & quyền

| Actor | Quyền |
|-------|--------|
| **Customer** | Save/apply voucher; xem gifts; redeem; xem điểm |
| **Seller / Mall** | CRUD Discount quán; BuyXGetY; đăng ký FlashSale product |
| **Admin** | Discount platform; FlashSale CRUD + review-product; point-gift-config; tier-configs; evaluate-tiers; adjust-user-tier; lock voucher |

---

## 3. Functional Requirements

### FR-DSC-01 — Discount

| ID | Requirement |
|----|-------------|
| FR-DSC-01 | `GET/POST /api/Discount` — list / create |
| FR-DSC-02 | `GET /api/Discount/{id}` — chi tiết |
| FR-DSC-03 | `POST /api/Discount/{id}` — update |
| FR-DSC-04 | `DELETE /api/Discount/{id}` — xóa |
| FR-DSC-05 | `POST /api/Discount/save` — Customer lưu vào `CustomerDiscount` |
| FR-DSC-06 | `POST /api/Discount/apply` — validate Active, hạn, usage, MinOrderAmount, per-user limit |
| FR-DSC-07 | `GET /api/Discount/stats` — thống kê |
| FR-DSC-08 | `PATCH /api/Discount/{id}/lock` — khóa khẩn (Admin/owner) |
| FR-DSC-09 | Types: Percentage / FixedAmount / FreeShipping; Status Active/Inactive/Cancelled |
| FR-DSC-10 | `RestaurantId` null = voucher sàn; có Id = voucher quán |

**Apply failures (API message):** code not found; inactive/cancelled; expired; out of usage; min order; max usage per user.

### FR-PRM-01 — Buy X Get Y

| ID | Requirement |
|----|-------------|
| FR-PRM-01 | `GET/POST /api/Promotion` — list / create |
| FR-PRM-02 | `POST /api/Promotion/{id}` — update |
| FR-PRM-03 | `DELETE /api/Promotion/{id}` — delete |
| FR-PRM-04 | Gắn Restaurant + TriggerProduct + GiftProduct; soft-filter nếu product deleted |

### FR-FLS-01 — Flash Sale

| ID | Requirement |
|----|-------------|
| FR-FLS-01 | `GET /api/FlashSale/active` — chiến dịch đang chạy (public) |
| FR-FLS-02 | `GET/POST /api/FlashSale/flash-sales` — list / Admin create |
| FR-FLS-03 | `POST /api/FlashSale/flash-sales/{id}` — update |
| FR-FLS-04 | `DELETE /api/FlashSale/flash-sales/{id}` — soft-delete program |
| FR-FLS-05 | `POST /api/FlashSale/register` — Seller đăng ký SP (chỉ FlashSale Pending; product Approved; giá FS < giá gốc; không trùng) |
| FR-FLS-06 | `GET /api/FlashSale/flash-sales/{id}/products` — SP trong sale |
| FR-FLS-07 | `POST /api/FlashSale/review-product` — Admin Approved/Rejected SP |
| FR-FLS-08 | Pricing checkout dùng `IFlashSalePricingService` khi SP trong FS Active |

### FR-LOY-01 — Loyalty

| ID | Requirement |
|----|-------------|
| FR-LOY-01 | `GET /api/LoyaltyPoint` — điểm + tier của user |
| FR-LOY-02 | `GET /api/LoyaltyPoint/gifts` — danh sách quà (public/auth) |
| FR-LOY-03 | `POST /api/LoyaltyPoint/redeem` — trừ điểm, tạo CustomerDiscount; lỗi nếu thiếu điểm / voucher hết / đã lưu |
| FR-LOY-04 | Admin point-gift CRUD: `/api/Admin/point-gift-config*` |
| FR-LOY-05 | `GET/POST /api/LoyaltyPoint/tier-configs` — cấu hình hạng (seed Silver/Gold/Diamond) |
| FR-LOY-06 | `POST /api/LoyaltyPoint/evaluate-tiers` — đánh giá lại hạng (+ worker yearly) |
| FR-LOY-07 | `PUT /api/LoyaltyPoint/adjust-user-tier` — Admin chỉnh hạng user |
| FR-LOY-08 | Earn điểm từ đơn: `PointTransactionType.EarnFromOrder` (khi business handler ghi) |

---

## 4. API surface (tóm tắt)

| Module | Prefix | Endpoints chính |
|--------|--------|-----------------|
| Discount | `/api/Discount` | GET/POST, save, `{id}`, apply, stats, `{id}/lock` |
| Promotion | `/api/Promotion` | GET/POST, `{id}` update/delete |
| FlashSale | `/api/FlashSale` | active, flash-sales CRUD, register, products, review-product |
| Loyalty | `/api/LoyaltyPoint` | GET, gifts, redeem, evaluate-tiers, tier-configs, adjust-user-tier |
| Admin gifts | `/api/Admin/point-gift-config` | CRUD |

---

## 5. Key files

| Vai trò | File |
|---------|------|
| Controllers | `DiscountController`, `PromotionController`, `FlashSaleController`, `LoyaltyPointController`, `AdminController` (point-gift) |
| Services | `FlashSalePricingService`, `MemberTierEvaluationWorker` |
| Entities | `Discount`, `CustomerDiscount`, `BuyXGetYPromotion`, `FlashSale`, `FlashSaleProduct`, `LoyaltyPoint`, `LoyaltyPointHistory`, `PointGiftConfig`, `MemberTierConfig` |
| FE | `CustomerVouchers`, `CustomerLoyalty`, `CheckoutPage` (apply), `SellerDiscountsPage`, `SellerPromotionsPage`, `SellerFlashSalesPage`, `AdminDiscountsPage`, `AdminFlashSalePage`, `AdminLoyaltyConfigPage`, `FlashSalePage`, `BuyXGetYPage` |

---

## 6. Acceptance Criteria

- [ ] Create/save/apply voucher đúng rule min order & usage
- [ ] Lock voucher → không apply được
- [ ] BuyXGetY CRUD theo quán
- [ ] Flash: Seller chỉ register khi Pending; giá FS < gốc; Admin duyệt mới bán FS
- [ ] Redeem: đủ điểm → có voucher trong ví; thiếu điểm → lỗi
- [ ] Evaluate-tiers / adjust-user-tier đổi MemberTier
- [ ] Checkout áp discount làm giảm TotalAmount đúng loại %/cố định/freeship

---

## 7. Cảnh báo / Thông báo hệ thống

| Message | Loại | File | Trigger | API | Mức độ |
|---------|------|------|---------|-----|--------|
| Áp dụng mã giảm giá thành công | success | `CheckoutPage.tsx` | Apply | `POST /Discount/apply` | Info |
| Mã giảm giá không hợp lệ | error | `CheckoutPage.tsx` | Apply fail | `apply` | Warning |
| Đã gỡ mã giảm giá | success | `CheckoutPage.tsx` | Remove | — | Info |
| This discount code is expired / inactive / run out / Minium order… | error | API | Apply | `apply` | Warning |
| Đã lưu mã giảm giá vào ví! | success | `CustomerVouchers.tsx` | Save | `POST /Discount/save` | Info |
| Đổi quà thành công! Mã đã thêm vào ví | success | `CustomerLoyalty.tsx` | Redeem | `POST /LoyaltyPoint/redeem` | Info |
| Insufficient points balance | error | API | Redeem | `redeem` | Warning |
| Đã tạo/cập nhật/xóa mã giảm giá | success | `SellerDiscountsPage` / Admin | CRUD | `/Discount` | Info |
| ConfirmModal xóa / khóa mã | confirm | Seller/Admin Discount pages | Delete/lock | `DELETE` / `PATCH lock` | Confirm |
| Đã tạo/cập nhật/xóa khuyến mãi BuyXGetY | success | `SellerPromotionsPage.tsx` | CRUD | `/Promotion` | Info |
| Đăng ký sản phẩm Flash Sale thành công | success | `SellerFlashSalesPage.tsx` | Register | `POST /FlashSale/register` | Info |
| Flash sale price must be lower… / already registered… | error | API | Register | `register` | Warning |
| Flash Sale CRUD / duyệt SP / window.confirm xóa / Prompt từ chối | success/confirm | `AdminFlashSalePage.tsx` | Admin FS | `/FlashSale/*` | Warning |
| Vui lòng chọn chương trình Flash Sale / nhập nội dung | error | `AdminNotificationsPage.tsx` | Broadcast FS | `/Admin/notifications/broadcast` | Warning |
| Loyalty gift/tier/evaluate success | success | `AdminLoyaltyConfigPage.tsx` | Config | `/LoyaltyPoint/*`, point-gift | Info |

---

## 8. Liên kết

- Workflow: [../workflows/Promotion_Loyalty_Workflow.md](../workflows/Promotion_Loyalty_Workflow.md)  
- Checkout apply: [../workflows/Checkout_Order_Workflow.md](../workflows/Checkout_Order_Workflow.md)  
- Admin gift/tiers: [Support_Admin_Requirements.md](./Support_Admin_Requirements.md)  
