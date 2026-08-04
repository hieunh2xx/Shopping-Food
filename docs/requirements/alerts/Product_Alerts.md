# Cảnh báo — Product

> Requirements: [../Product_Requirements.md](../Product_Requirements.md)

| ID | Message | Loại | Mức độ | Nơi hiện | File | Trigger | API |
|----|---------|------|--------|----------|------|---------|-----|
| AL-PRD-01 | Thêm sản phẩm thành công! | success | Info | Toast | `useProducts` / SellerProducts | Create | `POST /Product` |
| AL-PRD-02 | Cập nhật sản phẩm thành công! | success | Info | Toast | same | Update | `PUT /Product/{id}` |
| AL-PRD-03 | Xóa sản phẩm thành công! | success | Warn | Toast | same | Delete | `DELETE /Product/{id}` |
| AL-PRD-04 | **Xác nhận xóa** / Bạn chắc muốn xóa "{name}"? | confirm | Warn | DeleteConfirmModal | `SellerProductsPage` | Delete | DELETE |
| AL-PRD-05 | Vui lòng nhập tên SP / Giá > 0 / Chọn danh mục | validation | Warn | Toast | SellerProductsPage | Form | — |
| AL-PRD-06 | Đã hiện/ẩn sản phẩm | success | Info | Toast | SellerProductsPage | Visibility | `PATCH Visibility/{id}` |
| AL-PRD-07 | Đã mở bán lại / đánh dấu hết hàng | success | Info | Toast | SellerProductsPage | Stock | `PATCH StockStatus/{id}` |
| AL-PRD-08 | Đang tải ảnh… / Tải ảnh thành công | loading/success | Info | Toast | SellerProductsPage | Upload | `/User/UploadImage` |
| AL-PRD-09 | Access denied. You do not own this restaurant. | error | Critical | Toast | — | Wrong owner | Add/Update Product |
| AL-PRD-10 | Báo cáo sản phẩm đã gửi thành công | success | Info | Toast | `ProductDetailPage` | Report | `POST /Product/Report` |
| AL-PRD-11 | Đánh giá đã gửi / Phản hồi / Báo cáo vi phạm | success | Info | Toast | `ProductReviews` | Review flows | `/Product/review*` |
| AL-PRD-12 | Đã tắt lọc vị trí / Đang lấy vị trí… / Đã lấy vị trí… | info/loading/success | Info | Toast | `ProductsPage` | Geo filter | — |
| AL-PRD-13 | Thêm/Cập nhật danh mục / topping thành công | success | Info | Toast | SellerCategories/Toppings | CRUD | MenuCategory/Topping |
| AL-PRD-14 | Admin duyệt/từ chối sản phẩm | success | Info | Toast | `useAdmin` / Approvals | ApproveProduct | Admin ApproveProduct |
| AL-PRD-15 | Gửi phản hồi / Báo cáo đánh giá (seller) | success | Info | Toast | `SellerReviewsPage` | Reply/report | review reply/report |

## Checklist QA Product Alerts

- [ ] Delete có Confirm AL-PRD-04
- [ ] Seller khác quán → AL-PRD-09
- [ ] Approve Admin → AL-PRD-14
