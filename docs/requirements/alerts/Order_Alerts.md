# Cảnh báo — Order

> Requirements: [../Order_Requirements.md](../Order_Requirements.md) · Workflow: Checkout_Order

| ID | Message | Loại | Mức độ | Nơi hiện | File | Trigger | API |
|----|---------|------|--------|----------|------|---------|-----|
| AL-ORD-01 | Vui lòng điền đầy đủ thông tin giao hàng | error | Warn | Toast | `CheckoutPage.tsx` | Thiếu địa chỉ | — |
| AL-ORD-02 | Mã OTP đã được gửi đến email của bạn | success | Info | Toast | CheckoutPage | Guest OTP | `POST /Order/checkout/sent-otp` |
| AL-ORD-03 | Lỗi khi gửi mã OTP | error | Warn | Toast | CheckoutPage | OTP fail | sent-otp |
| AL-ORD-04 | Vui lòng nhập mã OTP | error | Warn | Toast | CheckoutPage | Guest checkout | — |
| AL-ORD-05 | Áp dụng mã giảm giá thành công | success | Info | Toast | CheckoutPage | Apply voucher | `POST /Discount/apply` |
| AL-ORD-06 | Mã giảm giá không hợp lệ | error | Warn | Toast | CheckoutPage | Bad code | apply |
| AL-ORD-07 | Đã gỡ mã giảm giá | success | Info | Toast | CheckoutPage | Remove code | — |
| AL-ORD-08 | Đã lấy vị trí hiện tại | success | Info | Toast | CheckoutPage | GPS OK | — |
| AL-ORD-09 | Không thể lấy vị trí… / Trình duyệt không hỗ trợ | error | Warn | Toast | CheckoutPage | GPS fail | — |
| AL-ORD-10 | Đơn hàng đã tạo. Quét mã QR… | success | Info | Toast | CheckoutPage | SePay checkout | `POST /Order/checkout` |
| AL-ORD-11 | Đặt hàng thành công! Mã đơn… | success | Info | Toast | CheckoutPage | COD/Wallet/confirm | checkout |
| AL-ORD-12 | Lỗi khi đặt hàng | error | Warn | Toast | CheckoutPage | Checkout fail | checkout |
| AL-ORD-13 | **Hủy đơn hàng** / Bạn có chắc muốn hủy? | confirm | Warn | ConfirmModal | `CustomerOrderDetailModal` | Cancel | `PUT /Order/cancel` |
| AL-ORD-14 | Hủy đơn hàng thành công | success | Info | Toast | CustomerOrderDetailModal | Cancel OK | cancel |
| AL-ORD-15 | Đã thêm lại các món vào giỏ hàng | success | Info | Toast | CustomerOrderDetailModal | Reorder | `POST /Order/reorder` |
| AL-ORD-16 | Gửi khiếu nại đơn / báo cáo tài xế / đánh giá tài xế thành công | success | Info | Toast | CustomerOrderDetailModal | Support actions | Support/Shipper APIs |
| AL-ORD-17 | Vui lòng nhập lý do khiếu nại | error | Warn | Toast | CustomerOrderDetailModal | Validation | — |
| AL-ORD-18 | Đã chấp nhận đơn hàng! | success | Info | Toast | `SellerOrdersPage` | Accept | `POST /Order/accept` |
| AL-ORD-19 | Đang thực hiện nấu món! | success | Info | Toast | SellerOrdersPage | Prepare | `POST /Order/prepare` |
| AL-ORD-20 | Chuẩn bị xong! Đang chờ tài xế… | success | Info | Toast | SellerOrdersPage | Waiting | `POST /Order/waiting-for-shipper` |
| AL-ORD-21 | Đã từ chối đơn hàng thành công | success | Warn | Toast | SellerOrdersPage | Reject | `POST /Order/reject` |
| AL-ORD-22 | Vui lòng nhập lý do từ chối | error | Warn | Toast | SellerOrdersPage | Reject empty | — |
| AL-ORD-23 | PromptModal hủy đơn (seller nhập lý do) | confirm | Warn | PromptModal | SellerOrdersPage | Seller cancel | `POST /Order/seller-cancel` |
| AL-ORD-24 | Đã hủy đơn hàng thành công | success | Warn | Toast | SellerOrdersPage | Seller cancel OK | seller-cancel |
| AL-ORD-25 | Xác nhận giao hàng thành công! | success | Info | Toast | SellerOrdersPage | Self-delivery | `POST .../self-delivery/confirm-success` |
| AL-ORD-26 | BE: Only pending orders can be rejected/updated | error | Warn | Toast | — | Wrong status | reject/update |
| AL-ORD-27 | BE: None of the items… available for reorder | error | Warn | Toast | — | Reorder fail | reorder |
| AL-ORD-28 | Lỗi tải chi tiết / danh sách đơn (+ lỗi mạng) | error | Warn | Toast | Order UIs | Load fail | MyOrders / details |

## Checklist QA Order Alerts

- [ ] Guest thiếu OTP → AL-ORD-04
- [ ] SePay → AL-ORD-10; COD → AL-ORD-11
- [ ] Cancel có ConfirmModal AL-ORD-13
- [ ] Seller lifecycle toasts AL-ORD-18→25
