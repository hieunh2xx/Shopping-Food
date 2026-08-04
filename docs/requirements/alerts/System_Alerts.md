# Cảnh báo — System (toàn cục)

> Requirements liên quan: mọi Feature · HttpClient · MaintenanceFilter

| ID | Message / Hành vi | Loại | Mức độ | Nơi hiện | File | Trigger | API |
|----|-------------------|------|--------|----------|------|---------|-----|
| AL-SYS-01 | Redirect `/maintenance` (không toast) | info | Critical | Redirect | `services/base/HttpClient.ts` | HTTP **503** | Bất kỳ + MaintenanceFilter |
| AL-SYS-02 | Redirect `/login` sau khi refresh fail | info | Critical | Redirect | `HttpClient.ts` | 401 + refresh fail | `POST /User/RefreshToken` |
| AL-SYS-03 | Message lỗi API (EN→VI nếu map được) | error | Warn | Toast (qua caller) | `HttpClient.ts` | HTTP 4xx/5xx | — |
| AL-SYS-04 | Trang bảo trì | info | Critical | Page | `pages/shared/MaintenancePage.tsx` | Sau AL-SYS-01 | `GET /Admin/system/maintenance` |
| AL-SYS-05 | Seller bị Suspended — chặn POST/PUT/PATCH/DELETE | error | Critical | API 403 | `CheckSellerSuspensionAttribute` | Seller write khi quán treo | Mọi API mutating seller |
| AL-SYS-06 | Endpoint unpublished / thiếu RolePermission | error | Critical | API 403 | `AuthenticationFilter` | RBAC deny | Khớp `API_ENDPOINT` |
| AL-SYS-07 | Validation FluentValidation → 400 | validation | Warn | API + toast FE | `ValidationBehaviour` | Request invalid | MediatR |
| AL-SYS-08 | Exception → ApiResponse JSON | error | Critical | API | `ExceptionHandlingMiddleware` | Unhandled | — |

## Mức độ xử lý đề xuất

| Mức độ | Ý nghĩa vận hành |
|--------|-------------------|
| Info | Thông tin / điều hướng |
| Warn | User sửa được (validate, nghiệp vụ) |
| Critical | Bảo mật / bảo trì / mất phiên / treo quán |

## Checklist QA System

- [ ] Bật maintenance → FE về `/maintenance`, login Admin vẫn vào được (theo rule filter)
- [ ] Token hết hạn → refresh OK hoặc về `/login`
- [ ] Seller Suspended không tạo/sửa món được
