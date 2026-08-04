# Requirements: Hồ sơ người dùng (Profile & Account)

Tài liệu yêu cầu nghiệp vụ cho hồ sơ, mật khẩu, liên hệ, địa chỉ, khóa/mở khóa, xin xóa tài khoản và theo dõi đơn đăng ký Seller/Shipper.

> Workflow liên quan:
> - [../workflows/ChangePassword_Profile_Workflow.md](../workflows/ChangePassword_Profile_Workflow.md)
> - [../workflows/Restaurant_Seller_Workflow.md](../workflows/Restaurant_Seller_Workflow.md) (ApplySeller / Mall)
> - Auth: [Auth_Requirements.md](./Auth_Requirements.md)

---

## 1. Mục tiêu

1. Cho phép user xem/sửa hồ sơ (họ tên, giới tính, ngày sinh, avatar).
2. Đổi mật khẩu khi đã đăng nhập; đổi email/phone qua OTP.
3. Quản lý sổ địa chỉ giao hàng (CRUD + mặc định).
4. Tự khóa tài khoản + mở khóa bằng OTP; xin xóa tài khoản.
5. Xem/cập nhật trạng thái đơn Apply Seller / Shipper / Upgrade Mall.

---

## 2. Actors

| Actor | Quyền |
|-------|--------|
| **Customer / Seller / Mall / Shipper / Coordinator / Admin** | Profile, ChangePassword, Avatar, Addresses (theo role dùng) |
| **Customer** | ApplySeller, apply-shipper, RequestDeletion, LockAccount |
| **Seller / Mall** | UpgradeToMall, cập nhật SellerApplication khi NeedsInfo |
| **Guest** | Không — toàn bộ Auth JWT |

---

## 3. Functional Requirements

### 3.1. Hồ sơ & Avatar

| ID | Requirement |
|----|-------------|
| FR-PRF-01 | `GET /api/User/Profile` trả UserDto (Id, UserName, Email, Phone, Role, FullName, AvatarUrl, …) |
| FR-PRF-02 | `PUT /api/User/UpdateProfile` cập nhật FullName, Gender, DateOfBirth, AvatarUrl |
| FR-PRF-03 | `POST /api/User/UploadAvatar` upload Cloudinary → cập nhật AvatarUrl |
| FR-PRF-04 | `POST /api/User/UploadImage` upload ảnh generic (dùng chung nhiều feature) |
| FR-PRF-05 | FE: ảnh ≤ 5MB; định dạng jpg/jpeg/png/webp |

### 3.2. Đổi mật khẩu & liên hệ

| ID | Requirement |
|----|-------------|
| FR-PRF-10 | `POST /api/User/ChangePassword` — cần JWT; kiểm tra mật khẩu cũ; hash mới SHA256 |
| FR-PRF-11 | FE validate: MK hiện tại, MK mới ≥6, confirm khớp |
| FR-PRF-12 | `POST /api/User/RequestUpdateContact` — gửi OTP tới email/phone mới |
| FR-PRF-13 | `POST /api/User/VerifyUpdateContact` — xác minh OTP → cập nhật contact trên User |

### 3.3. Địa chỉ

| ID | Requirement |
|----|-------------|
| FR-PRF-20 | `GET /api/UserAddress` — danh sách địa chỉ của user |
| FR-PRF-21 | `POST /api/UserAddress` — thêm địa chỉ (tên người nhận, SĐT, địa chỉ, lat/lng nếu có) |
| FR-PRF-22 | `PUT /api/UserAddress/{id}` — cập nhật |
| FR-PRF-23 | `DELETE /api/UserAddress/{id}` — xóa |
| FR-PRF-24 | `PUT /api/UserAddress/{id}/SetDefault` — đặt mặc định (các địa chỉ khác bỏ default) |
| FR-PRF-25 | Chỉ chủ sở hữu mới sửa/xóa địa chỉ của mình |

### 3.4. Khóa / Mở khóa / Xóa tài khoản

| ID | Requirement |
|----|-------------|
| FR-PRF-30 | `POST /api/User/LockAccount` — user tự khóa (UserStatus → Blocked/Inactive theo handler) |
| FR-PRF-31 | `POST /api/User/VerifyUnlockAccount` — OTP + PreAuth → mở khóa + có thể trả JWT |
| FR-PRF-32 | `POST /api/User/RequestDeletion` — ghi `DeleteRequestedAt`; có `[Authorize]` bổ sung |
| FR-PRF-33 | Sau khóa: login password bị chặn cho đến khi unlock OTP thành công |

