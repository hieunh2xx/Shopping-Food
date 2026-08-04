# Tài liệu Quy trình: Đăng ký tài khoản (Register)

Tài liệu này mô tả chi tiết luồng **đăng ký Customer** trong hệ thống **Shopping Food**, kèm biến thể **RegisterSeller** và **register-shipper**.

> Customer/Seller đăng ký yêu cầu xác minh số điện thoại qua **Firebase ID Token** (trừ khi `OtpCode`/`IdToken` = `"bypass"` — dùng cho test). Shipper public tạo User Role=Customer + `ShipperApplication` Pending.

---


---

## Phần A — UI Interaction Trace (Nút bấm → Code → Data → Hiển thị)

> UI Trace — Register / Apply  
> Mỗi thao tác trả lời: **nút ở đâu** · **bấm chạy file/hàm nào** · **API/BE đâu** · **data trả về** · **hiển thị thế nào**.


---

### UT-REG-01 — Đăng ký Customer (`"Đăng ký"`)

#### 1. Giao diện nút bấm ở đâu?

| Mục | Giá trị |
|-----|---------|
| **Route** | `/register` |
| **Page** | `pages/RegisterPage.tsx` → render `RegisterForm` |
| **Component** | `components/auth/RegisterForm.tsx` |
| **Nhãn nút** | `"Đăng ký"` (submit) |
| **Loại control** | `<Button type="submit">` trong `<form onSubmit={handleSubmit}>` |
| **Điều kiện hiện** | `!isSeller` (Customer) |

#### 2. Bấm xong chạy đến đâu? (Frontend)

```text
form onSubmit
  → RegisterForm.handleSubmit (RegisterForm.tsx)
  → validateStep1()
  → useAuth().register({ userName, password, fullName, email, phone, role:'Customer', idToken:'bypass' })
       (hooks/useAuth.ts)
  → authService.register(data) (services/AuthService.ts)
  → httpClient.post(API_ENDPOINTS.AUTH.REGISTER, data)
```

#### 3. Backend chạy đoạn nào?

```text
POST /api/User/Register
  → AuthenticationFilter (bypass)
  → UserController.Register
  → MediatR → AddUserHandler / RegisterCommand
  → Hash password, tạo USER_ACCOUNT + USER_PROFILE (Role=Customer)
  → return ApiResponse
```

#### 4. Dữ liệu trả về ở đâu?

```json
{ "code": 200, "error": false, "message": "...", "data": { /* user dto */ } }
```

Lỗi validation thường trả `errors` dictionary theo field.

#### 5. Làm sao hiển thị ra?

| Nhánh | Hành vi UI |
|-------|------------|
| Success | `toast.success('Đăng ký thành công! Vui lòng đăng nhập.')` → `navigate(ROUTES.LOGIN)` |
| Error field | `setErrors(mappedErrors)` hiện dưới Input |
| Error chung | toast từ `useAuth.register` |

#### 6. Sơ đồ nhanh

```mermaid
sequenceDiagram
    participant Btn as Nút Đăng ký
    participant FE as RegisterForm/useAuth
    participant API as UserController.Register
    participant UI as Toast+Navigate
    Btn->>FE: handleSubmit
    FE->>API: POST /User/Register
    API-->>FE: ApiResponse
    FE->>UI: toast + /login
```

---

### UT-REG-02 — Đăng ký Seller (2 bước, `"Hoàn tất đăng ký"`)

#### 1. Giao diện nút bấm ở đâu?

| Mục | Giá trị |
|-----|---------|
| **Route** | `/register/seller` |
| **Page** | `RegisterPage` với `isSeller` |
| **Component** | `RegisterForm.tsx` step 2 |
| **Nhãn nút** | Submit bước 2 (sau `"Tiếp tục"` ở step 1) |
| **Điều kiện hiện** | `isSeller && step === 2` |

#### 2. Frontend

```text
Step1: Button onClick={handleNext} → validateStep1 → setStep(2)
Step2: form submit → handleSubmit
  → useAuth().registerSeller({ ...account, businessName, businessAddress, businessLicenseUrl, shopImageUrl, contactInfo, idToken })
  → authService.registerSeller → POST /User/RegisterSeller
```

Upload giấy phép / ảnh quán: `handleFileChange` / `handleShopFileChange` → `authService.uploadImage` → `POST /User/UploadImage` → gán URL vào form.

#### 3. Backend

