# Tài liệu Quy trình: Giỏ hàng (Cart)

Tài liệu này mô tả chi tiết luồng **thêm / xem / cập nhật / xóa / clear** giỏ hàng trong hệ thống **Shopping Food**, hỗ trợ cả **user đã đăng nhập** và **guest** (`guestUserId` lưu `localStorage` key `sf_guest_id`).

> Guest cart: request **không** gửi header `Authorization` → `AuthenticationFilter` coi là `isGuestCartRequest` và bypass JWT. User đã login: Filter inject `CurrentUserId` vào Command/Query.

---


---

## Phần A — UI Interaction Trace (Nút bấm → Code → Data → Hiển thị)

> UI Trace — Cart  
> Mỗi thao tác trả lời: **nút ở đâu** · **bấm chạy file/hàm nào** · **API/BE đâu** · **data trả về** · **hiển thị thế nào**.


**State trung tâm:** `CartProvider` trong `ShoppingFood.FE/src/contexts/CartContext.tsx`  
**Hook:** `useCart()` → `hooks/useCart.ts` (re-export context)  
**Keys localStorage:** `sf_cart` (optimistic), `sf_guest_id` (guest)

---

## UT-CART-01 — Thêm vào giỏ từ ProductCard

#### 1. Giao diện nút bấm ở đâu?

| Mục | Giá trị |
|-----|---------|
| **Route** | `/`, `/products`, `/restaurant/:id`, … (mọi nơi render `ProductCard`) |
| **Page** | Ví dụ `pages/HomePage.tsx`, `pages/ProductsPage.tsx` |
| **Component** | `components/product/ProductCard.tsx` |
| **Nhãn nút** | `"Thêm vào giỏ"` (hoặc `"Hết hàng"` nếu OutOfStock) |
| **Loại control** | `<button onClick={...}>` cuối card |
| **Điều kiện hiện** | Luôn hiện; `disabled` khi `stockStatus === 'OutOfStock'` |

#### 2. Bấm xong chạy đến đâu? (Frontend)

```text
ProductCard button onClick (ProductCard.tsx ~104–110)
  → e.stopPropagation()  // không navigate vào detail
  → if stockStatus !== 'OutOfStock':
       addItem(product, 1)   // từ useCart()
  → CartContext.addItem (CartContext.tsx ~119–169)
       1) setItems(...) optimistic (cộng qty nếu trùng product+size+toppings)
       2) setTimeout → toast.success("Đã thêm vào giỏ: …" | "Đã cập nhật số lượng: …")
       3) cartService.addToCart({ productId, quantity, guestUserId })
  → httpClient.post('/Cart', body)
```

**Cùng pattern add nhanh:**
- `HomePage.tsx` ~356: `onClick={() => addItem(product, 1)}`
- `FlashSalePage.tsx`, `BuyXGetYPage.tsx`, `BuyXGetYSection.tsx` — `addItem(...)` với qty khác

#### 3. Backend chạy đoạn nào?

```text
POST /api/Cart
  → CartController.AddToCart (CartController.cs L14–18)
  → MediatR → AddToCartHandler.Handle (Features/Carts/Commands/AddToCartHandler.cs)
  → Kiểm tra product tồn tại / stock
  → Conflict 409 nếu khác restaurant với item đang có trong cart
  → Insert/Update CartItem → SaveChanges
  → ApiResponse.Success(dto, "Added item to cart successfully")
```

#### 4. Dữ liệu trả về ở đâu?

```json
{
  "code": 200,
  "error": false,
  "message": "Added item to cart successfully",
  "data": { /* cart DTO */ }
}
```

| Field / Case | Ý nghĩa |
|--------------|---------|
| 404 | Product not found / unavailable |
| 400 | Out of stock |
| 409 | Khác cửa hàng — message hỏi empty cart |

**Request FE gửi:** `{ productId, quantity, guestUserId? }` — size/toppings hiện **optimistic local**, API add cơ bản theo productId.

