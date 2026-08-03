# Requirements: Logistics — Coordinator (Điều phối)

Tài liệu **yêu cầu nghiệp vụ** cho điều phối viên: bảng điều phối, broadcast, force-assign, release, sự cố, giám sát/treo shipper, chỉnh uy tín.

> Workflow: [../workflows/Coordinator_Dispatch_Workflow.md](../workflows/Coordinator_Dispatch_Workflow.md)  
> Shipper side: [Logistics_Shipper_Requirements.md](./Logistics_Shipper_Requirements.md)

---

## 1. Mục tiêu nghiệp vụ

1. Hiển thị **dispatch board** các đơn chờ shipper.
2. **Gợi ý shipper**, **broadcast** gần khu vực, tạo **proposal**, **force-assign**.
3. **Release** đơn / **resolve-incident**.
4. **Monitor** shipper; **suspend**; **adjust-reputation**.
5. Xem **dispatch-history**, **incidents**, **complaints/orders**.

---

## 2. Actors & quyền

| Actor | Quyền |
|-------|--------|
| **Coordinator** | Toàn bộ `/api/Coordinator/*` (RBAC) |
| **Admin** | Cùng quyền Coordinator (+ FE `/coordinator/*` cho phép Admin) |
| **Shipper** | Nhận đề xuất / notification từ broadcast & force-assign |

---

## 3. Functional Requirements

### FR-CRD-01 — Dispatch board

| ID | Requirement |
|----|-------------|
| FR-CRD-01 | `GET /api/Coordinator/orders` — đơn chờ điều phối (vd WaitingForShipper / chưa gán) |
| FR-CRD-02 | `GET /api/Coordinator/orders/{orderId}/suggested-shippers` — gợi ý theo khoảng cách/online |
| FR-CRD-03 | FE: `DispatchBoardPage.tsx` |

### FR-CRD-02 — Gán & broadcast

| ID | Requirement |
|----|-------------|
| FR-CRD-10 | `POST /api/Coordinator/proposals` — tạo OrderDeliveryProposal |
| FR-CRD-11 | `POST /api/Coordinator/orders/{orderId}/broadcast` — thông báo shipper online gần; nếu không có ai → message *"Không có tài xế nào trực tuyến…"* |
| FR-CRD-12 | `POST /api/Coordinator/orders/force-assign` — gán bắt buộc (ghi DispatchHistory ManualAssigned) |
| FR-CRD-13 | Broadcast yêu cầu có tọa độ quán; thiếu → 400 |
| FR-CRD-14 | Đơn đã gán / sai status → không broadcast |

### FR-CRD-03 — Release & incident

| ID | Requirement |
|----|-------------|
| FR-CRD-20 | `POST /api/Coordinator/orders/{orderId}/release` — nhả shipper / trả đơn về pool |
| FR-CRD-21 | `POST /api/Coordinator/orders/{orderId}/resolve-incident` — xử lý sự cố trên đơn |
| FR-CRD-22 | `GET /api/Coordinator/incidents` — danh sách sự cố |
| FR-CRD-23 | `POST /api/Coordinator/complaint/{reportId}/resolve` — resolve khiếu nại |
| FR-CRD-24 | `GET /api/Coordinator/complaints/orders` — khiếu nại đơn |

### FR-CRD-04 — Monitor shipper

| ID | Requirement |
|----|-------------|
| FR-CRD-30 | `GET /api/Coordinator/shippers/monitoring` — online, vị trí, debt, reputation… |
| FR-CRD-31 | `POST /api/Coordinator/shippers/{shipperId}/suspend` — tạm khóa nhận đơn (phút) hoặc khóa dài |
| FR-CRD-32 | `POST /api/Coordinator/shippers/{shipperId}/adjust-reputation` — cộng/trừ điểm + lịch sử |
| FR-CRD-33 | Admin cũng có `PUT /api/Admin/shippers/{id}/suspend` |

### FR-CRD-05 — History

| ID | Requirement |
|----|-------------|
| FR-CRD-40 | `GET /api/Coordinator/orders/{orderId}/dispatch-history` |
| FR-CRD-41 | `GET /api/Coordinator/orders/dispatch-history` — lịch sử tổng |

---

## 4. API surface

