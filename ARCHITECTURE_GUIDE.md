# 📚 Shopping Food — Hướng Dẫn Kiến Trúc & Nghiệp Vụ

> Tài liệu này mô tả **từng nghiệp vụ** của hệ thống và **vai trò cụ thể** của từng project con (Solution) trong kiến trúc Clean Architecture .NET 8.

---

## 🗂️ Tổng Quan Cấu Trúc Solution

```
ShoppingFood.sln
├── ShoppingFood.Core          ← Tầng lõi dùng chung (không phụ thuộc vào ai)
├── ShoppingFood.Domain        ← Tầng dữ liệu: Entities + DbContext
├── ShoppingFood.Dto           ← Tầng truyền dữ liệu: DTO + Security Principal
├── ShoppingFood.Repository    ← Tầng truy cập CSDL: Repository + UnitOfWork
├── ShoppingFood.Application   ← Tầng nghiệp vụ: CQRS Handlers + Validators
└── ShoppingFood.API           ← Tầng trình bày: Controllers + Filters + Program
```

### Sơ đồ phụ thuộc (Dependency Flow)

```
API  →  Application  →  Repository  →  Domain  →  Core
 ↓           ↓               ↓            ↓
Dto         Dto             Core         Core
```

> **Quy tắc vàng**: Tầng dưới **không bao giờ** biết đến tầng trên. `Core` không import bất kỳ project nào khác.

---

## 1️⃣ ShoppingFood.Core — Tầng Lõi Dùng Chung

**Mục đích**: Chứa các thành phần trừu tượng, interface, base class và công cụ dùng chung cho **toàn bộ hệ thống**. Không phụ thuộc vào bất kỳ project nào khác.

### 📁 Base/

| File | Vai trò |
|------|---------|
| `ApiResponse.cs` | Chuẩn hóa **tất cả response** trả về từ API. Bao gồm `Error` (bool), `Code` (HTTP status), `Message`, `Data` (payload), `Total` (tổng bản ghi cho phân trang). Có 2 static factory: `Success(data)` và `Failure(code, message)`. |
| `BaseCommand.cs` | Lớp cha trừu tượng cho **mọi lệnh ghi dữ liệu** (POST/PUT/DELETE). Tự động chứa `CurrentUserId` — được `AuthenticationFilter` điền vào trước khi handler xử lý. |
| `BaseQuery.cs` | Lớp cha trừu tượng cho **mọi truy vấn đọc dữ liệu** (GET). Chứa `CurrentUserId`, `Filter` (từ khóa tìm kiếm), `Skip` và `Take` (phân trang). |

### 📁 Interfaces/

| File | Vai trò |
|------|---------|
| `IAsyncRepository<T>` | **Hợp đồng** định nghĩa đầy đủ 7 thao tác CRUD bất đồng bộ: `GetByIdAsync`, `GetAllAsync`, `GetAsync` (có filter + include + phân trang), `GetCountAsync`, `ExistsAsync`, `Add`, `Update`, `Delete`. Mọi repository cụ thể phải tuân theo interface này. |
| `IUnitOfWork.cs` | **Hợp đồng** điều phối việc lưu dữ liệu và ghi log: `SaveChangesAsync()` — lưu toàn bộ thay đổi vào DB; `LogErrorAsync(action, ex)` — ghi exception vào bảng `ErrorLog`; `LogActionAsync(actionLog)` — ghi hành vi người dùng vào bảng `ActionLog`. |
| `IActionLog.cs` | Interface xác định cấu trúc của một bản ghi audit log: `UserId`, `UserName`, `Action`, `Message`, `CreatedAt`, `CreatedBy`. Tách biệt Core khỏi Domain model cụ thể. |

### 📁 Repository/

| File | Vai trò |
|------|---------|
| `RepositoryBase<T>` | **Triển khai mặc định** của `IAsyncRepository<T>` sử dụng EF Core `DbContext`. Hỗ trợ eager loading (`Include`), lọc điều kiện (`Where`), sắp xếp (`OrderBy`), phân trang (`Skip`/`Take`), và tắt tracking (`AsNoTracking`) để tối ưu hiệu năng đọc. |

### 📁 Behaviors/ (MediatR Pipeline)

