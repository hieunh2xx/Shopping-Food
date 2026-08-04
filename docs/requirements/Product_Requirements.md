# Requirements: Sản phẩm & Catalog (Product)

Tài liệu yêu cầu nghiệp vụ cho duyệt/tìm kiếm món, Seller CRUD, tồn kho/hiển thị/khung giờ, đánh giá, báo cáo, Admin duyệt sản phẩm.

> Workflow: [../workflows/Product_Catalog_Workflow.md](../workflows/Product_Catalog_Workflow.md)  
> Liên quan: [../workflows/Restaurant_Seller_Workflow.md](../workflows/Restaurant_Seller_Workflow.md)

---

## 1. Mục tiêu

1. Customer duyệt, tìm kiếm, xem chi tiết, đánh giá món.
2. Seller quản lý món (CRUD), ảnh, size/topping, stock, ẩn/hiện, khung giờ bán.
3. Sản phẩm mới mặc định chờ **Admin duyệt** (`ProductStatus.Pending`).
4. Báo cáo sản phẩm / review vi phạm → SystemReport cho Admin xử lý.
5. Soft-delete sản phẩm (`IsDeleted`) + query filter EF.

---

## 2. Actors

| Actor | Quyền |
|-------|--------|
| **Guest / Customer** | GET list/detail/search/bestsellers/recommendations/reviews; POST review (auth); Report (auth) |
| **Seller / Mall** | CRUD món quán mình; stock/visibility/time; reply/report review; xem seller/reviews |
| **Admin** | `POST /api/Admin/ApproveProduct`; moderate product-reports |
| **Coordinator** | Không CRUD product (ngoài scope) |

---

## 3. Functional Requirements

### 3.1. Browse / Search (đọc)

| ID | Requirement |
|----|-------------|
| FR-PRD-01 | `GET /api/Product` — danh sách (filter/paging theo query) |
| FR-PRD-02 | `GET /api/Product/{id}` — chi tiết (ảnh, size, topping, quán…) |
| FR-PRD-03 | `GET /api/Product/Search` — tìm theo từ khóa / filter |
| FR-PRD-04 | `GET /api/Product/BestSellers` — bán chạy |
| FR-PRD-05 | `GET /api/Product/recommendations` — gợi ý |
| FR-PRD-06 | `GET /api/Product/Categories` — categories liên quan listing |
| FR-PRD-07 | Chỉ hiện product `IsDeleted=false`; khách thường chỉ thấy Approved + visible (theo query handler) |

### 3.2. Seller CRUD & vận hành món

| ID | Requirement |
|----|-------------|
| FR-PRD-10 | `POST /api/Product` — tạo món thuộc restaurant của seller; Status **Pending** |
| FR-PRD-11 | `PUT /api/Product/{id}` — cập nhật; chỉ owner |
| FR-PRD-12 | `DELETE /api/Product/{id}` — soft-delete |
| FR-PRD-13 | `PATCH /api/Product/StockStatus/{id}` — InStock / OutOfStock |
| FR-PRD-14 | `PATCH /api/Product/Visibility/{id}` — ẩn/hiện |
| FR-PRD-15 | `PATCH /api/Product/TimeAvailability/{id}` — khung giờ bán |
| FR-PRD-16 | Seller không được sửa món quán khác → 403 |
| FR-PRD-17 | Quán **Suspended** → filter `CheckSellerSuspensionAttribute` chặn POST/PUT/PATCH/DELETE |
| FR-PRD-18 | Upload ảnh qua `/User/UploadImage` rồi gắn URL ProductImage |

### 3.3. Admin duyệt

| ID | Requirement |
|----|-------------|
| FR-PRD-20 | `POST /api/Admin/ApproveProduct` — Approved hoặc Rejected |
| FR-PRD-21 | Chỉ món Approved mới được đăng ký Flash Sale / hiện đầy đủ storefront (theo rule hiện tại) |

### 3.4. Reviews & Reports

| ID | Requirement |
|----|-------------|
| FR-PRD-30 | `GET /api/Product/{productId}/reviews` — public |
| FR-PRD-31 | `GET /api/Product/seller/reviews` — inbox review quán |
| FR-PRD-32 | `POST /api/Product/review` — Customer đánh giá (sao + nội dung; blacklist filter nếu có) |
| FR-PRD-33 | `POST /api/Product/review/{reviewId}/reply` — Seller trả lời |
| FR-PRD-34 | `POST /api/Product/review/{reviewId}/report` — báo cáo review |
| FR-PRD-35 | `POST /api/Product/Report` — báo cáo sản phẩm → SystemReport |
| FR-PRD-36 | Admin moderate: `GET/POST /api/Admin/product-reports*`, `review-reports*` |

---

## 4. Business rules / State

### ProductStatus
```text
Pending → Approved | Rejected  (Admin)
```

### StockStatus
`InStock` | `OutOfStock`

### Soft delete
`IsDeleted = true` → ẩn khỏi query filter (Product + dependents).

### Menu / Topping (liên quan)
- MenuCategory: `api/MenuCategory`
- Topping: `api/Topping`
- GlobalMenuCategory: Admin + `api/System/global-menu-category`

---

## 5. APIs chính