#### 5. Làm sao hiển thị ra?

| Nhánh | Hành vi UI |
|-------|------------|
| Optimistic OK | `items` trong Context đổi ngay → badge giỏ Header (`totalItems`) tăng |
| Toast success | `Đã thêm vào giỏ: {itemName}` hoặc cập nhật số lượng |
| API error | `toast.error(...)` — state local **không rollback** (comment trong code) |
| localStorage | `useEffect` ghi `sf_cart` mỗi khi `items` đổi |

#### 6. Sơ đồ nhanh

```mermaid
sequenceDiagram
    participant Btn as ProductCard "Thêm vào giỏ"
    participant Ctx as CartContext.addItem
    participant API as POST /api/Cart
    participant UI as Badge + Toast

    Btn->>Ctx: addItem(product,1)
    Ctx->>UI: setItems + toast
    Ctx->>API: addToCart
    API-->>Ctx: ApiResponse
```

---

## UT-CART-02 — Thêm vào giỏ từ ProductDetailPage (có size/topping)

#### 1. Giao diện nút bấm ở đâu?

| Mục | Giá trị |
|-----|---------|
| **Route** | `/products/:id` |
| **Page** | `pages/ProductDetailPage.tsx` |
| **Component** | cùng page |
| **Nhãn nút** | `"Thêm vào giỏ"` (disabled/"Hết hàng" nếu out of stock) |
| **Loại control** | Button `onClick={handleAddToCart}` (~292) |
| **Điều kiện hiện** | Sau khi load product; user chọn size/topping phía trên |

#### 2. Bấm xong chạy đến đâu? (Frontend)

```text
handleAddToCart (ProductDetailPage.tsx L85–87)
  → addItem(product, 1, selectedSize || undefined, selectedToppings.length ? selectedToppings : undefined)
  → CartContext.addItem (như UT-CART-01)
  → cartService.addToCart({ productId, quantity, guestUserId })
```

#### 3. Backend chạy đoạn nào?

Giống UT-CART-01 — `AddToCartHandler`.

#### 4. Dữ liệu trả về ở đâu?

Giống UT-CART-01.

#### 5. Làm sao hiển thị ra?

| Nhánh | Hành vi UI |
|-------|------------|
| Success | Toast + Context `items` có `selectedSize` / `selectedToppings` (local) |
| Key trùng | Cùng product+size+toppings → cộng `quantity` trong `setItems` |

#### 6. Sơ đồ nhanh

```mermaid
sequenceDiagram
    participant Btn as "Thêm vào giỏ" Detail
    participant FE as handleAddToCart
    participant Ctx as CartContext
    participant API as POST /Cart

    Btn->>FE: click
    FE->>Ctx: addItem(..., size, toppings)
    Ctx->>API: addToCart
```

---

## UT-CART-03 — Mở giỏ hàng (ShoppingDrawer) từ Header

#### 1. Giao diện nút bấm ở đâu?

| Mục | Giá trị |
|-----|---------|
| **Route** | Mọi trang dùng `MainLayout` / Header |
| **Page** | Layout |
| **Component** | `components/layout/Header.tsx` nhúng `<ShoppingDrawer />` (~95, ~184) |
| **Nhãn nút** | Icon `ShoppingCart` (title `"Giỏ hàng & Đơn hàng"`) |
| **Loại control** | `<button onClick={() => { setIsOpen(true); setActiveTab('cart'); }}>` — ShoppingDrawer.tsx ~225–236 |
| **Điều kiện hiện** | Luôn; badge số nếu `totalItems > 0` |

#### 2. Bấm xong chạy đến đâu? (Frontend)

```text
ShoppingDrawer trigger button
  → setIsOpen(true)
  → setActiveTab('cart')
  → createPortal drawer (không gọi API ngay cho cart — items đã có trong Context)
  → Nếu sau đó user chuyển tab "Đơn hàng":
       useEffect → fetchOrders → orderService.getMyOrders / getGuestOrders
```

