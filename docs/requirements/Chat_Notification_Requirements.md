# Requirements: Chat & Notification (Realtime)

Tài liệu **yêu cầu nghiệp vụ** cho chat hỗ trợ / chat theo đơn và hệ thống thông báo (REST + SignalR + EF interceptor).

> Workflow: [../workflows/Chat_Notification_Workflow.md](../workflows/Chat_Notification_Workflow.md)

---

## 1. Mục tiêu nghiệp vụ

1. **Chat support** (Customer ↔ Admin/Coordinator) và **chat theo đơn** (Customer ↔ Seller).
2. REST quản lý session/messages/claim; **SignalR** realtime gửi/nhận.
3. **Notification** inbox REST + push realtime khi insert DB (interceptor).
4. Admin **broadcast** thông báo hàng loạt.

---

## 2. Actors & quyền

| Actor | Quyền |
|-------|--------|
| **Customer** | Mở session support / order chat; đọc noti |
| **Seller / Mall** | Inbox order chats; JoinSellerInbox |
| **Admin / Coordinator** | Claim session; JoinAdmin/Coordinator group; broadcast noti |
| **System** | `NotificationPushInterceptor` → Hub group `user_{id}` |

---

## 3. Functional Requirements

### FR-CHAT-01 — REST Chat

| ID | Requirement |
|----|-------------|
| FR-CHAT-01 | `POST /api/Chat/sessions` — mở session support (topic OrderIssue/…) |
| FR-CHAT-02 | `POST /api/Chat/sessions/order/{orderId}` — session gắn đơn + quán |
| FR-CHAT-03 | `GET /api/Chat/sessions` — list (role-dependent) |
| FR-CHAT-04 | `GET /api/Chat/sessions/current` — session đang mở |
| FR-CHAT-05 | `GET /api/Chat/sessions/my` — của user |
| FR-CHAT-06 | `GET /api/Chat/sessions/seller/orders` — inbox seller |
| FR-CHAT-07 | `GET /api/Chat/sessions/{sessionId}/messages` — lịch sử |
| FR-CHAT-08 | `POST /api/Chat/sessions/{sessionId}/claim` — agent nhận phiên |
| FR-CHAT-09 | Status: Open / Closed; đóng qua Hub/service `ChatSessionCloseService` |

### FR-CHAT-02 — SignalR ChatHub

| ID | Requirement |
|----|-------------|
| FR-CHAT-20 | Hub path: `/hubs/chat` (`API/Hubs/ChatHub.cs`) |
| FR-CHAT-21 | Invoke: JoinSession, SendMessage, ClaimSession, CloseSession, JoinSellerInbox, JoinAdminGroup, JoinCoordinatorGroup |
| FR-CHAT-22 | Events: ReceiveMessage, NewSession, SupportJoined, SessionClosed, OrderChatMessage |
| FR-CHAT-23 | FE: `ChatService.ts`, `LiveChatWidget`, `SupportChatDashboard`, `OrderSellerChatModal`, `SellerChatPage` |

### FR-NOT-01 — REST Notification

| ID | Requirement |
|----|-------------|
| FR-NOT-01 | `GET /api/Notification` — inbox user hiện tại |
| FR-NOT-02 | `POST /api/Notification/{id}/read` — đánh dấu đọc |
| FR-NOT-03 | `POST /api/Notification/read-all` — đọc hết |
| FR-NOT-04 | Types: System, Order, Delivery, Loyalty, Review |
| FR-NOT-05 | Admin `POST /api/Admin/notifications/broadcast` — gửi hàng loạt (AllCustomers / ByTier / SpecificUsers / gắn FlashSale…) |

### FR-NOT-02 — Realtime push

| ID | Requirement |
|----|-------------|
| FR-NOT-10 | Hub: `/hubs/notifications` — `JoinUser(userId)` → group `user_{id}` |
| FR-NOT-11 | Insert `Notification` → `NotificationPushInterceptor` → `INotificationPushService` → event `NotificationReceived` |
| FR-NOT-12 | FE `NotificationBell` toast title + icon 🔔; `NotificationRealtimeService` |
| FR-NOT-13 | AuthContext có thể refetch profile khi nhận noti (role upgrade…) |

---

## 4. API & Hub surface

