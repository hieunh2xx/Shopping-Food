# Requirements: Support & Admin (Vận hành sàn)

Tài liệu **yêu cầu nghiệp vụ** cho FAQ, khiếu nại/appeal, RBAC, blacklist, bảo trì, system logs, phê duyệt Admin, và liên kết finance-config.

> Workflow: [../workflows/Support_Admin_Workflow.md](../workflows/Support_Admin_Workflow.md)  
> Finance chi tiết: [Payment_Requirements.md](./Payment_Requirements.md) · [Revenue_Split_Requirements.md](./Revenue_Split_Requirements.md)

---

## 1. Mục tiêu nghiệp vụ

1. CMS **FAQ** công khai + CRUD Admin.
2. **Appeal / order-complaint / shipper-complaint** → `SystemReport`.
3. Admin **duyệt** Seller/Shipper/Product; moderate reports; support tickets.
4. **RBAC** động: ApiEndpoint + RolePermission (+ UserPermission).
5. **Blacklist** từ khóa; **Maintenance** mode; **Legal**; **Delivery settings**.
6. **System logs** (action/error); **finance-config** (hoa hồng, shipper fee, min withdraw…).

---

## 2. Actors & quyền

| Actor | Quyền |
|-------|--------|
| **Public** | Đọc FAQ, legal |
| **Customer / Seller / Shipper** | Gửi complaint/appeal theo role |
| **Admin** | Toàn bộ `/api/Admin/*` (bypass RBAC check trong filter); logs; permissions |
| **Coordinator** | Resolve một phần complaint (xem Logistics_Coordinator) |

---

## 3. Functional Requirements

### FR-FAQ-01 — FAQ

| ID | Requirement |
|----|-------------|
| FR-FAQ-01 | `GET /api/Faq`, `GET /api/Faq/{id}` — public đọc |
| FR-FAQ-02 | `POST/PUT/DELETE /api/Faq` — Admin CMS |

### FR-SUP-01 — Complaints & Appeal

| ID | Requirement |
|----|-------------|
| FR-SUP-01 | `POST /api/Support/appeal` — Seller/Mall khiếu nại treo quán (SystemAppeal) |
| FR-SUP-02 | `POST /api/Support/order-complaint` — khiếu nại đơn (+ ảnh) |
| FR-SUP-03 | `POST /api/Support/shipper-complaint` — khiếu nại tài xế |
| FR-SUP-04 | Lưu `SystemReport` (TargetType, Status Pending…) |
| FR-SUP-05 | Admin moderate: `review-reports`, `product-reports` + `/moderate` |
| FR-SUP-06 | `POST /api/Admin/support-tickets` — tạo ticket thủ công |
| FR-SUP-07 | `GET /api/Admin/users/{id}/complaints` — lịch sử khiếu nại user |
| FR-SUP-08 | Coordinator `complaint/{reportId}/resolve`, `complaints/orders` |

### FR-ADM-01 — Approvals overview

| ID | Requirement |
|----|-------------|
| FR-ADM-10 | `GET /api/Admin/SellerApplications` + `POST ApproveSellerApplication` |
| FR-ADM-11 | `GET /api/Admin/ShipperApplications` + `POST approve-shipper-application` |
| FR-ADM-12 | `POST /api/Admin/ApproveProduct` — duyệt món Pending |
| FR-ADM-13 | FE `AdminApprovalsPage` — duyệt / từ chối / NeedsInfo kèm lý do |

### FR-ADM-02 — RBAC Permissions

| ID | Requirement |
|----|-------------|
| FR-ADM-20 | `GET /api/Admin/permissions/endpoints` — catalog API_ENDPOINT |
| FR-ADM-21 | `GET /api/Admin/permissions/role/{role}` — RolePermission |
| FR-ADM-22 | `PUT /api/Admin/permissions/role/{role}` — cập nhật grants |
| FR-ADM-23 | Runtime: `AuthenticationFilter` — UserPermission override → RolePermission; Admin bypass |
| FR-ADM-24 | Seeder: `ApiEndpointSeeder` lúc startup |

### FR-ADM-03 — Blacklist

