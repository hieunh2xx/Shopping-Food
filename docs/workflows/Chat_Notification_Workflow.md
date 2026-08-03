# Tài liệu Quy trình: Chat & Notification (Realtime)

Tài liệu mô tả **Chat REST + SignalR ChatHub** và **Notification REST + NotificationHub + EF Interceptor + NotificationBell**.

---


---

## Phần A — UI Interaction Trace (Nút bấm → Code → Data → Hiển thị)

> UI Trace — Chat / Notification  
> Mỗi thao tác trả lời: **nút ở đâu** · **bấm chạy file/hàm nào** · **API/BE đâu** · **data trả về** · **hiển thị thế nào**.


---

### UT-CHAT-01 — Mở widget Live Chat (FAB)

#### 1. Giao diện

| Mục | Giá trị |
|-----|---------|
| **Component** | `components/chat/LiveChatWidget.tsx` (thường trong MainLayout) |
| **Nút** | Floating button `onClick={() => setIsOpen(true)}` |
| **Event ngoài** | `window` event `openLiveChat` cũng mở widget |

#### 2. Frontend (khi mở / chọn topic)

```text
setIsOpen(true) → view history hoặc create
handleStartChat(topic)
  → chatService.createSession({ topic }) → POST /Chat/sessions
  → chatService.startConnection + JoinSession (SignalR /hubs/chat)
```

#### 5. Hiển thị

Panel chat mở; list sessions; lỗi toast `Không tạo được phiên chat` / mạng; SignalR fail → toast realtime.

---

### UT-CHAT-02 — Gửi tin nhắn

#### 1. Giao diện

`<form onSubmit={handleSendMessage}>` trong session view.

#### 2. Frontend

```text
handleSendMessage
  → chatService.sendMessage (Hub invoke SendMessage) 
    và/hoặc REST tùy impl
  → append message local / nhận lại qua onReceiveMessage
```

#### 5. Hiển thị

Bubble tin nhắn mới trong list; fail → toast gửi thất bại; `SupportJoined` → toast `Nhân viên hỗ trợ đã tham gia...`; `SessionClosed` → toast phiên kết thúc.

---

### UT-CHAT-03 — OrderSellerChatModal (chat theo đơn)

#### 1. Giao diện

Modal từ order detail / seller orders — mở chat order.

#### 2–3.

```text
POST /Chat/sessions/order/{orderId}
  → load messages GET /Chat/sessions/{id}/messages
  → SignalR JoinSession
```

#### 5. Hiển thị

| Empty | toast/info `Khách chưa gửi tin nhắn về đơn này` |
| Error | không mở được chat / gửi thất bại |

Seller inbox: `SellerChatPage` — `GET /Chat/sessions/seller/orders`.

---

### UT-NOT-01 — Mở chuông thông báo

#### 1. Giao diện

| Mục | Giá trị |
|-----|---------|
| **Component** | `components/layout/NotificationBell.tsx` (Header) |
| **Nút** | Bell icon `onClick={handleToggle}` |

#### 2. Frontend

```text
handleToggle → setOpen dropdown
  → (đã load) notificationService.getList → GET /Notification
Realtime: NotificationRealtimeService → Hub /hubs/notifications
  → event NotificationReceived → toast(n.title, { icon:'🔔' }) + prepend list
```

#### 5. Hiển thị

Dropdown list unread badge; toast realtime khi có noti mới.

---

### UT-NOT-02 — Đánh dấu đọc / Đọc tất cả

#### 1. Giao diện

| Click 1 noti | `handleNotificationClick` → nếu chưa đọc `handleMarkAsRead` → mở detail modal |
| Nút đọc hết | `handleMarkAllAsRead` |

#### 2–3.

```text
POST /Notification/{id}/read
POST /Notification/read-all
```

#### 5. Hiển thị

| Read one | bỏ badge item; có thể `handleNavigateFromModal` điều hướng theo target |
| Read all | toast `Đã đọc toàn bộ thông báo` + clear unread |

---

## Sơ đồ Bell

```mermaid
sequenceDiagram
    participant Bell as NotificationBell
    participant Hub as /hubs/notifications
    participant API as NotificationController
    Hub-->>Bell: NotificationReceived
    Bell->>Bell: toast title
    Bell->>API: GET list / POST read
    API-->>Bell: update UI
```


---

## Phần B — Workflow nghiệp vụ & Backend (chi tiết luồng)
## 1. Luồng Tổng Quan (Workflow)

### Chat

