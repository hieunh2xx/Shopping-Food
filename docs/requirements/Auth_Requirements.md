# Requirements: Xác thực & Đăng ký (Authentication)

Tài liệu yêu cầu nghiệp vụ cho đăng nhập, đăng ký, refresh token, quên mật khẩu trong hệ thống **UniEats**.

> Workflow liên quan:
> - [../workflows/Login_Workflow.md](../workflows/Login_Workflow.md)
> - [../workflows/Register_Workflow.md](../workflows/Register_Workflow.md)
> - [../workflows/ForgotPassword_Workflow.md](../workflows/ForgotPassword_Workflow.md)

---

## 1. Mục tiêu

1. Cho phép người dùng đăng ký tài khoản Customer / Seller / Shipper.
2. Đăng nhập đa kênh: mật khẩu, OTP 2FA (thiết bị mới), Google, Microsoft, Firebase Phone.
3. Cấp JWT access token + refresh token; hỗ trợ refresh và logout.
4. Khôi phục mật khẩu qua OTP email (3 bước).
5. Bảo vệ endpoint công khai hợp lý; chống brute-force ở mức nghiệp vụ hiện có (TrustedDevice + OTP).

---

## 2. Actors

| Actor | Quyền |
|-------|--------|
| **Guest** | Register, Login*, Forgot/Reset password, Refresh (có token) |
| **Customer / Seller / Mall / Shipper / Coordinator / Admin** | Logout, Refresh khi đã có session |
| **Hệ thống** | SMTP OTP, Firebase/Google/MS verify |

\*Login các phương thức đều public (bypass `AuthenticationFilter`).

---

## 3. Functional Requirements

### 3.1. Đăng ký

| ID | Requirement |
|----|-------------|
| FR-AUTH-01 | `POST /api/User/Register` tạo User + UserProfile role **Customer**; hash mật khẩu SHA256→Base64 |
| FR-AUTH-02 | `POST /api/User/RegisterSeller` đăng ký kèm hồ sơ SellerApplication (chờ Admin duyệt) |
| FR-AUTH-03 | `POST /api/User/register-shipper` đăng ký public shipper + ShipperApplication |
| FR-AUTH-04 | UserName / Email / Phone unique (filtered index); validate bắt buộc theo form FE |
| FR-AUTH-05 | Register Customer có thể yêu cầu Firebase ID Token (phone/email verify) tùy handler hiện tại |

### 3.2. Đăng nhập mật khẩu + OTP 2FA

| ID | Requirement |
|----|-------------|
| FR-AUTH-10 | `POST /api/User/Login` — tìm user theo UserName hoặc Email; so khớp PasswordHash |
| FR-AUTH-11 | Tài khoản bị Blocked/Inactive → từ chối đăng nhập (theo UserStatus) |
| FR-AUTH-12 | Nếu IP/thiết bị **đã tin cậy** (`TrustedDevice`) → trả JWT + RefreshToken ngay |
| FR-AUTH-13 | Nếu thiết bị mới → trả **RequireOtp** + PreAuthToken (hết hạn ngắn ~10 phút) |
| FR-AUTH-14 | `POST /api/User/SendLoginOtp` gửi OTP email/phone theo method |
| FR-AUTH-15 | `POST /api/User/VerifyLoginOtp` xác minh OTP → cấp JWT + Refresh; có thể ghi TrustedDevice |
| FR-AUTH-16 | Access token mặc định **15 phút**; Refresh random 32 bytes, lưu `User.RefreshToken` + expiry (~7 ngày) |

### 3.3. Đăng nhập OAuth / Phone

| ID | Requirement |
|----|-------------|
| FR-AUTH-20 | `POST /api/User/LoginGoogle` — verify Google ID token (`GoogleAuth:ClientId`) |
| FR-AUTH-21 | `POST /api/User/LoginMicrosoft` — đổi auth code → profile → login/tạo user |
| FR-AUTH-22 | `POST /api/User/LoginFirebasePhone` — verify Firebase idToken |
| FR-AUTH-23 | `POST /api/User/SendOtp` + `LoginByPhone` — OTP Stringee (luồng phụ) |
| FR-AUTH-24 | OAuth: nếu chưa có user → tạo tài khoản Customer (hoặc map email hiện có) theo handler |

### 3.4. Refresh / Logout

| ID | Requirement |
|----|-------------|
| FR-AUTH-30 | `POST /api/User/RefreshToken` — validate access (có thể hết hạn) + refresh còn hạn → cấp cặp token mới |
| FR-AUTH-31 | `POST /api/User/Logout` — vô hiệu hóa refresh token trên User |
| FR-AUTH-32 | FE `HttpClient`: 401 → gọi Refresh → retry; fail → clear `sf_token`/`sf_user` → `/login` |