| ID | Requirement |
|----|-------------|
| FR-ADM-30 | `GET/POST /api/Admin/blacklist-keywords` |
| FR-ADM-31 | `DELETE /api/Admin/blacklist-keywords/{id}` |
| FR-ADM-32 | `PUT /api/Admin/blacklist-keywords/{id}/toggle` |
| FR-ADM-33 | `BlacklistFilterService` lọc nội dung review/chat/report (khi được gọi) |

### FR-ADM-04 — Maintenance / Delivery / Legal

| ID | Requirement |
|----|-------------|
| FR-ADM-40 | `GET/POST /api/Admin/system/maintenance` — bật bảo trì |
| FR-ADM-41 | `MaintenanceFilter` → HTTP **503** (trừ login/admin); FE `HttpClient` redirect `/maintenance` |
| FR-ADM-42 | `GET/POST /api/Admin/system/delivery` — DeliverySettings (phí ship platform, freeship radius…) |
| FR-ADM-43 | `POST /api/Admin/system/legal` — điều khoản / privacy |
| FR-ADM-44 | `GET /api/System/legal` — public đọc |

### FR-ADM-05 — Logs & dashboard

| ID | Requirement |
|----|-------------|
| FR-ADM-50 | `GET /api/System/action-logs` — audit `log.ActionLogs` |
| FR-ADM-51 | `GET /api/System/error-logs` — `log.ErrorLogs` |
| FR-ADM-52 | `GET /api/Admin/dashboard/stats`, `/dashboard/heatmap` |
| FR-ADM-53 | `GET /api/Admin/reports/financial` |
| FR-ADM-54 | `POST /api/Admin/users/staff` — tạo tài khoản nội bộ |
| FR-ADM-55 | `PUT /api/Admin/users/{userId}/toggle-status` — khóa/mở user |
| FR-ADM-56 | GlobalMenuCategory CRUD + Visibility trên Admin |

### FR-ADM-06 — Finance-config (link)

| ID | Requirement |
|----|-------------|
| FR-ADM-60 | `GET/PUT /api/Admin/finance-config` — CommissionRate, ShipperBaseFee, MinWithdrawal… |
| FR-ADM-61 | `GET /api/Admin/finance-config/restaurants` + `PUT .../restaurants/{id}` — CustomCommissionRate |
| FR-ADM-62 | Chi tiết FR settle: [Revenue_Split_Requirements.md](./Revenue_Split_Requirements.md) |
| FR-ADM-63 | Chi tiết payment: [Payment_Requirements.md](./Payment_Requirements.md) |

---

## 4. API surface (tóm tắt)

| Nhóm | Routes |
|------|--------|
| FAQ | `/api/Faq` CRUD |
| Support | `/api/Support/appeal`, `order-complaint`, `shipper-complaint` |
| Approvals | `/api/Admin/SellerApplications`, `ShipperApplications`, `Approve*`, `ApproveProduct` |
| Reports | `/api/Admin/review-reports*`, `product-reports*`, `support-tickets` |
| RBAC | `/api/Admin/permissions/endpoints`, `permissions/role/{role}` |
| Blacklist | `/api/Admin/blacklist-keywords*` |
| System cfg | `/api/Admin/system/maintenance|delivery|legal` |
| Finance | `/api/Admin/finance-config*` |
| Logs | `/api/System/action-logs`, `error-logs`, `legal`, `global-menu-category` |
| Users | `/api/Admin/users/staff`, `users/{id}/toggle-status` |

---

## 5. Key files

| Vai trò | File |
|---------|------|
| Controllers | `SupportController`, `FaqController`, `AdminController`, `SystemController` |
| Filter | `MaintenanceFilter`, `AuthenticationFilter` |
| Seeder | `API/Data/ApiEndpointSeeder.cs` |
| Services | `BlacklistFilterService` |
| Entities | `Faq`, `SystemReport`, `SystemConfig`, `BlacklistKeyword`, `ApiEndpoint`, `RolePermission`, `ActionLog`, `ErrorLog`, `PlatformFinanceConfig` |
| FE | `HelpCenterPage`, `UserReportIncidentPage`, `SellerAppealPage`, `AdminFaqPage`, `AdminApprovalsPage`, `AdminPermissionsPage`, `AdminBlacklistPage`, `AdminSystemConfigPage`, `AdminLegalSettingsPage`, `AdminSystemLogsPage`, `AdminFinanceOperationsPage`, `MaintenancePage` |