```text
POST /api/User/RegisterSeller
  → RegisterSellerCommand / Handler
  → Tạo User (Seller pending) + SellerApplication + (Restaurant khi duyệt)
```

#### 4–5. Response & hiển thị

| Success | `toast.success('Đăng ký cửa hàng thành công! Đang chờ duyệt.')` → `navigate(/login)` |
| Error | `setErrors` + có thể `setStep(1)` nếu lỗi userName/email/phone |

Validate file: toast `File không được vượt quá 5MB` / sai định dạng.

---

### UT-REG-03 — Apply Seller khi đã login (`"Gửi đăng ký"`)

#### 1. Giao diện

| Mục | Giá trị |
|-----|---------|
| **Route** | `/seller/apply` (PrivateRoute Customer) |
| **Page** | `pages/SellerApplyPage.tsx` |
| **Nhãn nút** | Submit form `"Đăng ký trở thành Người Bán"` |

#### 2. Frontend

```text
handleSubmit
  → validate files (license + shop image, size/type)
  → authService.uploadImage(license) → imageUrl
  → authService.uploadImage(shop) → imageUrl
  → authService.applySeller({ businessName, businessAddress, contactInfo, businessLicenseUrl, shopImageUrl })
  → POST /User/ApplySeller
```

#### 3. Backend

```text
POST /api/User/ApplySeller (Auth)
  → ApplySellerHandler
  → Insert SELLER_APPLICATION Status=Pending
```

#### 4–5. Hiển thị

| Success | toast `Đăng ký thành công! Vui lòng chờ phê duyệt.` → `navigate(PROFILE)` |
| Already seller | toast `Bạn đã là Người Bán hoặc Mall.` |
| Pending exists | toast `Bạn đang có một yêu cầu... chờ duyệt.` |
| Missing file | toast validate trước khi gọi API |

---

### UT-REG-04 — Đăng ký Shipper public (`ShipperApplyPage`)

#### 1. Giao diện

| Mục | Giá trị |
|-----|---------|
| **Route** | `/register/shipper` |
| **Page** | `pages/ShipperApplyPage.tsx` |
| **Nhãn** | Multi-step; cuối form `onSubmit={handleSubmit}` nút gửi đăng ký |

#### 2. Frontend

```text
handleNext / handleBack (steps)
handleFileSelect → validate → set file state
handleSubmit
  → upload lần lượt CMND/GPLX/cavet/avatar qua authService.uploadImage
  → authService.registerShipper({ ...account, vehicle, urls })
  → POST /User/register-shipper
```

#### 3. Backend

```text
POST /api/User/register-shipper (Public)
  → tạo User + ShipperApplication Pending
```

#### 4–5. Hiển thị

| Success | toast `Đăng ký tài xế thành công! Vui lòng chờ phê duyệt.` → `navigate(HOME)` |
| Upload fail | toast `Lỗi tải lên {name}: ...` dừng submit |
| Validation | toast / `errors` trên field |

---

### UT-REG-05 — Apply Shipper khi đã login (`"Gửi yêu cầu"`)

#### 1. Giao diện

| Mục | Giá trị |
|-----|---------|
| **Route** | `/shipper/apply` (auth Customer/Seller/Mall) |
| **Page** | `pages/shipper/AuthShipperApplyPage.tsx` |
| **Nhãn nút** | `"Gửi yêu cầu"` / `"Đang gửi..."` |
| **Nút phụ** | `"Hủy bỏ"` → `navigate(-1)` |

#### 2. Frontend

```text
handleSubmit
  → validate identityCardNumber, plate, 4 files bắt buộc
  → upload 4 ảnh tuần tự (uploadImage)
  → authService.applyShipper({ identityCardNumber, vehicleType, vehiclePlateNumber, urls... })
  → POST /User/apply-shipper
```

#### 3. Backend

```text
POST /api/User/apply-shipper (Auth)
  → ApplyShipperHandler → SHIPPER_APPLICATION Pending
```

#### 4–5. Hiển thị

| Success | toast `Gửi yêu cầu đăng ký tài xế thành công!...` → `navigate(PROFILE)` |
| Missing fields | toast `Vui lòng điền đủ thông tin và tải lên các tệp tin bắt buộc` |
| Error API | `toast.error(res.message)` |

#### 6. Sơ đồ Apply (Seller/Shipper auth)