| Method | Route | Auth |
|--------|-------|------|
| GET | `/api/Product` | Public |
| GET | `/api/Product/{id}` | Public |
| GET | `/api/Product/Search` | Public |
| GET | `/api/Product/BestSellers` | Public |
| GET | `/api/Product/recommendations` | Public/Auth |
| GET | `/api/Product/Categories` | Public |
| POST | `/api/Product` | Seller |
| PUT | `/api/Product/{id}` | Seller |
| DELETE | `/api/Product/{id}` | Seller |
| PATCH | `/api/Product/StockStatus/{id}` | Seller |
| PATCH | `/api/Product/Visibility/{id}` | Seller |
| PATCH | `/api/Product/TimeAvailability/{id}` | Seller |
| POST | `/api/Product/Report` | Auth |
| GET | `/api/Product/{productId}/reviews` | Public |
| GET | `/api/Product/seller/reviews` | Seller |
| POST | `/api/Product/review` | Customer |
| POST | `/api/Product/review/{reviewId}/reply` | Seller |
| POST | `/api/Product/review/{reviewId}/report` | Auth |
| POST | `/api/Admin/ApproveProduct` | Admin |

---

## 6. Key files

| Tầng | Path |
|------|------|
| Controller | `src/ShoppingFood.API/Controllers/ProductController.cs` |
| Admin approve | `API/Controllers/AdminController.cs` (`ApproveProduct`) |
| Handlers | `Application/Features/Products/**` |
| Entity | `Domain/Models/Product.cs`, `ProductImage`, `ProductSize`, `ProductTopping`, `ProductReview` |
| Blacklist | `Application/Services/BlacklistFilterService.cs` |
| FE Customer | `pages/ProductsPage.tsx`, `ProductDetailPage.tsx` |
| FE Reviews | `components/product/ProductReviews.tsx` |
| FE Seller | `pages/seller/SellerProductsPage.tsx`, `SellerReviewsPage.tsx` |
| FE Hook | `hooks/useProducts.ts`, `hooks/useAdmin.ts` |
| FE Service | `services/ProductService.ts` |

---

## 7. Acceptance Criteria

- [ ] Guest search/detail OK; soft-deleted không hiện
- [ ] Seller tạo món → Pending → Admin Approve → hiện storefront
- [ ] Seller không sửa món quán khác (403)
- [ ] Stock OutOfStock / ẩn Visibility phản ánh UI khách
- [ ] TimeAvailability ngoài khung → không bán (theo handler/FE)
- [ ] Quán Suspended → Seller không ghi được Product API
- [ ] Review + reply + report tạo được; Admin thấy product-reports
- [ ] Delete soft — không còn trong search

---

## 8. Cảnh báo / Thông báo hệ thống

| Message | Loại | File FE | Trigger | API | Mức độ |
|---------|------|---------|---------|-----|--------|
| Thêm sản phẩm thành công! | success | `hooks/useProducts.ts` / SellerProducts | Create | `POST /Product` | Info |
| Cập nhật sản phẩm thành công! | success | same | Update | `PUT /Product/{id}` | Info |
| Xóa sản phẩm thành công! | success | same | Delete | `DELETE /Product/{id}` | Warn |
| Vui lòng nhập tên SP / Giá > 0 / Chọn danh mục | validation | `SellerProductsPage.tsx` | Form | — | Warn |
| Đã hiện/ẩn sản phẩm | success | `SellerProductsPage.tsx` | Visibility | `PATCH Visibility/{id}` | Info |
| Đã mở bán lại / đánh dấu hết hàng | success | `SellerProductsPage.tsx` | Stock | `PATCH StockStatus/{id}` | Info |
| **Xác nhận xóa** / Bạn chắc muốn xóa "{name}"? | confirm | `SellerProductsPage.tsx` DeleteConfirmModal | Delete | `DELETE /Product/{id}` | Warn |
| Đang tải ảnh… / Tải ảnh lên thành công | loading/success | `SellerProductsPage.tsx` | Upload | `/User/UploadImage` | Info |
| Unauthorized / Access denied. You do not own this restaurant. | error | API→toast | Wrong owner | `POST/PUT Product` | Critical |
| Đã duyệt / từ chối sản phẩm | success | `hooks/useAdmin.ts`, Approvals | ApproveProduct | `/Admin/ApproveProduct` | Info |
| Báo cáo sản phẩm đã gửi thành công | success | `ProductDetailPage.tsx` | Report | `POST /Product/Report` | Info |
| Đánh giá đã gửi thành công | success | `ProductReviews.tsx` | Review | `POST /Product/review` | Info |
| Gửi phản hồi / Báo cáo đánh giá thành công | success | `SellerReviewsPage.tsx` / ProductReviews | Reply/Report | review reply/report | Info |
| Đã tắt lọc vị trí / Đang lấy vị trí… / Đã lấy vị trí… | info/loading/success | `ProductsPage.tsx` | Geo filter | — | Info |
| Thêm/Cập nhật danh mục thành công | success | `SellerCategoriesPage` / `useCategories` | MenuCategory | `/MenuCategory` | Info |
| Thêm/Cập nhật/xóa topping… | success/error | `SellerToppingsPage.tsx` | Topping CRUD | `/Topping` | Info |
| Có lỗi xảy ra / Lỗi kết nối mạng (fallback) | error | nhiều page | Network | * | Warn |

---

## 9. Tóm tắt

Product = **catalog public + Seller CRUD (Pending→Admin Approve) + stock/visibility/time + reviews/reports**.  
Workflow: [Product_Catalog_Workflow.md](../workflows/Product_Catalog_Workflow.md).
