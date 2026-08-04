# Tài liệu Quy trình: Trợ giúp / FAQ / Khiếu nại / Legal

Luồng **public Help Center**, **FAQ**, **báo cáo sự cố đơn hàng**, **seller appeal mở khóa**, **Privacy/Terms**.

> Admin xử lý complaint: [Admin_Main_Workflow.md](./Admin_Main_Workflow.md) · Chat CSKH: [Chat_Notification_Workflow.md](./Chat_Notification_Workflow.md)

---

## Phần A — UI Interaction Trace

---

## UT-HELP-01 — **HelpCenterPage**: đọc FAQ + liên kết

### 1. Giao diện

| Mục | Giá trị |
|-----|---------|
| **Route** | `/help` (theo `ROUTES` Help Center) |
| **Page** | `pages/support/HelpCenterPage.tsx` |
| **Controls** | Accordion FAQ · card Profile · card Báo cáo sự cố · card Liên hệ CSKH |

### 2. FE

```text
Mount
  → faqService.getList()  // chỉ FAQ IsActive=true phía BE/filter
  → GET /api/Faq
  → setFaqs → accordion toggleExpand(id) local state (không API)

Card "Tài khoản của tôi" → Link ROUTES.PROFILE
Card "Báo cáo sự cố" → Link ROUTES.REPORT_INCIDENT
Card "Liên hệ CSKH" → window.dispatchEvent(new Event('openLiveChat'))
  → widget chat lắng nghe event → mở live chat (không REST ngay)
```

### 3–5

- Response: list `{ id, question, answer, ... }`  
- Expand: hiện `faq.answer` dưới câu hỏi  
- Empty: "Chưa có câu hỏi thường gặp nào."  
- Lỗi load: silent (không toast)  

---

## UT-HELP-02 — **UserReportIncidentPage**: gửi khiếu nại đơn

### 1. UI

| Mục | Giá trị |
|-----|---------|
| **Route** | `/report-incident` (REPORT_INCIDENT) |
| **Page** | `pages/support/UserReportIncidentPage.tsx` |
| **Form** | Chọn order · lý do · mô tả · upload bằng chứng · Submit |

### 2. FE

```text
Mount → orderService.getMyOrders() → GET /api/Order/MyOrders
handleImageUpload → authService.uploadImage(file) → POST /api/User/UploadImage
  → setEvidenceUrl + toast.success('Tải ảnh lên thành công')
handleSubmit
  → validate orderId / reason / description
  → supportService.submitOrderComplaint({
       orderId, reason, description, evidenceImageUrl
     })
  → POST /api/Support/order-complaint
  → toast.success('Gửi khiếu nại thành công! Chúng tôi sẽ xem xét trong 24h.')
  → navigate(-1)
```

### 3. BE

```text
SupportController [HttpPost("order-complaint")]
  → SubmitOrderComplaintCommand handler
  → Tạo report/complaint gắn Order
  → Coordinator/Admin queue (GET /Coordinator/complaints/orders)
```

### 4–5

- Success toast + back  
- Fail: toast `res.message` hoặc lỗi mạng  

---

## UT-HELP-03 — **SellerAppealPage**: khiếu nại mở khóa quán

### 1. UI

| Mục | Giá trị |
|-----|---------|
| **Route** | Seller appeal (`ROUTES.SELLER_APPEAL`) |
| **Page** | `pages/seller/SellerAppealPage.tsx` |
| **Nút** | **"Gửi khiếu nại"** |
| **Context** | Banner khóa trên `SellerLayout` link tới trang này |

### 2–5

```text
handleSubmit
  → validate reason.trim()
  → httpClient.post(API_ENDPOINTS.SUPPORT.APPEAL, { content: reason })
  → POST /api/Support/appeal
  → toast.success('Đã gửi khiếu nại thành công! Vui lòng chờ Admin xử lý.')
  → clear textarea
```

**BE:** `SupportController` `[HttpPost("appeal")]` → SubmitAppealCommand (ticket/report cho Admin).

