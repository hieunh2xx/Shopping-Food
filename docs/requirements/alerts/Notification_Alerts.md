# Cảnh báo — Notification

> Requirements: [../Chat_Notification_Requirements.md](../Chat_Notification_Requirements.md)

| ID | Message | Loại | Mức độ | Nơi hiện | File | Trigger | API / Hub |
|----|---------|------|--------|----------|------|---------|-----------|
| AL-NOT-01 | `{n.title}` (icon 🔔) | info | Info | Toast | `NotificationBell.tsx` | SignalR `NotificationReceived` | `/hubs/notifications` |
| AL-NOT-02 | Đã đọc toàn bộ thông báo | success | Info | Toast | NotificationBell | Mark all read | `POST /Notification/read-all` |
| AL-NOT-03 | Gửi thông báo (broadcast) thành công | success | Info | Toast | `AdminNotificationsPage` | Broadcast | `POST /Admin/notifications/broadcast` |
| AL-NOT-04 | Vui lòng chọn Flash Sale / nhập nội dung / User ID | validation | Warn | Toast | AdminNotificationsPage | Broadcast form | — |
| AL-NOT-05 | Lỗi khi gửi thông báo / lỗi hệ thống | error | Warn | Toast | AdminNotificationsPage | Broadcast fail | broadcast |
| AL-NOT-06 | Push fail nếu user offline (chỉ lưu DB, toast khi online sau) | info | Info | — | Interceptor/Hub | Insert Notification | EF Interceptor |

**Payload đặc biệt:** một số notification kích hoạt refresh UI (profile role upgrade, payment paid, force-assign) — xem consumers trong FE (AuthContext, SepayQr, ShipperDashboard…).

## Checklist QA Notification Alerts

- [ ] Có noti mới → AL-NOT-01
- [ ] Read-all → AL-NOT-02
- [ ] Admin broadcast validate → AL-NOT-04