| File | Vai trò |
|------|---------|
| `ValidationBehaviour<TRequest, TResponse>` | **Middleware MediatR** tự động chạy **trước mọi handler**. Thu thập tất cả `IValidator<TRequest>` đã đăng ký, chạy validation đồng thời (`Task.WhenAll`), nếu có lỗi thì ném `ValidationException` — bị bắt bởi middleware HTTP để trả về lỗi 400. |
| `UnhandledExceptionBehaviour<TRequest, TResponse>` | **Middleware MediatR** bao quanh toàn bộ handler bằng try/catch. Khi có exception không mong muốn, tự động ghi vào `ErrorLog` qua `IUnitOfWork` trước khi ném lại exception để `ExceptionHandlingMiddleware` xử lý tiếp. |

### 📁 Security/

| File | Vai trò |
|------|---------|
| `TokenHelper.cs` | Công cụ JWT tĩnh: `GenerateToken(username, secretKey, ...)` — tạo JWT token HMAC-SHA256 với thời hạn 60 phút; `GetUsernameFromToken(token, config)` — giải mã token, trích xuất claim `sub` hoặc `name` để xác định danh tính người dùng. |

### 📁 Middlewares/

| File | Vai trò |
|------|---------|
| `ExceptionHandlingMiddleware.cs` | **Bộ lọc lỗi toàn cục** ở tầng HTTP. Bắt exception từ toàn bộ pipeline, phân loại: `ValidationException` → 400, `UnauthorizedAccessException` → 401, `KeyNotFoundException` → 404, còn lại → 500 + ghi `ErrorLog`. Trả về JSON chuẩn `ApiResponse`. |

---

## 2️⃣ ShoppingFood.Domain — Tầng Dữ Liệu

**Mục đích**: Định nghĩa **tất cả entity** ánh xạ trực tiếp sang bảng CSDL và cấu hình EF Core Fluent API. Chỉ phụ thuộc vào `ShoppingFood.Core`.

### 📁 Enums/

| Enum | Giá trị | Dùng ở bảng |
|------|---------|-------------|
| `UserStatus` | Pending, Active, Inactive, Blocked | `USER_ACCOUNT` |
| `UserRole` | Admin, Seller, Customer | `USER_PROFILE` |
| `SellerApplicationStatus` | Pending, Approved, Rejected, NeedsInfo | `SELLER_APPLICATION` |
| `RestaurantStatus` | Active, Inactive, Suspended | `RESTAURANT_PROFILE` |
| `StockStatus` | InStock, OutOfStock | `PRODUCT` |
| `OrderStatus` | Pending, Confirmed, Preparing, Shipping, Delivered, Cancelled | `ORDER` |
| `PaymentMethod` | COD, CreditCard, EWallet | `ORDER` |

### 📁 Models/ — Các Entity Nghiệp Vụ

| Entity | Bảng CSDL | Mô tả |
|--------|-----------|-------|
| `User` | `USER_ACCOUNT` | Thông tin đăng nhập: username, password hash, email, phone, trạng thái tài khoản |
| `UserProfile` | `USER_PROFILE` | Thông tin cá nhân: họ tên, avatar, role. Quan hệ 1-1 với `User` |
| `SellerApplication` | `SELLER_APPLICATION` | Đơn đăng ký làm nhà bán hàng: giấy phép kinh doanh, địa chỉ, trạng thái duyệt |
| `RestaurantProfile` | `RESTAURANT_PROFILE` | Hồ sơ nhà hàng sau khi được duyệt: tên, địa chỉ, logo, trạng thái hoạt động |
| `Product` | `PRODUCT` | Sản phẩm/món ăn: tên, mô tả, giá, danh mục, trạng thái tồn kho |
| `ProductImage` | `PRODUCT_IMAGE` | Hình ảnh sản phẩm (nhiều ảnh/sản phẩm), đánh dấu ảnh chính (`IsPrimary`) |
| `GuestUser` | `GUEST_USER` | Thông tin khách vãng lai khi đặt hàng không cần đăng nhập |
| `Cart` | `CART` | Giỏ hàng — có thể thuộc User đã đăng nhập hoặc GuestUser |
| `CartItem` | `CART_ITEM` | Dòng sản phẩm trong giỏ hàng: số lượng, giá tại thời điểm thêm |
| `Order` | `ORDER` | Đơn hàng: địa chỉ giao, người liên hệ, tổng tiền, phương thức thanh toán |
| `OrderItem` | `ORDER_ITEM` | Dòng sản phẩm trong đơn hàng (lưu snapshot tên/giá để tránh mất dữ liệu lịch sử) |
| `OtpRecord` | `OTP_RECORD` | Bản ghi OTP xác thực: mã OTP, thời hạn, số lần thử, IP |
| `ActionLog` | `log.ActionLogs` | Audit log hành động người dùng (implement `IActionLog`) |
| `ErrorLog` | `log.ErrorLogs` | Log lỗi hệ thống: exception message, stack trace |

