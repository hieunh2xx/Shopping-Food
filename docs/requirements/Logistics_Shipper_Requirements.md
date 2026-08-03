# Requirements: Logistics — Shipper

Tài liệu **yêu cầu nghiệp vụ** cho tài xế: online, nhận/từ chối đề xuất, vòng đời giao hàng, GPS, thu nhập, uy tín, lịch/khu vực, báo cáo sự cố, công nợ COD.

> Workflow: [../workflows/Shipper_Delivery_Workflow.md](../workflows/Shipper_Delivery_Workflow.md)  
> COD debt / ví: [Payment_Requirements.md](./Payment_Requirements.md) · [../workflows/Payment_Wallet_Withdraw_Workflow.md](../workflows/Payment_Wallet_Withdraw_Workflow.md)  
> Chia tiền shipper: [Revenue_Split_Requirements.md](./Revenue_Split_Requirements.md)

---

## 1. Mục tiêu nghiệp vụ

1. Shipper **bật/tắt online** để nhận đề xuất đơn.
2. Xem **available / proposed offers** → **accept / reject**.
3. Chuỗi trạng thái: **arrived → picked-up → delivered | failed**.
4. Cập nhật **location**, xem **delivery-route**, **income-report**, **reputation**.
5. Cấu hình **schedule-area**; **report incident**; quản lý **COD debt** (link Payment).

---

## 2. Actors & quyền

| Actor | Quyền |
|-------|--------|
| **Shipper** | Toàn bộ API `/api/Shipper/*` (RBAC); phải có `ShipperProfile` Active |
| **Customer** | `POST /api/Shipper/review` đánh giá sau giao |
| **Coordinator / Admin** | Suspend, adjust reputation, force-assign (xem Coordinator Requirements) |

---

## 3. Functional Requirements

### FR-SHP-01 — Online toggle

| ID | Requirement |
|----|-------------|
| FR-SHP-01 | `POST /api/Shipper/toggle-online` — đảo `IsOnline` |
| FR-SHP-02 | Shipper bị suspend tạm/vĩnh viễn → 403 kèm lý do / thời gian còn lại |
| FR-SHP-03 | Accept offer khi offline → FE/API báo phải bật online |

### FR-SHP-02 — Offers

| ID | Requirement |
|----|-------------|
| FR-SHP-10 | `GET /api/Shipper/available-offers` — đơn khả dụng (shipper online) |
| FR-SHP-11 | `GET /api/Shipper/proposed-offer/{orderId}` — chi tiết đề xuất |
| FR-SHP-12 | `POST /api/Shipper/accept-offer` — gán `Order.ShipperId`, cập nhật Proposal Accepted |
| FR-SHP-13 | `POST /api/Shipper/reject-offer` — Proposal Rejected; đơn có thể broadcast lại |
| FR-SHP-14 | Offline gọi available → lỗi *"must switch to online"* |

### FR-SHP-03 — Delivery lifecycle

| ID | Requirement |
|----|-------------|
| FR-SHP-20 | `POST /api/Shipper/confirm-arrived` — đến quán |
| FR-SHP-21 | `POST /api/Shipper/confirm-picked-up` — lấy hàng (có thể kèm mã pickup) |
| FR-SHP-22 | `POST /api/Shipper/confirm-delivered` — giao OK → trigger **SettleOrderOnDeliveryAsync** (ví + COD debt) |
| FR-SHP-23 | `POST /api/Shipper/confirm-failed` — giao thất bại + lý do |
| FR-SHP-24 | Delivered thường yêu cầu ảnh chứng minh (FE validation) |

### FR-SHP-04 — Location & route

| ID | Requirement |
|----|-------------|
| FR-SHP-30 | `POST /api/Shipper/location` — cập nhật lat/lng realtime |
| FR-SHP-31 | `GET /api/Shipper/delivery-route/{orderId}` — lộ trình giao |

### FR-SHP-05 — Income & reputation

| ID | Requirement |
|----|-------------|
| FR-SHP-40 | `GET /api/Shipper/income-report` — báo cáo thu nhập |
| FR-SHP-41 | Thu nhập settle = `Order.ShipperIncome` (base + km>5 + peak) — xem Revenue Split |
| FR-SHP-42 | `GET /api/Shipper/ReputationHistory` — lịch sử điểm |
| FR-SHP-43 | `POST /api/Shipper/review` — Customer đánh giá shipper theo Order |

### FR-SHP-06 — Schedule & incident

| ID | Requirement |
|----|-------------|
| FR-SHP-50 | `GET/PUT /api/Shipper/schedule-area` — lịch làm + khu vực |
| FR-SHP-51 | `POST /api/Shipper/Orders/{orderId}/report` — báo cáo sự cố → SystemReport / incident queue |

### FR-SHP-07 — COD debt (link Payment)

| ID | Requirement |
|----|-------------|
| FR-SHP-60 | Khi settle COD: `CodCollectedAmount += SellerPayout + PlatformCommission` |
| FR-SHP-61 | Nộp nợ: `POST /api/Payment/shipper/repay-debt` |
| FR-SHP-62 | Hạn mức: `PlatformFinanceConfig.DefaultShipperDebtLimit` (default 5.000.000₫); Admin `PUT /api/Payment/shipper/debt-limit` |
| FR-SHP-63 | Rút tiền: `POST /api/Payment/withdraw` (Shipper) |

