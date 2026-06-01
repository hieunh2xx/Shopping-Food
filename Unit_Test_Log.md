# Nhật Ký Unit Test Toàn Bộ Hệ Thống (Test Log)

Đây là tài liệu theo dõi tiến trình viết Unit Test cho dự án **Shopping Food**, bao gồm cả Backend (API, Logic Functions) và Frontend (UI Components, Hooks).

Quy ước trạng thái:
- ⬜ Chưa làm (Pending)
- 🚧 Đang thực hiện (In Progress)
- ✅ Hoàn thành (Passed)

---

## Ngày 2026-06-01

### 1. Thiết lập Môi trường (Environment Setup)
- ✅ Khởi tạo file `Unit_Test_Log.md` để tracking.
- ✅ Setup project `ShoppingFood.Tests` (xUnit, Moq, FluentAssertions) cho Backend.
- ✅ Setup Vitest & React Testing Library cho Frontend.

### 2. Backend - Core Logic & API
- ✅ **StringeeService**: SMS OTP token generation and HTTP dispatch (mock/live).
- ✅ **EmailService**: SmtpSettings configuration validation and error handling.
- ✅ **ChangePasswordHandler**: Verifies changing user passwords, checking old password hash matching, DB updates.
- ✅ **ForgotPasswordHandler**: Generates 6-digit OTP, stores OTP record, sends email.
- ✅ **ResetPasswordHandler**: Validates OTP records, updates password, prevents using old password.
- ✅ **AddToCartHandler**: Handles guest vs. user carts, checks product stock availability, performs in-memory DB transactions.
- ✅ **GetProductsHandler**: Handles paginated and filtered product lists, filtering by category and restaurant status.
- ✅ **UpdateCartItemQuantityHandler**: Tests unauthorized inputs (401), cart or product not found (404), updating count and deleting item if quantity <= 0, plus exception handling (500).
- ✅ **ClearCartQueryHandler**: Tests unauthorized inputs (401), cart not found (404), clearing all items, and database exception rollback.
- ✅ **GetProductDetailHandler**: Checks 404 response for missing items, verifies owner check for pending products, and allows public access to approved products.

### 3. Frontend - UI Components & Hooks
- ✅ **useAuth Hook**: Context login/logout integration and login API service interaction.
- ✅ **LoginPage**: Renders fields, validates empty entries, calls login hook on valid submit.
- ✅ **CartContext / useCart**: Manages items state (add, update, remove, clear) and integrates local storage persistence.
- ✅ **ProductCard**: Validates displaying product information, triggering adding to cart, and routing to detail page on click.
- ✅ **ProductDetailPage**: Verifies loading indicator state, 404 not found page states, add to cart trigger calls, and disabled states for out of stock products.