---

## 6. Acceptance Criteria

- [ ] FAQ public đọc; Admin CRUD
- [ ] Appeal chỉ Seller/Mall; order/shipper complaint tạo SystemReport Pending
- [ ] Duyệt Seller/Shipper/Product đổi status + role/profile đúng
- [ ] Đổi RolePermission → user non-Admin bị 403 đúng endpoint
- [ ] Bật maintenance → client thường 503 → `/maintenance`; Admin/login vẫn vào được
- [ ] Blacklist CRUD + toggle
- [ ] Action/Error logs hiển thị trên Admin
- [ ] Đổi finance-config CommissionRate ảnh hưởng đơn settle mới

---

## 7. Cảnh báo / Thông báo hệ thống

| Message | Loại | File | Trigger | API | Mức độ |
|---------|------|------|---------|-----|--------|
| Gửi khiếu nại thành công! Xem xét trong 24h | success | `UserReportIncidentPage.tsx` | Order complaint | `POST /Support/order-complaint` | Info |
| Vui lòng chọn đơn / lý do / mô tả / file ảnh | error | `UserReportIncidentPage.tsx` | Validation | — | Warning |
| Đã gửi khiếu nại thành công! Chờ Admin… | success | `SellerAppealPage.tsx` | Appeal | `POST /Support/appeal` | Info |
| Forbidden. Only Sellers and Malls can submit appeals | error | API | Non-seller appeal | `appeal` | Error |
| Thêm/Cập nhật/Xóa FAQ thành công | success | `AdminFaqPage.tsx` | FAQ CRUD | `/Faq` | Info |
| Vui lòng nhập câu hỏi / câu trả lời | error | `AdminFaqPage.tsx` | Validation | — | Warning |
| Đã phê duyệt / từ chối / yêu cầu bổ sung | success | `AdminApprovalsPage.tsx` | Approvals | Approve* | Info |
| Vui lòng nhập lý do/thông báo | error | `AdminApprovalsPage.tsx` | Reject | — | Warning |
| Cập nhật quyền role thành công | success | `AdminPermissionsPage.tsx` | Save RBAC | `PUT permissions/role/{role}` | Warning |
| Blacklist thêm/xóa/toggle | success | `AdminBlacklistPage.tsx` | Keywords | blacklist APIs | Info |
| Cập nhật bảo trì thành công | success | `AdminSystemConfigPage.tsx` | Maintenance | `POST system/maintenance` | Critical |
| (redirect im lặng) | system | `HttpClient.ts` | HTTP 503 | bất kỳ | Critical |
| Trang bảo trì | page | `MaintenancePage.tsx` | Sau 503 | — | Critical |
| Cập nhật chính sách pháp lý | success | `AdminLegalSettingsPage.tsx` | Legal | `POST system/legal` | Info |
| Lưu finance-config / delivery / chiết khấu quán | success | `AdminFinanceOperationsPage.tsx` | Finance | `finance-config*` | Warning |
| Có lỗi khi tải nhật ký hệ thống | error | `AdminSystemLogsPage.tsx` | Load logs | `/System/*-logs` | Error |
| Đã xử lý khiếu nại / báo cáo thành công | success | Admin complaints/reports pages | Moderate | report moderate APIs | Info |
| Tạo TK nội bộ / cập nhật trạng thái user | success | `AdminUsersPage.tsx` | Staff/toggle | `users/staff`, toggle-status | Warning |
| Global category CRUD / ẩn-hiện | success | `AdminSettingsPage.tsx` | Categories | `GlobalMenuCategory*` | Info |

---

## 8. Liên kết

- Workflow: [../workflows/Support_Admin_Workflow.md](../workflows/Support_Admin_Workflow.md)  
- Payment & finance-config: [Payment_Requirements.md](./Payment_Requirements.md)  
- Revenue split: [Revenue_Split_Requirements.md](./Revenue_Split_Requirements.md)  
- Restaurant approve/suspend: [Restaurant_Seller_Requirements.md](./Restaurant_Seller_Requirements.md)  
- Chat broadcast noti: [Chat_Notification_Requirements.md](./Chat_Notification_Requirements.md)  