1. User/Seller mở chat → REST tạo session (`POST /api/Chat/sessions` hoặc `/sessions/order/{orderId}`).
2. Controller broadcast `NewSession` tới group `Support_Admin` hoặc `Support_Coordinator` (theo topic).
3. Client kết nối hub `/hubs/chat` → `JoinSession` / `JoinSellerInbox` / `JoinAdminGroup`…
4. Gửi tin: Hub `SendMessage` → lưu `CHAT_MESSAGE` → `ReceiveMessage` tới group; blacklist filter nội dung.
5. Agent `POST /sessions/{id}/claim` nhận phiên.

### Notification

1. Handler/business insert entity `Notification`.
2. `SaveChanges` → `NotificationPushInterceptor` → `INotificationPushService` → Hub group `user_{id}`.
3. FE `NotificationRealtimeService` nhận `NotificationReceived` → `NotificationBell` toast 🔔 + cập nhật list.
4. Đọc: `GET /api/Notification`, `POST /{id}/read`, `POST /read-all`.

```mermaid
sequenceDiagram
    participant FE as LiveChat / NotificationBell
    participant REST as ChatController / NotificationController
    participant HubC as ChatHub /hubs/chat
    participant HubN as NotificationHub /hubs/notifications
    participant IX as NotificationPushInterceptor
    participant DB as CHAT_* / NOTIFICATION

    FE->>REST: POST /api/Chat/sessions
    REST->>DB: Insert ChatSession
    REST->>HubC: NewSession → Support_* group
    FE->>HubC: JoinSession + SendMessage
    HubC->>DB: ChatMessage
    HubC-->>FE: ReceiveMessage

    Note over DB,IX: Business insert Notification
    DB->>IX: SavedChangesAsync
    IX->>HubN: Push user_{id}
    HubN-->>FE: NotificationReceived
    FE->>REST: GET /api/Notification / read
```

---

## Bước 1: Chat REST

**Controller:** `src/ShoppingFood.API/Controllers/ChatController.cs`  
**FE:** `ChatService.ts`, `LiveChatWidget.tsx`, `SupportChatDashboard.tsx`, `OrderSellerChatModal.tsx`, `SellerChatPage.tsx`, Admin/Coordinator chat pages.

| Method | Route | Việc |
|--------|-------|------|
| POST | `/api/Chat/sessions` | Mở session support |
| POST | `/api/Chat/sessions/order/{orderId}` | Chat theo đơn |
| GET | `/api/Chat/sessions/seller/orders` | Inbox seller |
| GET | `/api/Chat/sessions` | List (agent) |
| GET | `/api/Chat/sessions/current` | Session hiện tại |
| GET | `/api/Chat/sessions/my` | Sessions của user |
| GET | `/api/Chat/sessions/{sessionId}/messages` | Lịch sử |
| POST | `/api/Chat/sessions/{sessionId}/claim` | Agent claim |

**Tạo session + SignalR notify:**

```csharp
[HttpPost("sessions")]
public async Task<ActionResult<ApiResponse>> CreateSession([FromBody] CreateChatSessionCommand command)
{
    if (userDto != null) command.CurrentUserId = userDto.Id;
    var response = await _mediator.Send(command);

    if (!response.Error && response.Data != null)
    {
        var data = Newtonsoft.Json.Linq.JObject.FromObject(response.Data);
        var topicStr = data["topic"]?.ToString();
        var supportGroup = (topicStr == "SystemIssue" || topicStr == "General")
            ? "Support_Admin"
            : "Support_Coordinator";
        await _hubContext.Clients.Group(supportGroup).SendAsync("NewSession", response.Data);
    }
    return StatusCode(response.Code, response);
}
```

**FE:**

```typescript
async createSession(data: ICreateChatSessionRequest) { ... }
async createOrderSession(orderId: string) { ... }
async getHistory(sessionId: string) { ... }
```

**DB:** `CHAT_SESSION`, `CHAT_MESSAGE`.  
**Enums:** `ChatTopic` (OrderIssue, OrderCancellation, SystemIssue, General), `ChatSessionStatus` Open/Closed.

---

## Bước 2: ChatHub (SignalR)

**Path:** `/hubs/chat` (map trong `Program.cs`)  
**File:** `src/ShoppingFood.API/Hubs/ChatHub.cs`

| Invoke | Việc |
|--------|------|
| `JoinSession(sessionId)` | Vào group session |
| `LeaveSession` | Rời group |
| `JoinCoordinatorGroup` | Group `Support_Coordinator` |
| `JoinAdminGroup` | Group `Support_Admin` |
| `JoinSellerInbox(restaurantId)` | Group `seller_{restaurantId}` |
| `SendMessage(sessionId, senderId, senderRole, content)` | Lưu message + broadcast |
| Claim / Close (nếu có trên hub) | Đóng/nhận phiên realtime |