### 📁 Context/

| File | Vai trò |
|------|---------|
| `ShoppingFoodContext.cs` | **DbContext nghiệp vụ chính**. Khai báo 12 `DbSet<T>`, cấu hình Fluent API: tên bảng UPPER_CASE, unique index (username/email/phone), kiểu decimal cho giá tiền (`decimal(12,2)`), enum lưu dạng string, cascade delete phù hợp từng quan hệ. |
| `LogContext.cs` | **DbContext ghi log**. Tách biệt hoàn toàn, sử dụng schema `log` riêng biệt trong SQL Server. Chứa `ActionLogs` và `ErrorLogs`. Cho phép ghi log ngay cả khi transaction nghiệp vụ bị rollback. |

---

## 3️⃣ ShoppingFood.Dto — Tầng Truyền Dữ Liệu

**Mục đích**: Chứa các class **Data Transfer Object** — là lớp trung gian giữa Entity (Domain) và phản hồi API, giúp tránh lộ thông tin nhạy cảm (password hash, khóa ngoại, v.v.). Phụ thuộc vào `Core`.

### 📁 User/

| File | Vai trò |
|------|---------|
| `UserDto.cs` | Đại diện thông tin người dùng trả về API: `Id`, `UserName`, `FullName` (flatten từ `UserProfile`), `Role`, `Status`, `Email`, `Phone`, `AvatarUrl`, `CreatedAt`. **Không có PasswordHash**. |

### 📁 Security/

| File | Vai trò |
|------|---------|
| `MyPrincipal.cs` | Kế thừa `ClaimsPrincipal` của .NET. Bọc `UserDto` bên trong, tự tạo `ClaimsIdentity` với `NameIdentifier`, `Name`, `Role`. Gán vào `HttpContext.User` để các controller đọc thông tin người dùng hiện tại mà **không cần query lại DB**. |

### 📁 Log/

| File | Vai trò |
|------|---------|
| `ActionLogDto.cs` | DTO trả về khi query audit log |
| `ErrorLogDto.cs` | DTO trả về khi query error log |

---

## 4️⃣ ShoppingFood.Repository — Tầng Truy Cập CSDL

**Mục đích**: Triển khai cụ thể các interface từ Core, chứa logic tương tác CSDL thực tế. Phụ thuộc vào `Core` + `Domain`.

### 📁 Interfaces/

| File | Vai trò |
|------|---------|
| `IUserRepository.cs` | Kế thừa `IAsyncRepository<User>`. Là "hợp đồng" dành riêng cho nghiệp vụ User — có thể mở rộng thêm method đặc thù sau này (vd: `FindByEmailAsync`). |

### 📁 Implementations/

| File | Vai trò |
|------|---------|
| `UserRepository.cs` | Kế thừa `RepositoryBase<User>` + implement `IUserRepository`. Nhận `ShoppingFoodContext` qua constructor, tự động thừa hưởng toàn bộ 7 thao tác CRUD từ `RepositoryBase`. |
| `UnitOfWork.cs` | Implement `IUnitOfWork`. Quản lý **cả 2 DbContext** (`ShoppingFoodContext` + `LogContext`): `SaveChangesAsync()` commit context nghiệp vụ; `LogErrorAsync()` và `LogActionAsync()` luôn commit vào `LogContext` riêng biệt — đảm bảo log được lưu ngay cả khi nghiệp vụ thất bại. |

### File gốc

| File | Vai trò |
|------|---------|
| `RepositoryServiceRegistration.cs` | Extension method `AddRepositoryServices()`. Đăng ký: 2 `DbContext` với SQL Server connection string; `IUnitOfWork → UnitOfWork` (Scoped); **Scrutor auto-scan** toàn bộ assembly để tự động đăng ký `IXxxRepository → XxxRepository` theo quy ước đặt tên. |

---

## 5️⃣ ShoppingFood.Application — Tầng Nghiệp Vụ

**Mục đích**: Chứa toàn bộ **logic nghiệp vụ** theo mô hình CQRS (Command Query Responsibility Segregation) với MediatR. Phụ thuộc vào `Core` + `Domain` + `Dto` + `Repository`.

### 📁 Mappings/

| File | Vai trò |
|------|---------|
| `MappingProfile.cs` | Cấu hình AutoMapper: `User → UserDto` (flatten `Profile.FullName`, `Profile.Role`, `Profile.AvatarUrl` vào DTO phẳng); `AddUserCommand → User` (bỏ qua PasswordHash vì sẽ hash thủ công). |