```mermaid
sequenceDiagram
    participant UI as Apply Page
    participant Up as UploadImage
    participant API as ApplySeller/Shipper
    UI->>Up: POST /User/UploadImage (xN)
    Up-->>UI: imageUrl
    UI->>API: POST Apply*
    API-->>UI: ApiResponse
    UI->>UI: toast + navigate PROFILE
```

---

## Call chain tóm tắt

| UT | FE entry | Service | API |
|----|----------|---------|-----|
| REG-01 | `RegisterForm.handleSubmit` | `authService.register` | `POST /User/Register` |
| REG-02 | `RegisterForm.handleSubmit` | `registerSeller` | `POST /User/RegisterSeller` |
| REG-03 | `SellerApplyPage.handleSubmit` | `applySeller` | `POST /User/ApplySeller` |
| REG-04 | `ShipperApplyPage.handleSubmit` | `registerShipper` | `POST /User/register-shipper` |
| REG-05 | `AuthShipperApplyPage.handleSubmit` | `applyShipper` | `POST /User/apply-shipper` |

**Duyệt hồ sơ:** xem [13_Admin_Support_UI_Trace.md](./13_Admin_Support_UI_Trace.md) UT-ADM-01.


---

## Phần B — Workflow nghiệp vụ & Backend (chi tiết luồng)
## 1. Luồng Tổng Quan (Workflow) — Customer

1. **Yêu cầu:** Người dùng mở `/register` → điền UserName, Password, FullName, Email, Phone.
2. **Xác minh SĐT (FE):** Firebase Recaptcha + `signInWithPhoneNumber` → lấy `idToken`.
3. **Gửi đăng ký:** `useAuth.register` → `POST /api/User/Register` với body + `idToken` / `otpCode`.
4. **Validation:** `AddUserCommandValidator` (FluentValidation) — unique UserName/Email/Phone, password ≥ 6.
5. **Verify Firebase:** `AddUserHandler` verify ID token, khớp `phone_number` với `request.Phone`.
6. **Tạo tài khoản:** Hash password SHA256, tạo `USER_ACCOUNT` (Active) + `USER_PROFILE` (Role = Customer).
7. **Hoàn tất:** API success → toast `'Đăng ký thành công! Vui lòng đăng nhập.'` → chuyển `/login`.

```mermaid
sequenceDiagram
    actor U as Người dùng
    participant FE as RegisterForm / useAuth
    participant FB as Firebase Auth
    participant API as UserController
    participant V as AddUserCommandValidator
    participant H as AddUserHandler
    participant DB as SQL Server

    U->>FE: Điền form đăng ký
    FE->>FB: signInWithPhoneNumber → idToken
    FE->>API: POST /api/User/Register
    API->>V: FluentValidation
    V-->>API: OK / 400
    API->>H: AddUserHandler
    H->>FB: VerifyIdTokenAsync
    H->>DB: Insert User + UserProfile
    H-->>FE: Success
    FE-->>U: Toast → /login
```

---

## Bước 1: Mở trang Đăng ký (Frontend)

**Thông tin:**
- **URL (FE):** `/register` (Customer) · `/register/seller` (Seller variant)
- **Page:** `ShoppingFood.FE/src/pages/RegisterPage.tsx`
- **Form:** `ShoppingFood.FE/src/components/auth/RegisterForm.tsx` — prop `isSeller?: boolean`
- **Hook:** `ShoppingFood.FE/src/hooks/useAuth.ts` → `register` / `registerSeller`
- **Firebase:** `ShoppingFood.FE/src/config/firebase.ts` + Recaptcha container `recaptcha-register-container`

**Gọi API:**

```typescript
// AuthService.ts
async register(data: IRegisterRequest): Promise<IApiResponse<IUserDto>> {
  return httpClient.post<IApiResponse<IUserDto>>(API_ENDPOINTS.AUTH.REGISTER, data);
}
```

**Toast khi thành công** (`useAuth.register`):

```typescript
toast.success('Đăng ký thành công! Vui lòng đăng nhập.');
```

---

## Bước 2: API Register Customer

**Thông tin:**
- **URL:** `/api/User/Register`
- **HTTP Method:** POST
- **Auth:** Public (bypass `AuthenticationFilter` — path starts with `/api/User/Register`)

**Controller:** `src/ShoppingFood.API/Controllers/UserController.cs` — Lines **33–38**

```csharp
[HttpPost("Register")]
public async Task<ActionResult<ApiResponse>> Register([FromBody] AddUserCommand command)
{
    var response = await _mediator.Send(command);
    return Ok(response);
}
```