### 3.5. Quên / Đặt lại mật khẩu

| ID | Requirement |
|----|-------------|
| FR-AUTH-40 | `POST /api/User/ForgotPassword` — email tồn tại → OTP 6 số, `OTP_RECORD` hết hạn **5 phút**, gửi SMTP |
| FR-AUTH-41 | Email không tồn tại → hiện trả **404** (UX rõ; kém chống enumeration — ghi nhận rủi ro) |
| FR-AUTH-42 | `POST /api/User/VerifyResetOtp` — check OTP chưa dùng, còn hạn; **chưa** set IsUsed |
| FR-AUTH-43 | `POST /api/User/ResetPassword` — check OTP lại → IsUsed=true → hash MK mới; không trùng MK cũ |
| FR-AUTH-44 | FE Modal 3 bước: Email → OTP → New password (≥6, confirm khớp) |

### 3.6. Bảo mật (Security FRs)

| ID | Requirement |
|----|-------------|
| FR-SEC-01 | Password không lưu plain text (SHA256 Base64) |
| FR-SEC-02 | JWT HS256; secret từ `JwtSettings`; claims `sub` + Name |
| FR-SEC-03 | Auth runtime = `AuthenticationFilter` (không JwtBearer middleware) |
| FR-SEC-04 | Login/Register/Forgot/OAuth/Refresh/Logout nằm trong **bypass list** filter |
| FR-SEC-05 | PreAuthToken chỉ dùng cho OTP flow, TTL ngắn |
| FR-SEC-06 | OTP one-time khi reset password (`IsUsed`) |
| FR-SEC-07 | TrustedDevice unique theo (UserAccountId, IpAddress) |

---

## 4. Business rules / State

### UserStatus
`Pending` | `Active` | `Inactive` | `Blocked` — chỉ Active (và rule handler) được login đầy đủ.

### Token lifecycle
```text
Login/OAuth/VerifyOtp → Access(15m) + Refresh(~7d)
Refresh → rotate tokens
Logout → clear RefreshToken
```

### Forgot password state (OTP_RECORD)
```text
Created (IsUsed=false) → Verified (vẫn false) → Used (IsUsed=true) | Expired
```

---

## 5. APIs chính

| Method | Route | Auth |
|--------|-------|------|
| POST | `/api/User/Register` | Public |
| POST | `/api/User/RegisterSeller` | Public |
| POST | `/api/User/register-shipper` | Public |
| POST | `/api/User/Login` | Public |
| POST | `/api/User/SendLoginOtp` | Public |
| POST | `/api/User/VerifyLoginOtp` | Public |
| POST | `/api/User/LoginGoogle` | Public |
| POST | `/api/User/LoginMicrosoft` | Public |
| POST | `/api/User/LoginFirebasePhone` | Public |
| POST | `/api/User/SendOtp` | Public |
| POST | `/api/User/LoginByPhone` | Public |
| POST | `/api/User/RefreshToken` | Public* |
| POST | `/api/User/Logout` | Public/Auth |
| POST | `/api/User/ForgotPassword` | Public |
| POST | `/api/User/VerifyResetOtp` | Public |
| POST | `/api/User/ResetPassword` | Public |

---

## 6. Key files

| Tầng | Path |
|------|------|
| Controller | `src/ShoppingFood.API/Controllers/UserController.cs` |
| Login inline | `UserController.Login` (không MediatR) |
| Filter | `src/ShoppingFood.API/Filters/AuthenticationFilter.cs` |
| JWT | `src/ShoppingFood.Core/Security/TokenHelper.cs` |
| Handlers | `src/ShoppingFood.Application/Features/Users/Commands/*` |
| Email OTP | `src/ShoppingFood.Application/Services/EmailService.cs` |
| FE Login | `ShoppingFood.FE/src/components/auth/LoginForm.tsx` |
| FE Hook | `ShoppingFood.FE/src/hooks/useAuth.ts` |
| FE Service | `ShoppingFood.FE/src/services/AuthService.ts` |
| FE Storage | `ShoppingFood.FE/src/utils/storage.ts` (`sf_token`, `sf_user`) |
| FE Http | `ShoppingFood.FE/src/services/base/HttpClient.ts` |
| FE Forgot | `ShoppingFood.FE/src/components/auth/ForgotPasswordModal.tsx` |
| FE Register | `ShoppingFood.FE/src/components/auth/RegisterForm.tsx`, `pages/RegisterPage.tsx` |

---

