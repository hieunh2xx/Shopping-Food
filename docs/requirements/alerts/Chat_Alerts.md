# Cảnh báo — Chat

> Requirements: [../Chat_Notification_Requirements.md](../Chat_Notification_Requirements.md)

| ID | Message | Loại | Mức độ | Nơi hiện | File | Trigger | API / Hub |
|----|---------|------|--------|----------|------|---------|-----------|
| AL-CHAT-01 | Nhân viên hỗ trợ đã tham gia cuộc trò chuyện | success | Info | Toast | `LiveChatWidget` | SupportJoined | `/hubs/chat` |
| AL-CHAT-02 | Phiên chat đã kết thúc | info | Info | Toast | LiveChatWidget | SessionClosed | Hub |
| AL-CHAT-03 | Không kết nối được chat realtime. Thử lại sau. | error | Critical | Toast | LiveChatWidget | Hub fail | `/hubs/chat` |
| AL-CHAT-04 | Không tạo được phiên chat | error | Warn | Toast | LiveChatWidget | Create session | `POST /Chat/sessions` |
| AL-CHAT-05 | Tải lịch sử / mở phiên / gửi tin thất bại (mạng) | error | Warn | Toast | LiveChatWidget | Network | Chat REST |
| AL-CHAT-06 | Khách chưa gửi tin nhắn về đơn này | info | Info | Toast | `OrderSellerChatModal` | Empty order chat | — |
| AL-CHAT-07 | Không mở được chat với người bán / gửi thất bại | error | Warn | Toast | OrderSellerChatModal | Order chat | `/Chat/sessions/order/{id}` |
| AL-CHAT-08 | Không thể tải DS tin / mở phiên / gửi (seller) | error | Warn | Toast | `SellerChatPage` | Seller inbox | Chat APIs |
| AL-CHAT-09 | Unauthorized khi claim/session (sai role) | error | Critical | Toast | — | Claim | `POST .../claim` |

## Checklist QA Chat Alerts

- [ ] Mất SignalR → AL-CHAT-03
- [ ] Support join → AL-CHAT-01
- [ ] Close session → AL-CHAT-02