### 3.5. Đơn đăng ký / Applications

| ID | Requirement |
|----|-------------|
| FR-PRF-40 | `GET /api/User/SellerApplication/Status` — trạng thái đơn seller |
| FR-PRF-41 | `POST /api/User/ApplySeller` — Customer nộp đơn mở quán |
| FR-PRF-42 | `PUT /api/User/SellerApplication` — cập nhật/resubmit khi NeedsInfo |
| FR-PRF-43 | `POST /api/User/apply-shipper` — user đã login nộp đơn shipper |
| FR-PRF-44 | `GET /api/User/my-applications` — danh sách đơn của tôi |
| FR-PRF-45 | `PUT /api/User/update-shipper-application` — cập nhật đơn shipper |
| FR-PRF-46 | `POST /api/User/UpgradeToMall` — Seller xin nâng Mall |
| FR-PRF-47 | ApplicationStatus: `Pending` \| `Approved` \| `Rejected` \| `NeedsInfo` |

---

## 4. Business rules / State

### UserProfile
- 1-1 với User; chứa **Role** (Admin, Seller, Mall, Customer, Shipper, Coordinator).

### Lock / Unlock
```text
Active --LockAccount--> Locked/Blocked
Locked --VerifyUnlockAccount (OTP)--> Active + tokens
```

### Deletion request
```text
RequestDeletion → DeleteRequestedAt set (xử lý xóa thật có thể là quy trình Admin/offline)
```

### Address
- Một user nhiều địa chỉ; tối đa một **IsDefault = true** sau SetDefault.

---

## 5. APIs chính

| Method | Route | Auth |
|--------|-------|------|
| GET | `/api/User/Profile` | Auth |
| PUT | `/api/User/UpdateProfile` | Auth |
| POST | `/api/User/UploadAvatar` | Auth |
| POST | `/api/User/UploadImage` | Public* / mixed |
| POST | `/api/User/ChangePassword` | Auth |
| POST | `/api/User/RequestUpdateContact` | Auth |
| POST | `/api/User/VerifyUpdateContact` | Auth |
| POST | `/api/User/LockAccount` | Auth |
| POST | `/api/User/VerifyUnlockAccount` | Public (OTP) |
| POST | `/api/User/RequestDeletion` | Auth |
| GET | `/api/UserAddress` | Auth |
| POST | `/api/UserAddress` | Auth |
| PUT | `/api/UserAddress/{id}` | Auth |
| DELETE | `/api/UserAddress/{id}` | Auth |
| PUT | `/api/UserAddress/{id}/SetDefault` | Auth |
| GET | `/api/User/SellerApplication/Status` | Auth |
| POST | `/api/User/ApplySeller` | Auth |
| PUT | `/api/User/SellerApplication` | Auth |
| POST | `/api/User/apply-shipper` | Auth |
| GET | `/api/User/my-applications` | Auth |
| PUT | `/api/User/update-shipper-application` | Auth |
| POST | `/api/User/UpgradeToMall` | Auth Seller |

---

## 6. Key files

| Tầng | Path |
|------|------|
| Controller | `src/ShoppingFood.API/Controllers/UserController.cs` |
| Address | `src/ShoppingFood.API/Controllers/UserAddressController.cs` |
| Handlers | `Application/Features/Users/Commands/*`, `UserAddresses/*` |
| Photo | `Application/Services/PhotoService.cs` |
| FE Profile | `ShoppingFood.FE/src/pages/ProfilePage.tsx` |
| FE Dashboard profile | `pages/shared/DashboardProfilePage.tsx` |
| FE Modals | `components/auth/ChangePasswordModal.tsx`, `UpdateProfileModal.tsx`, `ChangeContactModal.tsx` |
| FE Address | `components/profile/UserAddressManager.tsx` |
| FE Applications | `components/profile/CustomerApplications.tsx` |
| FE Seller apply | `pages/SellerApplyPage.tsx`, `seller/SellerMallApplicationPage.tsx` |
| FE AuthService | `services/AuthService.ts`, `UserService.ts`, `UserAddressService.ts` |

---

## 7. Acceptance Criteria