---

## UT-HELP-04 — **PrivacyPolicyPage** / **TermsOfUsePage** (GET legal)

### 1. UI

| Mục | Giá trị |
|-----|---------|
| **Pages** | `PrivacyPolicyPage.tsx`, `TermsOfUsePage.tsx` |
| **Trigger** | Mount — chỉ đọc |

### 2–5

```text
Mount
  → supportService.getLegalSettings()
  → GET /api/System/legal   (FE: '/system/legal')
  → Privacy: data.privacyPolicy HTML
  → Terms: data.termsOfUse HTML (tương tự page Terms)
  → dangerouslySetInnerHTML render
Fallback HTML nếu empty/error
```

**Admin ghi nội dung:** `POST /api/Admin/system/legal` (`AdminLegalSettingsPage`) — xem Admin_Main UT-ADM-16.

---

## UT-HELP-05 — Admin FAQ CRUD (cross-link)

Admin quản lý FAQ trên `AdminFaqPage` → CRUD `/api/Faq` — chi tiết UT-ADM-15 trong Admin_Main_Workflow. Sau khi Admin tạo FAQ active → xuất hiện trên HelpCenter.

---

## Phần B — Workflow nghiệp vụ & Backend

### 1. Luồng tổng quan

1. User mở Help → đọc FAQ / mở chat / vào báo cáo đơn.  
2. Customer chọn đơn đã mua → gửi order-complaint + evidence.  
3. Coordinator/Admin resolve trên AdminOrderComplaintsPage.  
4. Seller bị suspend → Appeal → Admin xem xét mở khóa.  
5. Privacy/Terms đọc từ System legal settings.  

```mermaid
flowchart LR
  Help --> FAQ[GET /Faq]
  Help --> Chat[openLiveChat]
  Help --> Complaint[POST /Support/order-complaint]
  Complaint --> AdminResolve[Coordinator resolve]
  SellerSuspend --> Appeal[POST /Support/appeal]
  LegalPages --> GET[/System/legal]
  AdminLegal --> POST[/Admin/system/legal]
```

### 2. API

| Method | Route | Việc | Auth |
|--------|-------|------|------|
| GET | `/api/Faq` | List FAQ public/active | Public/Auth |
| POST/PUT/DELETE | `/api/Faq`, `/api/Faq/{id}` | Admin CRUD | Admin |
| POST | `/api/Support/order-complaint` | Khiếu nại đơn | Customer |
| POST | `/api/Support/appeal` | Appeal seller | Seller |
| POST | `/api/Support/shipper-complaint` | Khiếu nại shipper (nếu dùng) | Auth |
| GET | `/api/System/legal` | Đọc Privacy/Terms | Public |
| POST | `/api/Admin/system/legal` | Cập nhật legal | Admin |
| GET | `/api/Order/MyOrders` | Chọn đơn để báo cáo | Customer |
| POST | `/api/User/UploadImage` | Evidence | Auth |

### 3. Bảo mật

- Complaint/appeal cần JWT đúng role.  
- Legal GET public; POST chỉ Admin.  
- Upload evidence qua UploadImage (Cloudinary) — validate file type FE.  
- XSS: legal HTML render `dangerouslySetInnerHTML` — chỉ Admin được ghi.  

### 4. Checklist

- [ ] HelpCenter load FAQ accordion  
- [ ] openLiveChat mở widget  
- [ ] Report incident validate + toast 24h  
- [ ] Seller appeal khi quán Suspended  
- [ ] Privacy/Terms hiện nội dung Admin đã lưu  

### 5. File neo

| FE | BE |
|----|-----|
| `HelpCenterPage.tsx` | `FaqController.cs` |
| `UserReportIncidentPage.tsx` | `SupportController.cs` |
| `SellerAppealPage.tsx` | Features/Support/* |
| `PrivacyPolicyPage.tsx`, `TermsOfUsePage.tsx` | `SystemController` GET legal |
| `SupportService.ts`, `FaqService.ts` | `AdminController` POST system/legal |
