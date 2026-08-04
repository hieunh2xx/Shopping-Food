# Cảnh báo — Payment

> Requirements: [../Payment_Requirements.md](../Payment_Requirements.md) · [../Revenue_Split_Requirements.md](../Revenue_Split_Requirements.md)

| ID | Message | Loại | Mức độ | Nơi hiện | File | Trigger | API |
|----|---------|------|--------|----------|------|---------|-----|
| AL-PAY-01 | Đơn hàng đã tạo. Quét mã QR… | success | Info | Toast | `CheckoutPage` | SePay checkout | `/Order/checkout` |
| AL-PAY-02 | Đặt hàng thành công!… | success | Info | Toast | CheckoutPage | COD/Wallet | checkout |
| AL-PAY-03 | Số dư ví không đủ. Vui lòng nạp thêm tiền. | error | Warn | Toast | Checkout | Wallet thiếu | ProcessCheckoutPayment |
| AL-PAY-04 | Ví hệ thống chỉ dành cho khách đã đăng nhập. | error | Warn | Toast | Checkout | Guest + Wallet | checkout |
| AL-PAY-05 | Cổng thanh toán SePay chưa được cấu hình. | error | Critical | Toast | Checkout | SePay off | checkout |
| AL-PAY-06 | Chưa cấu hình tài khoản ngân hàng SePay… | error | Critical | Toast | Checkout | No bank | checkout |
| AL-PAY-07 | SePay đã xác nhận thanh toán qua webhook! | success | Info | Toast | `SepayQrPaymentModal` | SignalR/status paid | webhook |
| AL-PAY-08 | Mã QR đã hết hạn | error | Warn | Toast | SepayQrPaymentModal | Expired | session/status |
| AL-PAY-09 | Đã sao chép nội dung chuyển khoản | success | Info | Toast | SepayQrPaymentModal | Copy | — |
| AL-PAY-10 | Đang đồng bộ từ SePay… | loading | Info | Toast | SepayQrPaymentModal | Reconcile | `POST .../reconcile` |
| AL-PAY-11 | Đã xác nhận… / Chưa thấy giao dịch… | success/error | Info/Warn | Toast | SepayQrPaymentModal | Reconcile result | reconcile |
| AL-PAY-12 | Đã đồng bộ thanh toán từ SePay | success | Info | Toast | `PaymentResultPages` | Result reconcile | reconcile |
| AL-PAY-13 | Thiếu mã phiên thanh toán | error | Warn | Toast | `SepayRedirectPage` | Missing sessionId | — |
| AL-PAY-14 | Số tiền nạp tối thiểu 10.000đ | error | Warn | Toast | `CustomerWalletPage` | Top-up validate | — |
| AL-PAY-15 | Đang chuyển hướng sang trang thanh toán… | success | Info | Toast | CustomerWalletPage | Top-up OK | `POST /Payment/wallet/top-up` |
| AL-PAY-16 | Số tiền rút tối thiểu 50.000đ | error | Warn | Toast | `PartnerWalletPages` | Withdraw validate | — |
| AL-PAY-17 | Yêu cầu rút tiền đã được gửi | success | Info | Toast | PartnerWalletPages | Withdraw OK | `POST /Payment/withdraw` |
| AL-PAY-18 | Đã nộp … công nợ COD | success | Info | Toast | PartnerWalletPages | Repay | `POST /Payment/shipper/repay-debt` |
| AL-PAY-19 | Nhập số tiền hợp lệ / điền đầy đủ… | validation | Warn | Toast | PartnerWalletPages | Form | — |
| AL-PAY-20 | Đã duyệt / Đã từ chối (rút tiền) | success | Info | Toast | `AdminFinancePage` | Approve withdraw | `POST /Payment/withdrawals/approve` |
| AL-PAY-21 | Customer gọi withdraw → 403 | error | Warn | Toast | — | Wrong role | withdraw |
| AL-PAY-22 | Confirm Sepay bị từ chối (không confirm tay) | error | Critical | Toast | — | `POST /Payment/confirm` + Sepay | confirm |
| AL-PAY-23 | Webhook/IPN secret sai → không Paid | error | Critical | Server log | SepayHandlers | Bad auth | `/ipn`, `/webhook` |
| AL-PAY-24 | Amount mismatch >1₫ → không confirm | error | Critical | Server | Orchestration | Sai tiền | webhook/reconcile |

## Checklist QA Payment Alerts

- [ ] Wallet thiếu tiền → AL-PAY-03
- [ ] QR hết hạn → AL-PAY-08
- [ ] Webhook OK → AL-PAY-07
- [ ] Top-up <10k → AL-PAY-14; Withdraw <50k → AL-PAY-16