- [ ] GET Profile trả đúng role và avatar
- [ ] UpdateProfile + UploadAvatar phản ánh trên UI
- [ ] ChangePassword: sai MK cũ → lỗi; đúng → login bằng MK mới OK
- [ ] Đổi contact: OTP → email/phone mới dùng được
- [ ] Address CRUD + SetDefault chỉ còn 1 mặc định
- [ ] LockAccount → không login được → Unlock OTP → login lại
- [ ] RequestDeletion set DeleteRequestedAt
- [ ] ApplySeller / apply-shipper tạo đơn Pending; NeedsInfo cho phép update

---

## 8. Cảnh báo / Thông báo hệ thống

| Message | Loại | File FE | Trigger | API | Mức độ |
|---------|------|---------|---------|-----|--------|
| Cập nhật thông tin thành công! | success | `ProfilePage.tsx`, `UpdateProfileModal.tsx` | Save profile | `/User/UpdateProfile` | Info |
| Vui lòng nhập họ tên | validation | `ProfilePage.tsx` | Submit rỗng | — | Warn |
| Cập nhật ảnh đại diện thành công! | success | `ProfilePage.tsx` | Upload avatar | `/User/UploadAvatar` | Info |
| Ảnh không được vượt quá 5MB | error | `ProfilePage.tsx` | File size | — | Warn |
| Chỉ cho phép tải lên các tệp ảnh (.jpg, .jpeg, .png, .webp). | error | `ProfilePage.tsx` | MIME | — | Warn |
| Tải ảnh đại diện thất bại do lỗi kết nối mạng. | error | `ProfilePage.tsx` | Network | UploadAvatar | Warn |
| Thay đổi mật khẩu thành công! | success | `ChangePasswordModal.tsx` | ChangePassword OK | `/User/ChangePassword` | Info |
| Vui lòng nhập MK hiện tại / mới / xác nhận không khớp | validation | `ChangePasswordModal.tsx` | Form | — | Warn |
| Mật khẩu cũ không chính xác. | error | API→toast | Sai MK cũ | `/User/ChangePassword` | Warn |
| Mã OTP đã gửi email / Xác thực email thành công! | success | `ChangeContactModal.tsx` | Contact OTP | Request/VerifyUpdateContact | Info |
| Vui lòng nhập email hợp lệ / OTP hợp lệ | validation | `ChangeContactModal.tsx` | Form | — | Warn |
| Tài khoản đã bị khóa. | success | `ProfilePage.tsx` | LockAccount | `/User/LockAccount` | Warn |
| Đã gửi yêu cầu xóa tài khoản. | success | `ProfilePage.tsx` | RequestDeletion | `/User/RequestDeletion` | Critical |
| Đã thêm/cập nhật/xóa địa chỉ / đặt mặc định | success | `UserAddressManager.tsx` | Address CRUD | `/UserAddress*` | Info |
| Vui lòng nhập tên người nhận / SĐT / địa chỉ | validation | `UserAddressManager.tsx` | Form | — | Warn |
| Không tìm thấy địa chỉ. | error | API | Update/Delete sai id | `/UserAddress/{id}` | Warn |
| Đăng ký thành công! Vui lòng chờ phê duyệt. | success | `SellerApplyPage.tsx` | ApplySeller | `/User/ApplySeller` | Info |
| Yêu cầu lên Mall đã được gửi thành công. | success | `useAuth.ts` / Mall page | UpgradeToMall | `/User/UpgradeToMall` | Info |
| Cập nhật và gửi lại đơn thành công! | success | `CustomerApplications.tsx`, Mall page | Resubmit | SellerApplication PUT | Info |
| Đăng ký tài xế thành công! / Gửi yêu cầu đăng ký tài xế thành công! | success | Shipper apply pages | Register/apply shipper | register-shipper / apply-shipper | Info |
| Vui lòng điền đầy đủ thông tin và tải lên các ảnh yêu cầu. | error | Apply pages | Validation | — | Warn |
| Tải thông tin cá nhân thất bại do lỗi kết nối mạng. | error | `ProfilePage.tsx` | Load profile | `/User/Profile` | Warn |

---

## 9. Tóm tắt

Profile = **hồ sơ + avatar + đổi MK/contact OTP + địa chỉ + lock/unlock/xóa + theo dõi applications**.  
Workflow: [ChangePassword_Profile_Workflow.md](../workflows/ChangePassword_Profile_Workflow.md).
