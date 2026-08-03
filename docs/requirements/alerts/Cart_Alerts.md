# Cảnh báo — Cart

> Requirements: [../Cart_Requirements.md](../Cart_Requirements.md)

| ID | Message | Loại | Mức độ | Nơi hiện | File | Trigger | API |
|----|---------|------|--------|----------|------|---------|-----|
| AL-CART-01 | Đã thêm vào giỏ: {name} | success | Info | Toast | `CartContext.tsx` | Add | `POST /Cart` |
| AL-CART-02 | Đã cập nhật số lượng: {name} | success | Info | Toast | CartContext | Update | `PUT /Cart` |
| AL-CART-03 | Lỗi khi thêm vào giỏ hàng trên server | error | Warn | Toast | CartContext | Add fail | `/Cart` |
| AL-CART-04 | Lỗi khi xóa món trên server | error | Warn | Toast | CartContext | Remove | `DELETE /Cart` |
| AL-CART-05 | Lỗi cập nhật số lượng trên server | error | Warn | Toast | CartContext | Update fail | `PUT /Cart` |
| AL-CART-06 | **Xóa giỏ hàng** / Bạn có chắc muốn xóa toàn bộ? | confirm | Warn | ConfirmModal | `ShoppingDrawer.tsx` | Clear | `DELETE /Cart/clear` |
| AL-CART-07 | Vui lòng xóa các món đã ngừng bán… trước khi thanh toán | error | Warn | Toast | ShoppingDrawer | Checkout blocked | — |
| AL-CART-08 | Giỏ hàng trống, quay lại trang chủ | info | Info | Toast | `CheckoutPage.tsx` | Empty cart | — |

## Checklist QA Cart Alerts

- [ ] Add món → AL-CART-01
- [ ] Clear → Confirm AL-CART-06
- [ ] Item unavailable → AL-CART-07 chặn checkout