**Không** gọi lại `getCart` chỉ vì mở drawer (cart đã sync lúc mount/`isAuthenticated` đổi qua `fetchCart`).

#### 3. Backend chạy đoạn nào?

Không HTTP khi chỉ mở drawer.  
(Khi load lần đầu app: `GET /api/Cart?guestUserId=` → `GetCartHandler`.)

#### 4. Dữ liệu trả về ở đâu?

N/A cho click mở.  
`GET /Cart` khi `fetchCart`: `data` = array items hoặc `{ items: [...] }`.

#### 5. Làm sao hiển thị ra?

| Nhánh | Hành vi UI |
|-------|------------|
| Mở | Overlay + panel phải `max-w-md`, tab Giỏ hàng |
| Badge | `totalItems` từ Context |
| Empty | Text "Giỏ hàng trống" + nút "Tiếp tục tìm kiếm" |

#### 6. Sơ đồ nhanh

```mermaid
sequenceDiagram
    participant Icon as Header Cart Icon
    participant Dr as ShoppingDrawer state
    participant Ctx as items (Context)

    Icon->>Dr: setIsOpen(true), tab=cart
    Dr->>Ctx: đọc items/totalItems (render)
```

---

## UT-CART-04 — Tăng / giảm số lượng (+ / −)

#### 1. Giao diện nút bấm ở đâu?

| Mục | Giá trị |
|-----|---------|
| **Route** | Drawer đang mở |
| **Component** | `ShoppingDrawer.tsx` trong từng dòng item |
| **Nhãn nút** | Icon `Minus` / `Plus` (~423–433) |
| **Loại control** | `<button onClick={() => updateQuantity(...)}>` |
| **Điều kiện hiện** | Có item trong group nhà hàng |

#### 2. Bấm xong chạy đến đâu? (Frontend)

```text
Minus: updateQuantity(productId, quantity - 1, selectedSize, selectedToppings)
Plus:  updateQuantity(productId, quantity + 1, ...)
  → CartContext.updateQuantity (L190–222)
       if quantity <= 0 → removeItem(...)
       else setItems map quantity
       → cartService.updateQuantity({ productId, quantity, guestUserId })
  → httpClient.put('/Cart', body)
```

#### 3. Backend chạy đoạn nào?

```text
PUT /api/Cart
  → CartController.UpdateQuantity
  → UpdateCartItemQuantityHandler.Handle
  → Success: "Cart item quantity updated successfully."
```

#### 4. Dữ liệu trả về ở đâu?

```json
{ "error": false, "message": "Cart item quantity updated successfully.", "data": { /* cart dto */ } }
```

404 nếu cart/item không tồn tại.

#### 5. Làm sao hiển thị ra?

| Nhánh | Hành vi UI |
|-------|------------|
| OK | Số qty trên UI đổi ngay (optimistic); `totalPrice` / `selectedTotal` recalculate |
| qty→0 | Item biến mất (qua `removeItem`) |
| Error | `toast.error('Lỗi cập nhật số lượng trên server')` |

#### 6. Sơ đồ nhanh

```mermaid
sequenceDiagram
    participant Btn as Plus/Minus
    participant Ctx as updateQuantity
    participant API as PUT /Cart

    Btn->>Ctx: updateQuantity
    Ctx->>API: updateQuantity
    Ctx-->>Btn: setItems re-render
```

---

## UT-CART-05 — Xóa một món (Trash)

#### 1. Giao diện nút bấm ở đâu?

| Mục | Giá trị |
|-----|---------|
| **Component** | `ShoppingDrawer.tsx` ~378 |
| **Nhãn nút** | Icon `Trash2` |
| **Loại control** | `onClick={() => removeItem(item.product.id, item.selectedSize, item.selectedToppings)}` |

#### 2. Bấm xong chạy đến đâu? (Frontend)