**Command:** `src/ShoppingFood.Application/Features/Users/Commands/AddUserCommand.cs`

```csharp
public class AddUserCommand : BaseCommand, IRequest<ApiResponse>
{
    public string UserName { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.Customer;
    public string? AvatarUrl { get; set; }
    public string OtpCode { get; set; } = string.Empty;
    public string IdToken { get; set; } = string.Empty;
}
```

---

## Bước 3: Validation (FluentValidation)

**File:** `src/ShoppingFood.Application/Features/Users/Commands/AddUserCommandValidator.cs`

| Rule | Điều kiện |
|------|-----------|
| UserName | Required, max 50, **unique** |
| Password | Required, **min 6** |
| FullName | Required, max 100 |
| Email | Required, email format, **unique** |
| Phone | Required, regex `^\d{9,15}$`, **unique** |

Chạy qua MediatR `ValidationBehaviour` trước Handler — lỗi → HTTP 400.

---

## Bước 4: Handler — Firebase + tạo User

**File:** `src/ShoppingFood.Application/Features/Users/Commands/AddUserHandler.cs`  
**Class:** `AddUserHandler`  
**Method:** `Handle`

```csharp
var otpToken = !string.IsNullOrEmpty(request.OtpCode) ? request.OtpCode : request.IdToken;
if (otpToken != "bypass")
{
    // Bắt buộc Firebase ID Token
    decodedToken = await FirebaseAuth.DefaultInstance.VerifyIdTokenAsync(otpToken, cancellationToken);
    // Lấy phone_number từ claims, chuẩn hóa +84 → 0...
    if (phone != request.Phone)
        return ApiResponse.Failure(400, "Phone number in token does not match requested phone.");
}

var user = _mapper.Map<User>(request);
user.Id = Guid.NewGuid();
user.PasswordHash = HashPassword(request.Password); // SHA256 → Base64
user.Status = UserStatus.Active;

var profile = new UserProfile
{
    Id = Guid.NewGuid(),
    UserAccountId = user.Id,
    FullName = request.FullName,
    Role = request.Role, // mặc định Customer
    ...
};
user.Profile = profile;
_userRepository.Add(user);
await _unitOfWork.SaveChangesAsync();
return ApiResponse.Success(userDto, "User registered successfully");
```

**Database:**

| Bảng | Việc |
|------|------|
| `USER_ACCOUNT` | Insert UserName, PasswordHash, Email, Phone, Status=Active |
| `USER_PROFILE` | Insert FullName, Role=Customer, AvatarUrl |

---

## Biến thể A: RegisterSeller

**Mục đích:** Đăng ký đồng thời tài khoản + nộp **SellerApplication** (chờ Admin duyệt).

| Mục | Chi tiết |
|-----|----------|
| FE URL | `/register/seller` — `RegisterForm isSeller={true}` |
| API | `POST /api/User/RegisterSeller` |
| Controller | `UserController.RegisterSeller` Lines **40–45** |
| Command | `AddSellerCommand.cs` — thêm BusinessName, BusinessAddress, BusinessLicenseUrl, ShopImageUrl, ContactInfo |
| Handler | `AddSellerHandler.cs` — Firebase verify giống Customer; Role mặc định **Seller**; tạo `SellerApplication` Pending |
| Toast FE | `'Đăng ký cửa hàng thành công! Đang chờ duyệt.'` |

```csharp
[HttpPost("RegisterSeller")]
public async Task<ActionResult<ApiResponse>> RegisterSeller([FromBody] AddSellerCommand command)
{
    var response = await _mediator.Send(command);
    return Ok(response);
}
```

**DB thêm:** `SELLER_APPLICATION` (Status = Pending).

---

## Biến thể B: Register Shipper (public)

**Mục đích:** Form công khai đăng ký làm shipper — tạo User (Profile Role vẫn **Customer** lúc đầu) + `ShipperApplication` Pending; Admin duyệt mới lên Role Shipper / tạo ShipperProfile.

| Mục | Chi tiết |
|-----|----------|
| FE URL | `/register/shipper` — `ShipperApplyPage.tsx` |
| API | `POST /api/User/register-shipper` |
| Controller | `UserController.RegisterShipper` Lines **47–52** |
| Command/Handler | `RegisterShipperCommand.cs` / `RegisterShipperHandler.cs` |
| Message | `"Shipper registration submitted successfully. Application is pending review."` |