## 7. Acceptance Criteria

- [ ] Register Customer → login password thành công
- [ ] Thiết bị mới → RequireOtp → Send/Verify → nhận JWT
- [ ] Trusted device → login không OTP
- [ ] Google / Microsoft / Firebase phone login được (env cấu hình đúng)
- [ ] Access hết hạn → Refresh tự động trên FE; Refresh fail → về `/login`
- [ ] Logout → refresh cũ không dùng lại được
- [ ] Forgot → OTP email → Reset → login MK mới; OTP cũ không tái sử dụng
- [ ] MK mới trùng MK cũ → lỗi
- [ ] Email quên MK không tồn tại → 404 (hành vi hiện tại)

---

## 8. Cảnh báo / Thông báo hệ thống

| Message | Loại | File FE | Trigger | API | Mức độ |
|---------|------|---------|---------|-----|--------|
| Đăng nhập thành công! | success | `hooks/useAuth.ts` | Login OK | `/User/Login` (+OAuth) | Info |
| Đăng nhập thất bại | error | `useAuth.ts` | Sai MK / lỗi | `/User/Login` | Warn |
| Đăng nhập Google thành công! / thất bại | success/error | `useAuth.ts` | Google | `/User/LoginGoogle` | Info/Warn |
| Đăng nhập Microsoft thành công / thất bại | success/error | `useAuth.ts` | MS | `/User/LoginMicrosoft` | Info/Warn |
| Đăng nhập bằng số điện thoại thành công! | success | `useAuth.ts` | Firebase | `/User/LoginFirebasePhone` | Info |
| Mã OTP đã được gửi! | success | `useAuth.ts` | SendLoginOtp | `/User/SendLoginOtp` | Info |
| Gửi OTP thất bại / Xác thực OTP thất bại | error | `useAuth.ts` | OTP fail | Send/Verify | Warn |
| Mở khóa và đăng nhập thành công! | success | `useAuth.ts` | Unlock | `/User/VerifyUnlockAccount` | Info |
| Đã đăng xuất | success | `useAuth.ts` | Logout | `/User/Logout` | Info |
| Đăng ký thành công! Vui lòng đăng nhập. | success | `useAuth.ts` | Register | `/User/Register` | Info |
| Đăng ký cửa hàng thành công! Đang chờ duyệt. | success | `useAuth.ts` | RegisterSeller | `/User/RegisterSeller` | Info |
| Vui lòng nhập tên đăng nhập / mật khẩu | validation | `LoginForm.tsx` | Submit rỗng | — | Warn |
| Gửi OTP thất bại (Firebase) / Mã OTP không hợp lệ | error | `LoginForm.tsx` | Phone OTP | Firebase | Warn |
| Mã OTP đã được gửi đến email của bạn | success | `ForgotPasswordModal.tsx` | Forgot OK | `/User/ForgotPassword` | Info |
| Không tìm thấy tài khoản với email này. | error | Modal + API | Email 404 | `/User/ForgotPassword` | Warn |
| Mã OTP hợp lệ | success | `ForgotPasswordModal.tsx` | Verify OTP | `/User/VerifyResetOtp` | Info |
| Mã OTP không hợp lệ hoặc đã hết hạn. | error | Modal | OTP sai | Verify/Reset | Warn |
| Đặt lại mật khẩu thành công! | success | `ForgotPasswordModal.tsx` | Reset OK | `/User/ResetPassword` | Info |
| Vui lòng nhập email / Email không hợp lệ | validation | `ForgotPasswordModal.tsx` | Step 1 | — | Warn |
| Vui lòng nhập mã OTP / OTP phải gồm 6 số | validation | `ForgotPasswordModal.tsx` | Step 2 | — | Warn |
| Mật khẩu phải từ 6 ký tự / xác nhận không khớp | validation | `ForgotPasswordModal.tsx` | Step 3 | — | Warn |
| Mật khẩu mới phải khác mật khẩu cũ. | error | API→toast | Reset | `/User/ResetPassword` | Warn |
| Vui lòng nhập userName/password/fullName/email… | validation | `RegisterForm.tsx` | Register | — | Warn |
| Redirect `/login` (không toast) | info | `HttpClient.ts` | Refresh fail | `/User/RefreshToken` | Critical |

---

## 9. Tóm tắt

Auth = **JWT custom + Refresh + TrustedDevice OTP + OAuth/Firebase + Forgot OTP email**.  
Chi tiết luồng: [Login](../workflows/Login_Workflow.md) · [Register](../workflows/Register_Workflow.md) · [ForgotPassword](../workflows/ForgotPassword_Workflow.md).