```text
removeItem(...) (CartContext L171–188)
  → setItems(filter ...) optimistic
  → cartService.removeCartItem({ productId, guestUserId })
  → httpClient.delete('/Cart', { params })
```

#### 3. Backend chạy đoạn nào?

```text
DELETE /api/Cart?productId=&guestUserId=
  → CartController.RemoveCartItem
  → RemoveCartItemCommandHandler
  → "Item removed from cart successfully."
```

#### 4. Dữ liệu trả về ở đâu?

Success message như trên; 404 Cart/Item not found.

#### 5. Làm sao hiển thị ra?

| Nhánh | Hành vi UI |
|-------|------------|
| OK | Dòng item biến mất; badge giảm |
| Error | `toast.error('Lỗi khi xóa món trên server')` |

#### 6. Sơ đồ nhanh

```mermaid
sequenceDiagram
    participant Trash as Trash2
    participant Ctx as removeItem
    participant API as DELETE /Cart
    Trash->>Ctx: removeItem
    Ctx->>API: removeCartItem
```

---

## UT-CART-06 — Xóa tất cả giỏ (ConfirmModal)

#### 1. Giao diện nút bấm ở đâu?

| Mục | Giá trị |
|-----|---------|
| **Component** | `ShoppingDrawer.tsx` |
| **Nhãn nút** | `"Xóa tất cả"` (~252–257) — chỉ khi `activeTab==='cart' && groups.length>0` |
| **Confirm** | `ConfirmModal` title `"Xóa giỏ hàng"`, description `"Bạn có chắc chắn muốn xóa toàn bộ giỏ hàng?"` (~579–586) |

#### 2. Bấm xong chạy đến đâu? (Frontend)

```text
"Xóa tất cả" → setClearCartConfirmModal(true)
User Confirm → onConfirm:
  → clearCart() (CartContext L224–231)
       setItems([])
       cartService.clearCart({ guestUserId })
  → httpClient.delete('/Cart/clear', { params })
  → setClearCartConfirmModal(false)
```

#### 3. Backend chạy đoạn nào?

```text
DELETE /api/Cart/clear?guestUserId=
  → CartController.ClearCart
  → ClearCartCommandHandler
  → "Cart cleared successfully."
```

#### 4. Dữ liệu trả về ở đâu?

Success dto + message; 404 nếu không có cart.

#### 5. Làm sao hiển thị ra?

| Nhánh | Hành vi UI |
|-------|------------|
| Confirm | Modal đóng; `items=[]`; UI empty state; badge 0 |
| API fail | `console.error` — **không** toast (khác remove single) |

#### 6. Sơ đồ nhanh

```mermaid
sequenceDiagram
    participant Btn as "Xóa tất cả"
    participant M as ConfirmModal
    participant Ctx as clearCart
    participant API as DELETE /Cart/clear

    Btn->>M: open
    M->>Ctx: clearCart()
    Ctx->>API: clearCart
```

---

## UT-CART-07 — Tiến hành thanh toán (vào Checkout)

#### 1. Giao diện nút bấm ở đâu?

| Mục | Giá trị |
|-----|---------|
| **Component** | `ShoppingDrawer.tsx` footer ~464–470 |
| **Nhãn nút** | `"Tiến hành thanh toán"` |
| **Loại control** | `<Button onClick={handleCheckout} disabled={!selectedProvider}>` |
| **Điều kiện** | Đã chọn 1 nhà hàng (`selectedProvider`) trong drawer |

#### 2. Bấm xong chạy đến đâu? (Frontend)

```text
handleCheckout (ShoppingDrawer.tsx L71–86)
  → Nếu item isProductDeleted trong group → toast.error(...) return
  → setIsOpen(false)
  → checkoutUrl = `/checkout?restaurantId={selectedProvider}`
  → if isAuthenticated: navigate(checkoutUrl)
  → else: navigate(/login, { state: { returnUrl: checkoutUrl } })
```

**Không** gọi API cart ở bước này.

#### 3. Backend chạy đoạn nào?

