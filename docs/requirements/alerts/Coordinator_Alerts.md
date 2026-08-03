# Cảnh báo — Coordinator

> Requirements: [../Logistics_Coordinator_Requirements.md](../Logistics_Coordinator_Requirements.md)

| ID | Message | Loại | Mức độ | Nơi hiện | File | Trigger | API |
|----|---------|------|--------|----------|------|---------|-----|
| AL-COO-01 | Đã gửi đề xuất / gán đơn thành công | success | Info | Toast | `DispatchBoardPage` | Proposal/assign | `/Coordinator/proposals`, force-assign |
| AL-COO-02 | window.confirm gán bắt buộc | confirm | Warn | window.confirm | DispatchBoardPage | Force-assign | force-assign |
| AL-COO-03 | Đã broadcast / Không có tài xế online gần… | success/info | Info | Toast | DispatchBoardPage | Broadcast | `/Coordinator/orders/{id}/broadcast` |
| AL-COO-04 | window.confirm broadcast shipper gần | confirm | Warn | window.confirm | DispatchBoardPage | Broadcast | broadcast |
| AL-COO-05 | Đã thu hồi đơn / giải phóng | success | Warn | Toast | DispatchBoardPage | Release | `/Coordinator/orders/{id}/release` |
| AL-COO-06 | Vui lòng nhập lý do giải phóng | validation | Warn | Toast | DispatchBoardPage | Release empty | — |
| AL-COO-07 | Đã giải quyết sự cố | success | Info | Toast | DispatchBoardPage / Incidents | Resolve | resolve-incident / complaint resolve |
| AL-COO-08 | Vui lòng nhập chi tiết sự cố | validation | Warn | Toast | DispatchBoardPage | Incident form | — |
| AL-COO-09 | Đã tạm khóa shipper X phút / khóa-mở TK | success | Warn | Toast | `MonitorShippersPage` | Suspend | `/Coordinator/shippers/{id}/suspend` |
| AL-COO-10 | window.confirm khóa vô thời hạn / mở khóa | confirm | Critical | window.confirm | MonitorShippersPage | Lock | suspend |
| AL-COO-11 | Đã thay đổi điểm uy tín thành công | success | Warn | Toast | `AdjustReputationModal` | Adjust | adjust-reputation |
| AL-COO-12 | Tạo phiếu hỗ trợ thành công! | success | Info | Toast | `CreateTicketModal` | Ticket | Admin support-tickets |
| AL-COO-13 | Đã xử lý sự cố / khiếu nại thành công | success | Info | Toast | `CoordinatorIncidentsPage` | Resolve complaint | `/Coordinator/complaint/{id}/resolve` |
| AL-COO-14 | Tải lịch sử điều phối thất bại | error | Warn | Toast | `DispatchHistoryPage` | Load | dispatch-history |
| AL-COO-15 | Order not available for broadcast… | error | Warn | Toast | — | Wrong status | broadcast |
| AL-COO-16 | Restaurant location is missing. | error | Warn | Toast | — | No geo | broadcast |

## Checklist QA Coordinator Alerts

- [ ] Force-assign có confirm AL-COO-02
- [ ] Broadcast không shipper → message AL-COO-03
- [ ] Suspend có confirm AL-COO-10