| Method | Route | Việc |
|--------|-------|------|
| GET | `/api/Coordinator/orders` | Board |
| GET | `/api/Coordinator/orders/{orderId}/suggested-shippers` | Gợi ý |
| POST | `/api/Coordinator/orders/{orderId}/broadcast` | Broadcast |
| POST | `/api/Coordinator/proposals` | Tạo proposal |
| POST | `/api/Coordinator/orders/force-assign` | Gán bắt buộc |
| POST | `/api/Coordinator/orders/{orderId}/release` | Nhả đơn |
| POST | `/api/Coordinator/orders/{orderId}/resolve-incident` | Resolve incident đơn |
| GET | `/api/Coordinator/shippers/monitoring` | Giám sát |
| POST | `/api/Coordinator/shippers/{id}/suspend` | Treo shipper |
| POST | `/api/Coordinator/shippers/{id}/adjust-reputation` | Chỉnh uy tín |
| GET | `/api/Coordinator/orders/.../dispatch-history` | History |
| GET | `/api/Coordinator/incidents` | Sự cố |
| POST | `/api/Coordinator/complaint/{reportId}/resolve` | Resolve complaint |
| GET | `/api/Coordinator/complaints/orders` | DS khiếu nại |

---

## 5. Key files

| Vai trò | File |
|---------|------|
| API | `API/Controllers/CoordinatorController.cs` |
| Features | `Application/Features/Coordinator/Commands/*`, `Queries/*` |
| Entity | `OrderDeliveryProposal`, `OrderDispatchHistory`, `SystemReport`, `ShipperReputationHistory` |
| FE | `DispatchBoardPage`, `MonitorShippersPage`, `DispatchHistoryPage`, `CoordinatorIncidentsPage`, `AdjustReputationModal`, `CreateTicketModal` |

---

## 6. Acceptance Criteria

- [ ] Board load đơn chờ shipper
- [ ] Suggested shippers chỉ online gần
- [ ] Broadcast gửi noti; 0 shipper → message rõ
- [ ] Force-assign gán Order.ShipperId + history
- [ ] Release trả đơn về trạng thái chờ
- [ ] Suspend chặn toggle-online của shipper
- [ ] Adjust reputation ghi ShipperReputationHistory
- [ ] Resolve complaint cập nhật ReportStatus

---

## 7. Cảnh báo / Thông báo hệ thống

| Message | Loại | File | Trigger | API | Mức độ |
|---------|------|------|---------|-----|--------|
| Đã gửi đề xuất / gán đơn / broadcast / thu hồi / giải quyết sự cố | success | `DispatchBoardPage.tsx` | Dispatch actions | `/Coordinator/*` | Info |
| Đã gửi thông báo đến {n} tài xế thành công | success | API message | Broadcast OK | `POST .../broadcast` | Info |
| Không có tài xế nào trực tuyến gần khu vực này | info | API message | Broadcast 0 | `broadcast` | Warning |
| Order is not available for broadcast… | error | API | Sai status | `broadcast` | Error |
| Restaurant location is missing | error | API | Thiếu tọa độ | `broadcast` | Error |
| window.confirm force-assign / broadcast | confirm | `DispatchBoardPage.tsx` | Trước gọi API | — | Confirm |
| Vui lòng nhập lý do giải phóng / chi tiết sự cố | error | `DispatchBoardPage.tsx` | Validation | release/resolve | Warning |
| Đã tạm khóa shipper X phút / khóa-mở TK | success | `MonitorShippersPage.tsx` | Suspend | `POST .../suspend` | Warning |
| window.confirm khóa vô thời hạn / mở khóa | confirm | `MonitorShippersPage.tsx` | Lock | — | Confirm |
| Đã thay đổi điểm uy tín thành công | success | `AdjustReputationModal.tsx` | Adjust | `adjust-reputation` | Info |
| Tạo phiếu hỗ trợ thành công! | success | `CreateTicketModal.tsx` | Ticket | `POST /Admin/support-tickets` | Info |
| Đã xử lý sự cố thành công | success | `CoordinatorIncidentsPage.tsx` | Resolve | `complaint/{id}/resolve` | Info |
| Tải lịch sử điều phối thất bại… | error | `DispatchHistoryPage.tsx` | Load | `dispatch-history` | Error |

---

## 8. Liên kết

- Workflow: [../workflows/Coordinator_Dispatch_Workflow.md](../workflows/Coordinator_Dispatch_Workflow.md)  
- Shipper: [Logistics_Shipper_Requirements.md](./Logistics_Shipper_Requirements.md)  
- Support/Admin complaints: [Support_Admin_Requirements.md](./Support_Admin_Requirements.md)  