### 📁 Features/Users/Commands/ — Nghiệp vụ Ghi

#### 🔷 Đăng Ký Người Dùng (`AddUser`)

| File | Vai trò |
|------|---------|
| `AddUserCommand.cs` | **Input payload** đăng ký: `UserName`, `Password`, `FullName`, `Email`, `Phone`, `Role`, `AvatarUrl`. Kế thừa `BaseCommand` (chứa `CurrentUserId`). Implement `IRequest<ApiResponse>` để MediatR biết handler trả về gì. |
| `AddUserCommandValidator.cs` | **Kiểm tra đầu vào** bằng FluentValidation: `UserName` không rỗng, tối đa 50 ký tự, **kiểm tra DB không trùng**; `Password` tối thiểu 6 ký tự; `FullName` tối đa 100 ký tự; `Email` đúng định dạng + **kiểm tra DB không trùng**; `Phone` chỉ chứa 9-15 chữ số + **kiểm tra DB không trùng**. Validator này chạy tự động qua `ValidationBehaviour` trước khi Handler được gọi. |
| `AddUserHandler.cs` | **Xử lý nghiệp vụ**: dùng AutoMapper tạo `User` từ command → tạo `Guid` mới → hash password bằng SHA256 → tạo `UserProfile` liên kết → `_userRepository.Add(user)` → `_unitOfWork.SaveChangesAsync()` → map kết quả sang `UserDto` → trả `ApiResponse.Success`. Nếu lỗi: ghi `ErrorLog` và trả `ApiResponse.Failure(500)`. |

### 📁 Features/Users/Queries/ — Nghiệp vụ Đọc

#### 🔷 Tìm Kiếm Người Dùng (`GetUser`)

| File | Vai trò |
|------|---------|
| `GetUserQuery.cs` | **Input tìm kiếm**: kế thừa `BaseQuery` (chứa `Filter`, `Skip`, `Take`, `CurrentUserId`). Implement `IRequest<ApiResponse>`. |
| `GetUserHandler.cs` | **Xử lý truy vấn phân trang**: nếu `Filter` không rỗng thì tạo predicate lọc theo `UserName` hoặc `Email` → gọi `GetAsync` với `Include(u => u.Profile)` để eager load → gọi `GetCountAsync` lấy tổng → map sang `IReadOnlyList<UserDto>` → trả `ApiResponse.Success` kèm `Total`. |

### File gốc

| File | Vai trò |
|------|---------|
| `ApplicationServiceRegistration.cs` | Extension method `AddApplicationServices()`: đăng ký AutoMapper scan assembly; đăng ký FluentValidation scan assembly; đăng ký MediatR scan assembly + gắn 2 pipeline behaviors theo thứ tự `UnhandledExceptionBehaviour` → `ValidationBehaviour` → `Handler`. |

---

## 6️⃣ ShoppingFood.API — Tầng Trình Bày

**Mục đích**: Điểm vào của hệ thống. Nhận HTTP request, xác thực, định tuyến đến handler và trả về response. Phụ thuộc vào tất cả các tầng còn lại.

### 📁 Filters/

| File | Vai trò |
|------|---------|
| `AuthenticationFilter.cs` | **Global Action Filter** chạy trước mọi controller action. Luồng xử lý: (1) Bỏ qua các endpoint public (`/api/User/Login`, `/api/User/Register`, `/swagger`); (2) Đọc `Authorization` header, bóc tách Bearer token; (3) Gọi `TokenHelper.GetUsernameFromToken()` giải mã; (4) Query DB lấy User + Profile; (5) Tạo `MyPrincipal(userDto)` gán vào `HttpContext.User`; (6) **Tự động điền `CurrentUserId`** vào mọi `BaseCommand`/`BaseQuery` trong action arguments; (7) Serialize request arguments (ẩn password) ghi vào `ActionLog`. |

### 📁 Controllers/

| File | Vai trò |
|------|---------|
| `CommonController.cs` | **Base controller** cho toàn bộ API. Khai báo `[ApiController]`, `[Route("api/[controller]")]`. Cung cấp property `userDto` shortcut đọc `MyPrincipal` từ `HttpContext.User`. Inject `IMediator` để gọi CQRS. |
| `UserController.cs` | **User endpoint**: `POST /api/User/Register` → gửi `AddUserCommand` qua Mediator; `GET /api/User` → gửi `GetUserQuery` qua Mediator (hỗ trợ `?filter=&skip=&take=`); `POST /api/User/Login` → hash password → query DB → gọi `TokenHelper.GenerateToken()` → trả JWT token. |

