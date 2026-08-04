# Cảnh báo — Shipper

> Requirements: [../Logistics_Shipper_Requirements.md](../Logistics_Shipper_Requirements.md)

| ID | Message | Loại | Mức độ | Nơi hiện | File | Trigger | API |
|----|---------|------|--------|----------|------|---------|-----|
| AL-SHP-01 | Bạn đã BẬT/TẮT trạng thái trực tuyến! | success | Info | Toast | `ShipperDashboard` | Toggle online | `POST /Shipper/toggle-online` |
| AL-SHP-02 | Tài khoản bị khóa / tạm khóa … phút. Lý do: … | error | Critical | Toast | — | Suspended | toggle-online |
| AL-SHP-03 | Vui lòng bật online để nhận đơn | error | Warn | Toast | ShipperDashboard | Accept khi offline | — |
| AL-SHP-04 | Shippers must switch to online… | error | Warn | Toast | — | available-offers offline | GET available-offers |
| AL-SHP-05 | Nhận đơn / Đã chấp nhận đơn thành công | success | Info | Toast | ShipperDashboard | Accept offer | `POST /Shipper/accept-offer` |
| AL-SHP-06 | Đã từ chối đơn | success | Warn | Toast | ShipperDashboard | Reject | `POST /Shipper/reject-offer` |
| AL-SHP-07 | Đã hết thời gian phản hồi đề xuất | error | Warn | Toast | ShipperDashboard | Offer timeout | — |
| AL-SHP-08 | Force assign / thu hồi đơn (từ notification) | success/error | Warn | Toast | ShipperDashboard | SignalR | Coordinator |
| AL-SHP-09 | Chúc mừng! Giao hàng thành công. | success | Info | Toast | `SuccessDeliveryModal` | Delivered | `POST /Shipper/confirm-delivered` |
| AL-SHP-10 | Vui lòng tải ảnh chứng minh giao hàng | validation | Warn | Toast | SuccessDeliveryModal | Missing proof | — |
| AL-SHP-11 | PromptModal báo cáo giao thất bại | confirm | Warn | PromptModal | ShipperDashboard | Failed | `POST /Shipper/confirm-failed` |
| AL-SHP-12 | Đã báo cáo giao hàng thất bại | error* | Warn | Toast | ShipperDashboard | Failed OK | confirm-failed |
| AL-SHP-13 | Gửi báo cáo sự cố thành công… | success | Info | Toast | `ReportIncidentModal` | Incident | `POST /Shipper/Orders/{id}/report` |
| AL-SHP-14 | Vui lòng nhập chi tiết sự cố | validation | Warn | Toast | ReportIncidentModal | Empty | — |
| AL-SHP-15 | Cập nhật lịch/khu vực thành công | success | Info | Toast | `ShipperProfilePage` | Schedule | `PUT /Shipper/schedule-area` |
| AL-SHP-16 | Lỗi tải lịch sử điểm uy tín | error | Warn | Toast | `ShipperReputationTab` | Load | `/Shipper/ReputationHistory` |
| AL-SHP-17 | Đã nộp … công nợ COD | success | Info | Toast | PartnerWalletPages | Repay | `/Payment/shipper/repay-debt` |
| AL-SHP-18 | Đăng ký tài xế / apply thành công | success | Info | Toast | ShipperApply pages | Apply | register-shipper / apply-shipper |

\*AL-SHP-12 hiện dùng `toast.error` dù là kết quả thao tác thành công — nên cân nhắc đổi success/info.

## Checklist QA Shipper Alerts

- [ ] Offline → AL-SHP-03/04
- [ ] Suspended → AL-SHP-02
- [ ] Delivered cần ảnh → AL-SHP-10
- [ ] COD repay → AL-SHP-17