N/A (navigation only). Checkout gọi API ở `CheckoutPage`.

#### 4. Dữ liệu trả về ở đâu?

N/A.

#### 5. Làm sao hiển thị ra?

| Nhánh | Hành vi UI |
|-------|------------|
| Auth | Đóng drawer → trang `/checkout?restaurantId=...` |
| Guest | Đóng drawer → `/login` rồi quay lại checkout |
| Món ngừng bán | Toast đỏ, ở lại drawer |

#### 6. Sơ đồ nhanh

```mermaid
sequenceDiagram
    participant Btn as "Tiến hành thanh toán"
    participant Nav as react-router
    participant Page as CheckoutPage

    Btn->>Nav: navigate(/checkout?restaurantId=)
    Nav->>Page: render
```

---

## Tóm tắt call chain Cart

```text
UI (ProductCard / Detail / Drawer)
  → useCart() / CartContext
  → CartService (/Cart, /Cart/clear)
  → CartController → *Handler
  → Context setItems + toast + localStorage sf_cart
  → Header badge totalItems
```

| File quan trọng | Vai trò |
|-----------------|---------|
| `contexts/CartContext.tsx` | State + optimistic + API |
| `services/CartService.ts` | HTTP |
| `components/layout/ShoppingDrawer.tsx` | UI giỏ |
| `components/product/ProductCard.tsx` | Add nhanh |
| `pages/ProductDetailPage.tsx` | Add + options |
| `API/Controllers/CartController.cs` | Endpoints |
| `Application/Features/Carts/**` | Handlers |


---

## Phần B — Workflow nghiệp vụ & Backend (chi tiết luồng)
## 1. Luồng Tổng Quan (Workflow)

1. **Khởi tạo FE:** `CartProvider` mount → `getGuestUserId()` nếu chưa login → `cartService.getCart(guestUserId)` → đồng bộ state + `sf_cart` localStorage.
2. **Thêm món:** UI gọi `addItem` → optimistic update + toast → `POST /api/Cart` (`productId`, `quantity`, optional `guestUserId`, `clearCartIfConflict`).
3. **Backend Add:** Tạo GuestUser nếu cần → GetOrCreate Cart → check quán conflict / stock → thêm hoặc cộng dồn `CartItem` (giá FlashSale nếu có).
4. **Xem giỏ:** `GET /api/Cart?guestUserId=` → sync giá flash sale → trả `CartDto`.
5. **Đổi số lượng:** `PUT /api/Cart` — quantity ≤ 0 thì xóa item.
6. **Xóa món:** `DELETE /api/Cart?productId=&guestUserId=`.
7. **Xóa hết:** `DELETE /api/Cart/clear?guestUserId=` (ConfirmModal trên Drawer).
8. **Ràng buộc quán:** Một cart chỉ 1 `RestaurantId`; khác quán → HTTP **409** (FE có thể gửi `clearCartIfConflict: true`).

```mermaid
sequenceDiagram
    actor U as Người dùng / Guest
    participant FE as CartContext
    participant API as CartController
    participant H as MediatR Handlers
    participant DB as SQL Server

    U->>FE: Thêm món / sửa / xóa
    alt Chưa login
        FE->>FE: guestUserId từ sf_guest_id
        FE->>API: Request + guestUserId (không Bearer)
    else Đã login
        FE->>API: Request + Bearer JWT
        Note over API: Filter set CurrentUserId
    end
    API->>H: Add / Get / Update / Remove / Clear
    H->>DB: CART + CART_ITEM (+ GUEST_USER)
    H-->>FE: CartDto / Success
    FE-->>U: Toast / cập nhật Drawer
```

---

## Bước 1: Quản lý Guest ID & State (Frontend)

**Files:**
- `ShoppingFood.FE/src/contexts/CartContext.tsx`
- `ShoppingFood.FE/src/services/CartService.ts`
- `ShoppingFood.FE/src/hooks/useCart.ts` (wrapper)
- UI Drawer: `ShoppingFood.FE/src/components/layout/ShoppingDrawer.tsx`