---

## 4. API surface

| Method | Route | Việc |
|--------|-------|------|
| POST | `/api/Shipper/toggle-online` | Online/offline |
| GET | `/api/Shipper/available-offers` | DS đề xuất |
| GET | `/api/Shipper/proposed-offer/{orderId}` | Chi tiết |
| POST | `/api/Shipper/accept-offer` | Nhận đơn |
| POST | `/api/Shipper/reject-offer` | Từ chối |
| POST | `/api/Shipper/confirm-arrived` | Đến quán |
| POST | `/api/Shipper/confirm-picked-up` | Lấy hàng |
| POST | `/api/Shipper/confirm-delivered` | Giao OK + settle |
| POST | `/api/Shipper/confirm-failed` | Giao fail |
| POST | `/api/Shipper/location` | GPS |
| GET | `/api/Shipper/delivery-route/{orderId}` | Route |
| GET | `/api/Shipper/income-report` | Thu nhập |
| GET/PUT | `/api/Shipper/schedule-area` | Lịch/khu vực |
| GET | `/api/Shipper/ReputationHistory` | Uy tín |
| POST | `/api/Shipper/review` | Đánh giá |
| POST | `/api/Shipper/Orders/{orderId}/report` | Sự cố |

---

## 5. Key files

| Vai trò | File |
|---------|------|
| API | `API/Controllers/ShipperController.cs` |
| Features | `Application/Features/Orders/*Shipper*`, `Shippers/*`, settle in `PaymentSettlementService` |
| Entity | `ShipperProfile`, `OrderDeliveryProposal`, `ShipperReputationHistory`, `ShipperReview` |
| FE | `ShipperDashboard.tsx`, `SuccessDeliveryModal`, `ReportIncidentModal`, `ShipperProfilePage`, `ShipperIncomePage`, `PartnerWalletPages` |

---

## 6. Acceptance Criteria

- [ ] Offline không nhận available-offers / accept bị chặn
- [ ] Suspend → không bật online (403 + message)
- [ ] Accept → Order gán shipper; Reject → proposal Rejected
- [ ] Delivered COD → ví + CodCollectedAmount tăng đúng
- [ ] Delivered online Paid → ShipperEarning cộng ví, không COD debt
- [ ] Failed + report incident tạo được ticket/report
- [ ] Schedule-area GET/PUT đúng
- [ ] Income-report phản ánh đơn đã settle

---

## 7. Cảnh báo / Thông báo hệ thống

| Message | Loại | File | Trigger | API | Mức độ |
|---------|------|------|---------|-----|--------|
| Bạn đã BẬT/TẮT trạng thái trực tuyến! | success | `ShipperDashboard.tsx` | Toggle | `POST /Shipper/toggle-online` | Info |
| Tài khoản bị khóa / tạm dừng … phút | error | API → toast | Suspended toggle | `toggle-online` | Critical |
| Vui lòng bật online để nhận đơn | error | `ShipperDashboard.tsx` | Accept offline | — | Warning |
| Nhận đơn / Đã chấp nhận / Đã từ chối đơn | success | `ShipperDashboard.tsx` | Offer | accept/reject-offer | Info |
| Đã hết thời gian phản hồi đề xuất | error | `ShipperDashboard.tsx` | Offer timeout | — | Warning |
| Force-assign / thu hồi đơn (dynamic) | success/error | `ShipperDashboard.tsx` | SignalR notification | Coordinator | Warning |
| Chúc mừng! Giao hàng thành công. | success | `SuccessDeliveryModal.tsx` | Delivered | `confirm-delivered` | Info |
| Vui lòng tải ảnh chứng minh giao hàng | error | `SuccessDeliveryModal.tsx` | Validation | — | Warning |
| Báo cáo giao hàng thất bại (PromptModal) | confirm | `ShipperDashboard.tsx` | Failed | `confirm-failed` | Confirm |
| Đã báo cáo giao hàng thất bại | error* | `ShipperDashboard.tsx` | After failed | `confirm-failed` | Warning |
| Gửi báo cáo sự cố thành công… | success | `ReportIncidentModal.tsx` | Incident | `Orders/{id}/report` | Info |
| Vui lòng nhập chi tiết sự cố | error | `ReportIncidentModal.tsx` | Validation | — | Warning |
| Cập nhật lịch/khu vực thành công | success | `ShipperProfilePage.tsx` | Schedule | `PUT schedule-area` | Info |
| Đã nộp … công nợ COD | success | `PartnerWalletPages.tsx` | Repay | `POST /Payment/shipper/repay-debt` | Info |
| Shippers must switch to online… | error | API | available-offers offline | `GET available-offers` | Warning |

\*Hiện FE dùng `toast.error` cho kết quả báo cáo failed — nên coi là Warning/Info nghiệp vụ.

---

## 8. Liên kết

- Workflow: [../workflows/Shipper_Delivery_Workflow.md](../workflows/Shipper_Delivery_Workflow.md)  
- Coordinator: [Logistics_Coordinator_Requirements.md](./Logistics_Coordinator_Requirements.md)  
- Revenue: [Revenue_Split_Requirements.md](./Revenue_Split_Requirements.md)  