| Method | Route / Path | Việc |
|--------|--------------|------|
| POST | `/api/Chat/sessions` | Support session |
| POST | `/api/Chat/sessions/order/{orderId}` | Order chat |
| GET | `/api/Chat/sessions*` | List/current/my/seller |
| GET | `/api/Chat/sessions/{id}/messages` | Messages |
| POST | `/api/Chat/sessions/{id}/claim` | Claim |
| — | `/hubs/chat` | Realtime chat |
| GET | `/api/Notification` | Inbox |
| POST | `/api/Notification/{id}/read` | Read one |
| POST | `/api/Notification/read-all` | Read all |
| POST | `/api/Admin/notifications/broadcast` | Broadcast |
| — | `/hubs/notifications` | Realtime noti |

---

## 5. Key files

| Vai trò | File |
|---------|------|
| Controllers | `ChatController.cs`, `NotificationController.cs` |
| Hubs | `API/Hubs/ChatHub.cs`, `NotificationHub.cs` |
| Push | `Repository/Interceptors/NotificationPushInterceptor.cs`, `API/Services/NotificationPushService.cs` |
| Close | `Application/Services/ChatSessionCloseService.cs` |
| Entities | `ChatSession`, `ChatMessage`, `Notification` |
| FE | `ChatService.ts`, `NotificationService.ts`, `NotificationRealtimeService.ts`, `NotificationBell.tsx`, `LiveChatWidget.tsx`, chat dashboards |

---

## 6. Acceptance Criteria

- [ ] Customer mở LiveChat → session Open; Agent claim → SupportJoined toast
- [ ] Gửi tin REST/Hub xuất hiện realtime 2 phía
- [ ] Order chat: Customer ↔ Seller inbox
- [ ] Insert Notification → Bell nhận trong vài giây (đã JoinUser)
- [ ] Mark read / read-all cập nhật UI
- [ ] Broadcast Admin tạo nhiều Notification + push
- [ ] Close session → SessionClosed event

---

## 7. Cảnh báo / Thông báo hệ thống

| Message | Loại | File | Trigger | API/Hub | Mức độ |
|---------|------|------|---------|---------|--------|
| Nhân viên hỗ trợ đã tham gia cuộc trò chuyện | success | `LiveChatWidget.tsx` | SupportJoined | `/hubs/chat` | Info |
| Phiên chat đã kết thúc | info | `LiveChatWidget.tsx` | SessionClosed | Hub | Info |
| Không kết nối được chat realtime. Thử lại sau. | error | `LiveChatWidget.tsx` | Hub fail | `/hubs/chat` | Error |
| Không tạo được phiên chat / gửi tin thất bại… | error | `LiveChatWidget.tsx` | REST/Hub | `/Chat/sessions*` | Error |
| Tải lịch sử chat thất bại… | error | `LiveChatWidget.tsx` | Load messages | messages API | Error |
| Khách chưa gửi tin nhắn về đơn này | info | `OrderSellerChatModal.tsx` | Empty order chat | — | Info |
| Không mở được chat với người bán / gửi thất bại | error | `OrderSellerChatModal.tsx` | Order chat | `sessions/order/{id}` | Error |
| Không thể tải DS tin / mở phiên / gửi | error | `SellerChatPage.tsx` | Seller inbox | Chat APIs | Error |
| `{n.title}` (🔔) | info | `NotificationBell.tsx` | NotificationReceived | `/hubs/notifications` | Info |
| Đã đọc toàn bộ thông báo | success | `NotificationBell.tsx` | Mark all | `POST /Notification/read-all` | Info |
| Gửi thông báo thành công | success | `AdminNotificationsPage.tsx` | Broadcast | `POST /Admin/notifications/broadcast` | Info |
| Vui lòng chọn Flash Sale / nhập nội dung / User ID | error | `AdminNotificationsPage.tsx` | Validation | — | Warning |
| SePay đã xác nhận thanh toán qua webhook! | success | `SepayQrPaymentModal.tsx` | Payment noti | Hub + Payment | Info |

---

## 8. Liên kết

- Workflow: [../workflows/Chat_Notification_Workflow.md](../workflows/Chat_Notification_Workflow.md)  
- Payment realtime: [Payment_Requirements.md](./Payment_Requirements.md)  
- Admin broadcast: [Support_Admin_Requirements.md](./Support_Admin_Requirements.md)  
