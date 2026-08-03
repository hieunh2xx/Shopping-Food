# Requirements: Giỏ hàng (Cart)

Tài liệu yêu cầu nghiệp vụ cho giỏ hàng user đã đăng nhập và **guest cart**.

> Workflow liên quan: [../workflows/Cart_Workflow.md](../workflows/Cart_Workflow.md)  
> Checkout tiếp: [Order_Requirements.md](./Order_Requirements.md)

---

## 1. Mục tiêu

1. Cho phép thêm / sửa số lượng / xóa / xóa toàn bộ món trong giỏ.
2. Hỗ trợ **Guest** mua không login qua `guestUserId` (FE: `sf_guest_id` localStorage).
3. Đồng bộ giỏ với server; chặn checkout khi còn món **ngừng bán / unavailable**.
4. Một user (hoặc guest) chỉ có **một Cart** (1-1).

---

## 2. Actors

| Actor | Quyền |
|-------|--------|
| **Guest** | CRUD cart với header/query `guestUserId`; bypass auth khi không có Bearer |
| **Customer** (và user đã login) | CRUD cart gắn `UserAccountId` |
| **Seller/Shipper/…** | Có thể có cart nếu dùng UI customer (không khuyến khích nghiệp vụ) |

---

## 3. Functional Requirements

| ID | Requirement |
|----|-------------|
| FR-CART-01 | `POST /api/Cart` — thêm item (productId, quantity, size/topping nếu có) |
| FR-CART-02 | `GET /api/Cart` — lấy giỏ hiện tại + dòng CartItem |
| FR-CART-03 | `PUT /api/Cart` — cập nhật số lượng / options của item |
| FR-CART-04 | `DELETE /api/Cart` — xóa một item |
| FR-CART-05 | `DELETE /api/Cart/clear` — xóa toàn bộ item trong giỏ |
| FR-CART-06 | User login: Cart theo `UserAccountId` (unique 1-1) |
| FR-CART-07 | Guest: Cart theo `GuestUserId`; FE tạo/giữ `sf_guest_id` |
| FR-CART-08 | AuthenticationFilter: cho phép guest cart khi **không** có Authorization header (và path Cart) |
| FR-CART-09 | Không trộn User cart và Guest cart cùng request; nếu đã login dùng token |
| FR-CART-10 | Thêm món từ product phải còn bán (Approved, visible, in stock — theo rule handler) |
| FR-CART-11 | FE trước checkout: nếu item unavailable → toast chặn, yêu cầu xóa món đó |
| FR-CART-12 | Sau checkout thành công: clear cart (FE +/hoặc BE trong CheckoutHandler) |
| FR-CART-13 | Giá lưu `PriceAtAdded` tại thời điểm thêm (snapshot) |

---

## 4. Business rules / State

### Entity
```text
Cart 1──* CartItem → Product
Cart optional UserAccountId XOR GuestUserId
```

### FE state
- `CartContext` đồng bộ với API; toast khi add/update/remove.
- Empty cart vào `/checkout` → thông báo + quay trang chủ.

### Conflict
- Một số handler trả lỗi nếu cart thuộc user khác / guest id không khớp.

---

## 5. APIs chính

| Method | Route | Auth |
|--------|-------|------|
| POST | `/api/Cart` | Auth hoặc Guest |
| GET | `/api/Cart` | Auth hoặc Guest |
| PUT | `/api/Cart` | Auth hoặc Guest |
| DELETE | `/api/Cart` | Auth hoặc Guest |
| DELETE | `/api/Cart/clear` | Auth hoặc Guest |

Controller: `src/ShoppingFood.API/Controllers/CartController.cs`

---

## 6. Key files

| Tầng | Path |
|------|------|
| Controller | `src/ShoppingFood.API/Controllers/CartController.cs` |
| Handlers | `src/ShoppingFood.Application/Features/Carts/**` |
| Entities | `Domain/Models/Cart.cs`, `CartItem.cs`, `GuestUser.cs` |
| Filter guest | `API/Filters/AuthenticationFilter.cs` |
| FE Context | `ShoppingFood.FE/src/contexts/CartContext.tsx` |
| FE Hook | `hooks/useCart.ts` |
| FE Service | `services/CartService.ts` |
| FE UI | `components/layout/ShoppingDrawer.tsx` |
| FE Checkout gate | `pages/CheckoutPage.tsx` |

---

## 7. Acceptance Criteria

- [ ] Guest thêm món không login → GET cart thấy item với cùng `sf_guest_id`
- [ ] Login user thêm/sửa/xóa/clear OK
- [ ] Clear cart hiện ConfirmModal trước khi gọi API
- [ ] Item unavailable → không cho tiến tới thanh toán (toast)
- [ ] Checkout thành công → giỏ trống
- [ ] Đổi `sf_guest_id` → không thấy giỏ guest cũ

---

## 8. Cảnh báo / Thông báo hệ thống

| Message | Loại | File FE | Trigger | API | Mức độ |
|---------|------|---------|---------|-----|--------|
| Đã thêm vào giỏ: {name} | success | `contexts/CartContext.tsx` | Add item | `POST /Cart` | Info |
| Đã cập nhật số lượng: {name} | success | `CartContext.tsx` | Update qty | `PUT /Cart` | Info |
| Lỗi khi thêm vào giỏ hàng trên server | error | `CartContext.tsx` | Add fail | `POST /Cart` | Warn |
| Lỗi khi xóa món trên server | error | `CartContext.tsx` | Remove fail | `DELETE /Cart` | Warn |
| Lỗi cập nhật số lượng trên server | error | `CartContext.tsx` | Update fail | `PUT /Cart` | Warn |
| **Xóa giỏ hàng** / Bạn có chắc muốn xóa toàn bộ giỏ? | confirm | `ShoppingDrawer.tsx` ConfirmModal | Clear | `DELETE /Cart/clear` | Warn |
| Vui lòng xóa các món đã ngừng bán… trước khi thanh toán | error | `ShoppingDrawer.tsx` | Checkout blocked | — | Critical |
| Giỏ hàng trống, quay lại trang chủ | info | `CheckoutPage.tsx` | Empty cart | — | Info |

---

## 9. Tóm tắt

Cart = **1 giỏ / user hoặc guest**, CRUD qua `/api/Cart*`, FE `CartContext` + chặn checkout món ngừng bán.  
Workflow: [Cart_Workflow.md](../workflows/Cart_Workflow.md).