### File gốc

| File | Vai trò |
|------|---------|
| `Program.cs` | **Bootstrap ứng dụng**: đăng ký `AuthenticationFilter` làm global filter; gọi `AddRepositoryServices()` + `AddApplicationServices()`; cấu hình Swagger với Bearer auth; cấu hình CORS `AllowAll`; **`EnsureCreated()`** tự tạo DB + schema lần đầu; đăng ký `ExceptionHandlingMiddleware`; `UseSwagger`, `UseHttpsRedirection`, `UseAuthorization`, `MapControllers`. |
| `appsettings.json` | Cấu hình: SQL Server connection string (`ShoppingFoodDb`); JWT settings (`Secret`, `Issuer`, `Audience`); Logging level. |

---

## 🔄 Luồng Xử Lý Một Nghiệp Vụ Điển Hình

Ví dụ: **Khách hàng đăng ký tài khoản** (`POST /api/User/Register`)

```
HTTP Request
    │
    ▼
[AuthenticationFilter]          ← Bỏ qua (endpoint public)
    │
    ▼
[UserController.Register()]     ← Nhận AddUserCommand từ request body
    │
    ▼
[IMediator.Send(command)]       ← Gửi command vào MediatR pipeline
    │
    ▼
[UnhandledExceptionBehaviour]   ← Bọc try/catch toàn bộ pipeline
    │
    ▼
[ValidationBehaviour]           ← Chạy AddUserCommandValidator:
    │                              - Kiểm tra UserName không trùng DB ✓
    │                              - Kiểm tra Email không trùng DB ✓
    │                              - Kiểm tra Phone hợp lệ ✓
    ▼
[AddUserHandler.Handle()]       ← Xử lý nghiệp vụ:
    │                              - AutoMapper: Command → User entity
    │                              - Hash password SHA256
    │                              - Tạo UserProfile liên kết
    │                              - UserRepository.Add(user)
    │                              - UnitOfWork.SaveChangesAsync()
    │                              - AutoMapper: User → UserDto
    ▼
[ApiResponse.Success(userDto)]  ← Trả về chuẩn hóa
    │
    ▼
HTTP Response 200 OK
{
  "error": false,
  "code": 200,
  "message": "User registered successfully",
  "data": { "id": "...", "userName": "...", ... },
  "total": 0
}
```

---

## ⚙️ Thêm Nghiệp Vụ Mới — Quy Trình Chuẩn

Ví dụ thêm nghiệp vụ **"Thêm Sản Phẩm"**:

| Bước | Project | File cần tạo |
|------|---------|-------------|
| 1 | `Domain` | Entity đã có: `Product.cs` |
| 2 | `Repository` | `IProductRepository.cs` (interface), `ProductRepository.cs` (implementation) |
| 3 | `Dto` | `ProductDto.cs`, `AddProductRequest.cs` |
| 4 | `Application/Mappings` | Thêm mapping `Product ↔ ProductDto` vào `MappingProfile.cs` |
| 5 | `Application/Features/Products/Commands` | `AddProductCommand.cs`, `AddProductCommandValidator.cs`, `AddProductHandler.cs` |
| 6 | `Application/Features/Products/Queries` | `GetProductQuery.cs`, `GetProductHandler.cs` |
| 7 | `API/Controllers` | `ProductController.cs` kế thừa `CommonController` |

> **Lưu ý**: Scrutor tự động scan và đăng ký `IProductRepository → ProductRepository` — **không cần đăng ký thủ công** trong DI container.

---

## 📦 Danh Sách NuGet Packages Theo Project

| Package | Project | Mục đích |
|---------|---------|---------|
| `MediatR` | Core, Application | CQRS mediator pattern |
| `FluentValidation` | Core, Application | Validation rules fluent API |
| `AutoMapper` | Application, API | Object-object mapping |
| `Microsoft.EntityFrameworkCore.SqlServer` | Domain, Repository | EF Core provider SQL Server |
| `Microsoft.EntityFrameworkCore.Tools` | Domain | Migration CLI tools |
| `Scrutor` | Repository | Assembly scanning cho DI |
| `Microsoft.AspNetCore.Authentication.JwtBearer` | Core, API | JWT middleware |
| `System.IdentityModel.Tokens.Jwt` | Core | JWT token read/write |
| `Newtonsoft.Json` | API | JSON serialization (filter logging) |
| `Swashbuckle.AspNetCore` | API | Swagger/OpenAPI documentation |