```csharp
[HttpPost("register-shipper")]
public async Task<ActionResult<ApiResponse>> RegisterShipper([FromBody] RegisterShipperCommand command)
{
    var response = await _mediator.Send(command);
    return Ok(response);
}
```

```csharp
// RegisterShipperHandler — Profile.Role = UserRole.Customer
// + ShipperApplication Pending
```

**DB thêm:** `SHIPPER_APPLICATION`.

> **Lưu ý bypass:** Filter bypass `/api/User/Register*` — `register-shipper` (có dấu gạch) có thể **không** match `RegisterShipper`; nếu gặp 401, kiểm tra `AuthenticationFilter` / seed RBAC endpoint public.

**Đường đăng ký shipper khi đã login:** `POST /api/User/apply-shipper` (Auth) — xem Profile / Apply flows.

---

## Sơ đồ file đi qua (Call chain)

```text
RegisterPage.tsx
  ↓
RegisterForm.tsx  (+ Firebase Recaptcha)
  ↓
useAuth.register / registerSeller
  ↓
AuthService.register / registerSeller
  ↓
UserController.Register / RegisterSeller / register-shipper
  ↓
ValidationBehaviour → AddUserCommandValidator (Customer)
  ↓
AddUserHandler / AddSellerHandler / RegisterShipperHandler
  ↓
FirebaseAdmin VerifyIdToken (Customer/Seller)
  ↓
USER_ACCOUNT + USER_PROFILE (+ SELLER_APPLICATION / SHIPPER_APPLICATION)
```

| Vai trò | Đường dẫn đầy đủ |
|---------|------------------|
| UI | `ShoppingFood.FE/src/components/auth/RegisterForm.tsx` |
| Hook | `ShoppingFood.FE/src/hooks/useAuth.ts` |
| Service | `ShoppingFood.FE/src/services/AuthService.ts` |
| Controller | `src/ShoppingFood.API/Controllers/UserController.cs` |
| Customer Handler | `.../AddUserHandler.cs` + `AddUserCommandValidator.cs` |
| Seller Handler | `.../AddSellerHandler.cs` |
| Shipper Handler | `.../RegisterShipperHandler.cs` |

---

## Các thông báo (Toast / Message)

| Message | Nơi | Trigger |
|---------|-----|---------|
| `Đăng ký thành công! Vui lòng đăng nhập.` | `useAuth.register` | Customer OK |
| `Đăng ký cửa hàng thành công! Đang chờ duyệt.` | `useAuth.registerSeller` | Seller OK |
| `User registered successfully` | API message | Handler success |
| `UserName already exists.` / Email / Phone | Validation | Trùng dữ liệu |
| `Firebase ID Token is required for registration.` | Handler | Thiếu token |
| `Invalid Firebase ID Token: ...` | Handler | Token sai |
| `Phone number in token does not match...` | Handler | SĐT không khớp |
| `Dữ liệu không hợp lệ hoặc đã tồn tại` | FE catch fallback | 400 generic |

---

## Các cơ chế bảo mật quan trọng

1. **Xác minh SĐT Firebase** trước khi tạo Customer/Seller (chống đăng ký spam số ảo nếu Firebase cấu hình đúng).
2. **Unique constraints** UserName / Email / Phone ở validator + DB filtered unique indexes.
3. **Password min 6 + SHA256 hash.**
4. **Bypass `"bypass"`** chỉ nên dùng môi trường test — không bật trên production.
5. Seller/Shipper application **Pending** — chưa có quyền bán/giao cho đến khi Admin approve.

---

## Checklist tự test

- [ ] `/register` — thiếu Firebase token → lỗi
- [ ] Đăng ký trùng UserName/Email/Phone → validation error
- [ ] Đăng ký Customer thành công → login được bằng mật khẩu
- [ ] `/register/seller` — tạo được SellerApplication Pending
- [ ] `/register/shipper` — tạo được ShipperApplication Pending
- [ ] Password < 6 ký tự → bị chặn

---

## Tóm tắt

Đăng ký Customer = **form FE + Firebase phone verify + `POST /Register` + AddUserHandler**. Seller/Shipper là biến thể tạo thêm đơn ứng tuyển chờ duyệt.

> Liên kết: [Login_Workflow.md](./Login_Workflow.md) · [ForgotPassword_Workflow.md](./ForgotPassword_Workflow.md) · [INDEX](../ONBOARDING_INDEX.md)