```typescript
const GUEST_ID_KEY = 'sf_guest_id';

const getGuestUserId = useCallback(() => {
  if (isAuthenticated) return undefined;
  let guestId = localStorage.getItem(GUEST_ID_KEY);
  if (!guestId) {
    guestId = crypto.randomUUID();
    localStorage.setItem(GUEST_ID_KEY, guestId);
  }
  return guestId;
}, [isAuthenticated]);
```

**Service:**

```typescript
async addToCart(data: IAddToCartRequest) {
  return httpClient.post(API_ENDPOINTS.CART.BASE, data);
}
async getCart(guestUserId?: string) {
  return httpClient.get(API_ENDPOINTS.CART.BASE, {
    params: guestUserId ? { guestUserId } : {},
  });
}
async updateQuantity(data) { return httpClient.put(..., data); }
async removeCartItem(params) { return httpClient.delete(..., { params }); }
async clearCart(params) { return httpClient.delete(API_ENDPOINTS.CART.CLEAR, { params }); }
```

---

## Bước 2: Controller API

**File:** `src/ShoppingFood.API/Controllers/CartController.cs`  
**Base route:** `api/Cart` (qua `CommonController`)

| Method | Route | Command/Query | Việc |
|--------|-------|---------------|------|
| POST | `/api/Cart` | `AddToCartCommand` | Thêm / cộng dồn |
| GET | `/api/Cart` | `GetCartQuery` | Lấy giỏ |
| PUT | `/api/Cart` | `UpdateCartItemQuantityCommand` | Đổi SL |
| DELETE | `/api/Cart` | `RemoveCartItemCommand` (query) | Xóa 1 món |
| DELETE | `/api/Cart/clear` | `ClearCartCommand` (query) | Xóa hết |

```csharp
[HttpPost]
public async Task<IActionResult> AddToCart([FromBody] AddToCartCommand command)
{
    var response = await _mediator.Send(command);
    return Ok(response);
}

[HttpGet]
public async Task<IActionResult> GetCart([FromQuery] GetCartQuery query) { ... }

[HttpPut]
public async Task<IActionResult> UpdateQuantity([FromBody] UpdateCartItemQuantityCommand command) { ... }

[HttpDelete]
public async Task<IActionResult> RemoveCartItem([FromQuery] RemoveCartItemCommand command) { ... }

[HttpDelete("clear")]
public async Task<IActionResult> ClearCart([FromQuery] ClearCartCommand command) { ... }
```

---

## Bước 3: Thêm vào giỏ (AddToCart)

**Thông tin:**
- **URL:** `/api/Cart`
- **HTTP Method:** POST
- **Auth:** JWT **hoặc** Guest (không Authorization)

**Command:** `src/ShoppingFood.Application/Features/Carts/Commands/AddToCartCommand.cs`

```csharp
public class AddToCartCommand : BaseCommand, IRequest<ApiResponse>
{
    public Guid ProductId { get; set; }
    public int Quantity { get; set; }
    public Guid? GuestUserId { get; set; }
    public bool ClearCartIfConflict { get; set; } = false;
}
```

**Handler:** `AddToCartHandler.cs`

```csharp
// Nếu không có CurrentUserId và GuestUserId → tự tạo Guid mới làm guest
var product = await _productRepository.GetByIdAsync(request.ProductId);
if (product == null || product.Status != ProductStatus.Approved || product.IsHidden)
    return ApiResponse.Failure(404, "Product not found or unavailable.");
if (product.StockStatus != StockStatus.InStock)
    return ApiResponse.Failure(400, "Product is out of stock.");

var cart = await GetOrCreateCartAsync(request.CurrentUserId, guestUserId);
// Conflict khác RestaurantId → 409 hoặc clear nếu ClearCartIfConflict
await AddOrUpdateCartItemAsync(cart.Id, product, request.Quantity);
// PriceAtAdded = FlashSale price ?? product.Price
return ApiResponse.Success(dto, "Added item to cart successfully");
```

