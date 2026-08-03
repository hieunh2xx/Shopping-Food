# Cảnh báo — Support / Admin

> Requirements: [../Support_Admin_Requirements.md](../Support_Admin_Requirements.md)

| ID | Message | Loại | Mức độ | Nơi hiện | File | Trigger | API |
|----|---------|------|--------|----------|------|---------|-----|
| AL-ADM-01 | Gửi khiếu nại thành công! Xem xét trong 24h | success | Info | Toast | `UserReportIncidentPage` | Order complaint | `/Support/order-complaint` |
| AL-ADM-02 | Vui lòng chọn đơn / lý do / mô tả / file ảnh | validation | Warn | Toast | UserReportIncidentPage | Form | — |
| AL-ADM-03 | Đã gửi khiếu nại thành công! Chờ Admin… | success | Info | Toast | `SellerAppealPage` | Appeal | `/Support/appeal` |
| AL-ADM-04 | Forbidden. Only Sellers and Malls can submit appeals. | error | Warn | Toast | — | Wrong role | appeal |
| AL-ADM-05 | Đã xử lý khiếu nại thành công | success | Info | Toast | `AdminOrderComplaintsPage` | Moderate | Admin/Coordinator resolve |
| AL-ADM-06 | FAQ thêm/sửa/xóa thành công / thiếu câu hỏi-trả lời | success/validation | Info/Warn | Toast | `AdminFaqPage` | FAQ CMS | `/Faq*` |
| AL-ADM-07 | Blacklist thêm/xóa/toggle | success | Warn | Toast | `AdminBlacklistPage` | Blacklist | `/Admin/blacklist-keywords*` |
| AL-ADM-08 | Lưu quyền role thành công | success | Critical | Toast | `AdminPermissionsPage` | RBAC | `PUT /Admin/permissions/role/{role}` |
| AL-ADM-09 | Cập nhật bảo trì thành công | success | Critical | Toast | `AdminSystemConfigPage` | Maintenance | `/Admin/system/maintenance` |
| AL-ADM-10 | Lưu finance-config / delivery / chiết khấu quán | success | Critical | Toast | `AdminFinanceOperationsPage` | Finance | `/Admin/finance-config*` |
| AL-ADM-11 | Tạo TK nội bộ / toggle user / adjust tier | success | Warn | Toast | `AdminUsersPage` | Staff/users | `/Admin/users*` |
| AL-ADM-12 | Xử lý báo cáo SP / review | success | Info | Toast | Admin*ReportsPage | Moderate reports | product/review-reports |
| AL-ADM-13 | Cập nhật chính sách pháp lý | success | Info | Toast | `AdminLegalSettingsPage` | Legal | `/Admin/system/legal` |
| AL-ADM-14 | Global menu category CRUD / ẩn-hiện | success | Info | Toast | `AdminSettingsPage` | Categories | GlobalMenuCategory |
| AL-ADM-15 | Có lỗi khi tải nhật ký hệ thống | error | Warn | Toast | `AdminSystemLogsPage` | Logs | `/System/action-logs` |
| AL-ADM-16 | Đã duyệt/từ chối hồ sơ đối tác / sản phẩm | success | Info | Toast | `useAdmin` / Approvals | Approvals | Admin approve APIs |
| AL-ADM-17 | Vui lòng nhập lý do khi từ chối | validation | Warn | Toast | AdminApprovalsPage | Reject | — |

## Checklist QA Support/Admin Alerts

- [ ] Appeal sai role → AL-ADM-04
- [ ] Bật maintenance → AL-ADM-09 + System AL-SYS-01
- [ ] Đổi RBAC → AL-ADM-08 (Critical — test kỹ)