```csharp
public async Task JoinSession(string sessionId)
{
    await Groups.AddToGroupAsync(Context.ConnectionId, sessionId);
}

public async Task SendMessage(string sessionId, string senderId, string senderRole, string content)
{
    // validate Guid, blacklist filter, insert ChatMessage, Clients.Group.SendAsync("ReceiveMessage", ...)
}
```

**FE client:** `ChatService.ts` dùng `@microsoft/signalr` → events `ReceiveMessage`, `NewSession`, `SupportJoined`, `SessionClosed`, `OrderChatMessage`.

**Bảo mật chat:** `BlacklistFilterService` lọc từ khóa khi gửi tin.

---

## Bước 3: Notification REST

**Controller:** `NotificationController.cs`

```csharp
[HttpGet]
public async Task<IActionResult> GetNotifications()
{
    var query = new GetNotificationsQuery();
    query.CurrentUserId = userDto?.Id;
    var response = await _mediator.Send(query);
    return Ok(response);
}

[HttpPost("{id}/read")]
public async Task<IActionResult> MarkAsRead(Guid id) { ... }

[HttpPost("read-all")]
public async Task<IActionResult> MarkAllAsRead() { ... }
```

**FE:** `NotificationService.ts` — getAll / mark read / read-all.  
**Admin broadcast:** `POST /api/Admin/notifications/broadcast`.

---

## Bước 4: NotificationHub + Interceptor

**Hub:** `/hubs/notifications` — `NotificationHub.cs`

```csharp
public async Task JoinUser(string userId)
{
    if (Guid.TryParse(userId, out _))
        await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");
}
```

**Interceptor:** `Repository/Interceptors/NotificationPushInterceptor.cs`

- Bắt entities `Notification` Added trong `SavingChangesAsync`
- Sau `SavedChangesAsync` → resolve `INotificationPushService` → push tới group user

**Push service:** `API/Services/NotificationPushService.cs` → `Clients.Group($"user_{id}").SendAsync("NotificationReceived", ...)`.

**FE:**  
- `NotificationRealtimeService.ts` — start connection, JoinUser  
- `NotificationBell.tsx` — `toast(n.title, { icon: '🔔' })`, dropdown, mark read  
- Custom event `ON_REALTIME_NOTIFICATION` để Cart/Order/Applications refresh

---

## Call chain

```text
LiveChatWidget / SupportChatDashboard / NotificationBell
  ↓
ChatService (REST + Hub) / NotificationService + NotificationRealtimeService
  ↓
ChatController + ChatHub | NotificationController + NotificationHub
  ↓
Features/Chat | Features/Notifications | Insert Notification anywhere
  ↓
NotificationPushInterceptor → NotificationPushService
  ↓
CHAT_SESSION / CHAT_MESSAGE / NOTIFICATION
```

| File | Vai trò |
|------|---------|
| `API/Controllers/ChatController.cs` | REST chat |
| `API/Hubs/ChatHub.cs` | Realtime chat |
| `API/Controllers/NotificationController.cs` | Inbox REST |
| `API/Hubs/NotificationHub.cs` | Realtime noti |
| `Repository/Interceptors/NotificationPushInterceptor.cs` | Auto-push |
| `FE/components/layout/NotificationBell.tsx` | UI + toast |
| `FE/services/ChatService.ts` | Client chat |

---

## Toast / Message

| Message | Nơi | Trigger |
|---------|-----|---------|
| toast(title, 🔔) | NotificationBell | SignalR NotificationReceived |
| Đã đọc toàn bộ thông báo | NotificationBell | read-all OK |
| Lỗi gửi tin / session | LiveChat / OrderSellerChat | Hub/REST fail |
| Broadcast Admin | AdminNotificationsPage | broadcast API |

---

## Bảo mật

1. Chat/Notification REST cần JWT (trừ khi seeder để public — mặc định Auth).
2. Hub nên truyền access token (FE SignalR options).
3. Blacklist keyword trên nội dung chat.
4. Chỉ join group user của chính mình (JoinUser với userId hiện tại).
5. Claim session chỉ role support/admin/coordinator (RBAC + handler).

---

## Checklist

- [ ] Tạo session → agent nhận NewSession
- [ ] JoinSession + SendMessage 2 phía thấy ReceiveMessage
- [ ] Order chat seller inbox
- [ ] Insert Notification → Bell toast không cần F5
- [ ] Mark read / read-all cập nhật UI
- [ ] Blacklist chặn từ cấm trong chat

---

## Tóm tắt

Chat = **REST session + Hub message**. Notification = **DB insert → Interceptor → Hub → Bell**. Hai hub: `/hubs/chat`, `/hubs/notifications`.

> [Support_Admin_Workflow.md](./Support_Admin_Workflow.md) · [README](./README.md)