**Tạo GuestUser** (khi guest chưa có trong DB):

```csharp
var guestUser = new GuestUser
{
    Id = guestUserId.Value,
    FullName = "Guest Customer",
    Phone = string.Empty,
    DeliveryAddress = string.Empty,
    IpAddress = GetClientIpAddress()
};
```

**Inject CurrentUserId:** `AuthenticationFilter` Lines ~215–224 — nếu có JWT hợp lệ:

```csharp
command.CurrentUserId = user.Id;
```

**Guest bypass:** `AuthenticationFilter` — `isGuestCartRequest` khi path `/api/Cart` và **không** có header Authorization (Lines 98–108).

---

## Bước 4: Lấy giỏ (GetCart)

**Thông tin:**
- **URL:** `/api/Cart?guestUserId={guid}` (guest) hoặc Bearer (user)
- **HTTP Method:** GET

**Query:** `GetCartQuery.cs` — `GuestUserId`

**Handler:** `GetCartHandler.cs`

```csharp
if (!request.CurrentUserId.HasValue && !request.GuestUserId.HasValue)
    return ApiResponse.Failure(401, "Unauthorized. Neither logged-in user nor guest ID was provided.");

// Load cart by UserAccountId OR GuestUserId
await _flashSalePricingService.SyncCartItemPricesAsync(cart);
return ApiResponse.Success(dto, "Get cart details successfully");
// Cart null → empty CartDto
```

---

## Bước 5: Cập nhật số lượng (Update)

**Thông tin:**
- **URL:** `/api/Cart`
- **HTTP Method:** PUT
- **Body:** `{ productId, quantity, guestUserId? }`

**Handler:** `UpdateCartItemQuantityHandler.cs`

```csharp
if (request.Quantity <= 0)
    _cartItemRepository.Delete(cartItem);
else
{
    cartItem.Quantity = request.Quantity;
    // cập nhật PriceAtAdded theo flash sale nếu có
}
```

**FE:** `CartContext.updateQuantity` — nếu `quantity <= 0` gọi `removeItem`.

---

## Bước 6: Xóa món / Clear

### Remove một món

- **URL:** `DELETE /api/Cart?productId=...&guestUserId=...`
- **Handler:** `RemoveCartItemCommandHandler.cs` — 401 nếu thiếu user/guest; 404 nếu không có cart/item.

### Clear toàn bộ

- **URL:** `DELETE /api/Cart/clear?guestUserId=...`
- **Handler:** `ClearCartCommandHandler.cs` — xóa tất cả `CartItem` của cart.
- **FE Confirm:** `ConfirmModal` trong `ShoppingDrawer.tsx` trước khi `clearCart()`.

---

## Database liên quan

| Bảng | Việc |
|------|------|
| `GUEST_USER` | Tạo khi guest thêm món lần đầu |
| `CART` | 1-1 với User **hoặc** Guest (`UserAccountId` / `GuestUserId`) |
| `CART_ITEM` | ProductId, Quantity, PriceAtAdded |
| `PRODUCT` | Check Approved, !Hidden, InStock, RestaurantId |

---

## Sơ đồ file đi qua (Call chain)

```text
ProductCard / ProductDetail / ShoppingDrawer
  ↓
CartContext.addItem | updateQuantity | removeItem | clearCart | fetchCart
  ↓
CartService.ts → HttpClient
  ↓
AuthenticationFilter  (guest bypass HOẶC JWT → CurrentUserId)
  ↓
CartController
  ↓
AddToCartHandler / GetCartHandler / UpdateCartItemQuantityHandler
RemoveCartItemCommandHandler / ClearCartCommandHandler
  ↓
ICartRepository + ICartItemRepository + ShoppingFoodContext
  ↓
CART / CART_ITEM / GUEST_USER
```

