# Cảnh báo — Auth

> Requirements: [../Auth_Requirements.md](../Auth_Requirements.md) · Workflows: Login / Register / ForgotPassword

| ID | Message | Loại | Mức độ | Nơi hiện | File | Trigger | API |
|----|---------|------|--------|----------|------|---------|-----|
| AL-AUTH-01 | Đăng nhập thành công! | success | Info | Toast | `hooks/useAuth.ts` | Login OK | `POST /User/Login` |
| AL-AUTH-02 | Đăng nhập thất bại | error | Warn | Toast | `useAuth.ts` | Sai MK / lỗi | `/User/Login` |
| AL-AUTH-03 | Đăng nhập Google thành công! / thất bại | success/error | Info/Warn | Toast | `useAuth.ts` | Google OAuth | `/User/LoginGoogle` |
| AL-AUTH-04 | Đăng nhập Microsoft thành công / thất bại | success/error | Info/Warn | Toast | `useAuth.ts` | MS OAuth | `/User/LoginMicrosoft` |
| AL-AUTH-05 | Đăng nhập bằng số điện thoại thành công! | success | Info | Toast | `useAuth.ts` | Firebase phone | `/User/LoginFirebasePhone` |
| AL-AUTH-06 | Mã OTP đã được gửi! | success | Info | Toast | `useAuth.ts` | Send login/unlock OTP | `/User/SendLoginOtp` |
| AL-AUTH-07 | Gửi OTP thất bại / Xác thực OTP thất bại | error | Warn | Toast | `useAuth.ts` | OTP fail | Send/Verify OTP |
| AL-AUTH-08 | Mở khóa và đăng nhập thành công! | success | Info | Toast | `useAuth.ts` | Unlock | `/User/VerifyUnlockAccount` |
| AL-AUTH-09 | Đã đăng xuất | success | Info | Toast | `useAuth.ts` | Logout | `/User/Logout` |
| AL-AUTH-10 | Đăng ký thành công! Vui lòng đăng nhập. | success | Info | Toast | `useAuth.ts` | Register customer | `/User/Register` |
| AL-AUTH-11 | Đăng ký cửa hàng thành công! Đang chờ duyệt. | success | Info | Toast | `useAuth.ts` | Register seller | `/User/RegisterSeller` |
| AL-AUTH-12 | Yêu cầu lên Mall đã được gửi thành công. | success | Info | Toast | `useAuth.ts` | Upgrade Mall | `/User/UpgradeToMall` |
| AL-AUTH-13 | Vui lòng nhập tên đăng nhập / mật khẩu | validation | Warn | Inline | `LoginForm.tsx` | Submit rỗng | — |
| AL-AUTH-14 | Gửi OTP thất bại (Firebase) / Mã OTP không hợp lệ | error | Warn | Toast | `LoginForm.tsx` | Firebase OTP | Firebase |
| AL-AUTH-15 | Đăng nhập Google thất bại | error | Warn | Toast | `LoginForm.tsx` | Popup fail | — |
| AL-AUTH-16 | Mã OTP đã gửi email… | success | Info | Toast | `ForgotPasswordModal.tsx` | Forgot step1 | `/User/ForgotPassword` |
| AL-AUTH-17 | Không tìm thấy tài khoản với email này. | error | Warn | Toast | Forgot modal | Email 404 | ForgotPassword |
| AL-AUTH-18 | Mã OTP hợp lệ | success | Info | Toast | Forgot modal | Verify OTP | `/User/VerifyResetOtp` |
| AL-AUTH-19 | Mã OTP không hợp lệ hoặc đã hết hạn. | error | Warn | Toast | Forgot modal | OTP sai/hết hạn | Verify/Reset |
| AL-AUTH-20 | Đặt lại mật khẩu thành công! | success | Info | Toast | Forgot modal | Reset OK | `/User/ResetPassword` |
| AL-AUTH-21 | Vui lòng nhập email / Email không hợp lệ | validation | Warn | Inline | Forgot modal | Step1 | — |
| AL-AUTH-22 | Vui lòng nhập mã OTP / OTP phải 6 số | validation | Warn | Inline | Forgot modal | Step2 | — |
| AL-AUTH-23 | MK mới từ 6 ký tự / xác nhận không khớp | validation | Warn | Inline | Forgot modal | Step3 | — |
| AL-AUTH-24 | Mật khẩu mới phải khác mật khẩu cũ. | error | Warn | Toast | Forgot modal | Same hash | ResetPassword |
| AL-AUTH-25 | Không thể gửi email OTP lúc này… | error | Critical | Toast | Forgot modal | SMTP fail | ForgotPassword |
| AL-AUTH-26 | BE: Invalid Google credential / Google Auth not configured | error | Critical | Toast (API msg) | LoginGoogleHandler | Config/token | LoginGoogle |
| AL-AUTH-27 | BE: Invalid refresh token or token expired | error | Critical | — | RefreshTokenHandler | Refresh fail | RefreshToken |
| AL-AUTH-28 | Validation Register (userName/password/email/phone/…) | validation | Warn | Inline/Toast | `RegisterForm.tsx` | Register | `/User/Register*` |
| AL-AUTH-29 | Đăng ký tài xế thành công! … | success | Info | Toast | `ShipperApplyPage.tsx` | Public shipper | `/User/register-shipper` |
| AL-AUTH-30 | Đăng ký thành công! Vui lòng chờ phê duyệt. | success | Info | Toast | `SellerApplyPage.tsx` | ApplySeller | `/User/ApplySeller` |

## Checklist QA Auth Alerts

- [ ] Sai MK → AL-AUTH-02
- [ ] Thiết bị mới → OTP flow → AL-AUTH-06/07
- [ ] Forgot email không tồn tại → AL-AUTH-17 (enumeration — xem FR bảo mật)
- [ ] Reset OTP hết hạn → AL-AUTH-19