| Vai trò | Đường dẫn đầy đủ |
|---------|------------------|
| Context FE | `ShoppingFood.FE/src/contexts/CartContext.tsx` |
| Service FE | `ShoppingFood.FE/src/services/CartService.ts` |
| Drawer UI | `ShoppingFood.FE/src/components/layout/ShoppingDrawer.tsx` |
| Controller | `src/ShoppingFood.API/Controllers/CartController.cs` |
| Add Handler | `src/ShoppingFood.Application/Features/Carts/Commands/AddToCartHandler.cs` |
| Get Handler | `src/ShoppingFood.Application/Features/Carts/Queries/GetCartHandler.cs` |
| Update / Remove / Clear | `.../UpdateCartItemQuantityHandler.cs`, `RemoveCartItemCommandHandler.cs`, `ClearCartCommandHandler.cs` |
| Guest auth rule | `src/ShoppingFood.API/Filters/AuthenticationFilter.cs` |

---

## Các thông báo (Toast / Message)

| Message | Nơi | Trigger |
|---------|-----|---------|
| `Đã thêm vào giỏ: {itemName}` | `CartContext.addItem` | Thêm mới |
| `Đã cập nhật số lượng: {itemName}` | `CartContext.addItem` | Đã có sẵn trong state |
| `Lỗi khi thêm vào giỏ hàng trên server` | catch addItem | API fail |
| `Lỗi khi xóa món trên server` | removeItem | API fail |
| `Lỗi cập nhật số lượng trên server` | updateQuantity | API fail |
| `Product not found or unavailable.` | API | SP không hợp lệ |
| `Product is out of stock.` | API | Hết hàng |
| `The item you selected is not from the same store...` (409) | API | Conflict quán |
| `Unauthorized. Neither logged-in user nor guest ID was provided.` | API | Thiếu cả 2 id |
| `Cart is empty.` / `Get cart details successfully` | API Get | — |
| `Added item to cart successfully` | API Add | — |

---

## Các cơ chế bảo mật / nghiệp vụ quan trọng

1. **Guest không cần JWT** nhưng **bắt buộc** `guestUserId` (FE luôn tạo UUID).
2. **Không trộn Authorization giả** với guest path nếu muốn đi bypass guest — có Bearer thì Filter cố map user.
3. **Một cart = một nhà hàng** — 409 khi conflict (trừ khi `clearCartIfConflict`).
4. **Chỉ SP Approved, không ẩn, còn hàng** mới thêm được.
5. **Giá lúc thêm** lấy FlashSale active nếu có (`IFlashSalePricingService`).
6. GetCart **IgnoreQueryFilters** trên items để vẫn thấy SP soft-deleted (flag `isProductDeleted` phía DTO/FE).

---

## Checklist tự test

- [ ] Chưa login: thêm món → có `sf_guest_id` → F5 vẫn còn giỏ (API)
- [ ] Thêm 2 món cùng quán → cộng dồn / nhiều dòng OK
- [ ] Thêm món quán khác → 409 (hoặc clear nếu FE gửi flag)
- [ ] Đổi SL / xóa món / clear (có Confirm) hoạt động
- [ ] Login sau khi có guest cart: kiểm tra hành vi (cart user riêng theo `UserAccountId` — **không tự merge** trong code hiện tại)
- [ ] SP OutOfStock / Hidden → không thêm được
- [ ] Có Bearer hợp lệ → `CurrentUserId` được set, không cần guestUserId

---

## Tóm tắt

Cart Shopping Food = **REST `/api/Cart`** + **CartContext** với **guest UUID** hoặc **JWT user**. Backend đảm bảo 1 quán/cart, stock, flash price; Filter cho phép guest thao tác khi không gửi Authorization.

> Liên kết: [Login_Workflow.md](./Login_Workflow.md) · [Payment_Requirements.md](./Payment_Requirements.md) · [Checkout / Payment workflows](./Payment_Checkout_Workflow.md) · [INDEX](../ONBOARDING_INDEX.md)
