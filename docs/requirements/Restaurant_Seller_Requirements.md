# Requirements: Nhà hàng & Seller (Restaurant / Seller)

Tài liệu **yêu cầu nghiệp vụ** cho phân hệ khám phá nhà hàng, cài đặt quán, đăng ký Seller, duyệt Admin, treo quán, nâng cấp Mall.

> Workflow: [../workflows/Restaurant_Seller_Workflow.md](../workflows/Restaurant_Seller_Workflow.md)  
> Chia tiền theo DeliveryType: [Revenue_Split_Requirements.md](./Revenue_Split_Requirements.md) · [../workflows/Revenue_Split_Requirements.md](../workflows/Revenue_Split_Requirements.md)

---

## 1. Mục tiêu nghiệp vụ

1. Cho khách **xem chi tiết / nearby / yêu thích** nhà hàng.
2. Cho Seller/Mall **cấu hình** thông tin, giờ mở, trạng thái, bán kính, phí ship, delivery-config.
3. Cho Customer **ApplySeller** → Admin **Approve/Reject** → tạo `RestaurantProfile`.
4. Admin **suspend / verify** quán; Seller **UpgradeToMall**.
5. Phân biệt **PlatformDelivery** vs **SelfDelivery** (ảnh hưởng phí ship & chia tiền).

---

## 2. Actors & quyền

| Actor | Quyền |
|-------|--------|
| **Guest / Customer** | Xem detail, nearby; Favorite cần Auth |
| **Customer** | `POST /api/User/ApplySeller`, xem status đơn |
| **Seller / Mall** | Settings quán, DashboardStats; Mall: UpgradeToMall (Seller→Mall) |
| **Admin** | Duyệt đơn seller, suspend, toggle verification, list restaurants, custom commission |

---

## 3. Functional Requirements

### FR-RES-01 — Chi tiết nhà hàng

| ID | Requirement |
|----|-------------|
| FR-RES-01 | `GET /api/Restaurant/{id}` public — trả hồ sơ quán + menu context |
| FR-RES-02 | Quán `Suspended` / Inactive: FE vẫn có thể xem nhưng Seller write bị chặn bởi `CheckSellerSuspensionAttribute` |

### FR-RES-02 — Nearby & Favorite

| ID | Requirement |
|----|-------------|
| FR-RES-10 | `GET /api/Restaurant/nearby` — theo lat/lng (query) |
| FR-RES-11 | `GET /api/Restaurant/Favorites` — Auth |
| FR-RES-12 | `POST /api/Restaurant/{id}/Favorite` — toggle yêu thích (composite PK UserProfile+Restaurant) |

### FR-RES-03 — Seller settings

| ID | Requirement |
|----|-------------|
| FR-RES-20 | `PUT /api/Restaurant/basic-info` — tên, mô tả, ảnh, địa chỉ… |
| FR-RES-21 | `PUT /api/Restaurant/operating-hours` — giờ mở cửa |
| FR-RES-22 | `PUT /api/Restaurant/status` — Active/Inactive |
| FR-RES-23 | `PUT /api/Restaurant/delivery-radius` — bán kính giao |
| FR-RES-24 | `PUT /api/Restaurant/delivery-config` — FreeShippingMinimumOrder, FreeDeliveryRadiusKm, DeliveryType… |
| FR-RES-25 | `PUT /api/Restaurant/shipping-fee` — phí ship self-delivery |
| FR-RES-26 | `GET /api/Restaurant/DashboardStats` — thống kê Seller |
| FR-RES-27 | Seller Suspended: chặn POST/PUT/PATCH/DELETE (filter global) |

### FR-RES-04 — DeliveryType

| ID | Requirement |
|----|-------------|
| FR-RES-30 | `DeliveryType.PlatformDelivery` — phí ship khách từ DeliverySettings; ShipperIncome > 0 |
| FR-RES-31 | `DeliveryType.SelfDelivery` — phí ship theo quán; ShipperIncome = 0; Seller nhận thêm ShippingFee khi settle |
| FR-RES-32 | SelfDelivery: vượt `MaxDeliveryRadiusKm` → checkout lỗi |

### FR-RES-05 — Apply Seller & Approve

| ID | Requirement |
|----|-------------|
| FR-RES-40 | `POST /api/User/ApplySeller` — Customer nộp đơn (+ ảnh GP, thông tin quán) |
| FR-RES-41 | `GET /api/User/SellerApplication/Status` — trạng thái Pending/Approved/Rejected/NeedsInfo |
| FR-RES-42 | `PUT /api/User/SellerApplication` — cập nhật khi NeedsInfo / resubmit |
| FR-RES-43 | `POST /api/User/RegisterSeller` — đăng ký kèm apply (public) |
| FR-RES-44 | Admin `GET /api/Admin/SellerApplications` |
| FR-RES-45 | Admin `POST /api/Admin/ApproveSellerApplication` — Approved → tạo RestaurantProfile + role Seller; Rejected/NeedsInfo kèm lý do |
| FR-RES-46 | `GET /api/Admin/Restaurants` — danh sách quán |

### FR-RES-06 — Suspend / Verify / Mall

| ID | Requirement |
|----|-------------|
| FR-RES-50 | `PUT /api/Admin/suspend-restaurant` — Suspended + lý do; Seller bị chặn write |
| FR-RES-51 | `POST /api/Admin/Restaurants/{id}/toggle-verification` — nhãn tin cậy |
| FR-RES-52 | `POST /api/User/UpgradeToMall` — Seller xin nâng Mall (đơn ApplicationType UpgradeToMall) |
| FR-RES-53 | Admin duyệt đơn Mall → Role **Mall** |
| FR-RES-54 | Seller bị treo có thể `POST /api/Support/appeal` |

### FR-RES-07 — Hoa hồng theo quán (gap)

| ID | Requirement |
|----|-------------|
| FR-RES-60 | Admin `PUT /api/Admin/finance-config/restaurants/{id}` set `CustomCommissionRate` |
| FR-RES-61 | **Gap:** settle hiện dùng `PlatformFinanceConfig.CommissionRate` global — chưa đọc CustomCommissionRate |

---

## 4. API surface

| Method | Route | Actor |
|--------|-------|-------|
| GET | `/api/Restaurant/{id}` | Public |
| GET | `/api/Restaurant/nearby` | Public |
| GET | `/api/Restaurant/Favorites` | Auth |
| POST | `/api/Restaurant/{id}/Favorite` | Auth |
| GET | `/api/Restaurant/DashboardStats` | Seller |
| PUT | `/api/Restaurant/basic-info` | Seller |
| PUT | `/api/Restaurant/operating-hours` | Seller |
| PUT | `/api/Restaurant/status` | Seller |
| PUT | `/api/Restaurant/delivery-radius` | Seller |
| PUT | `/api/Restaurant/delivery-config` | Seller |
| PUT | `/api/Restaurant/shipping-fee` | Seller |
| POST | `/api/User/ApplySeller` | Customer |
| GET | `/api/User/SellerApplication/Status` | Auth |
| PUT | `/api/User/SellerApplication` | Auth |
| POST | `/api/User/UpgradeToMall` | Seller |
| GET | `/api/Admin/SellerApplications` | Admin |
| POST | `/api/Admin/ApproveSellerApplication` | Admin |
| GET | `/api/Admin/Restaurants` | Admin |
| PUT | `/api/Admin/suspend-restaurant` | Admin |
| POST | `/api/Admin/Restaurants/{id}/toggle-verification` | Admin |

---

## 5. Key files

| Vai trò | File |
|---------|------|
| API | `API/Controllers/RestaurantController.cs`, `UserController.cs`, `AdminController.cs` |
| Features | `Application/Features/Restaurants/*`, `Users/*ApplySeller*`, `Admin/*ApproveSeller*` |
| Entity | `RestaurantProfile`, `SellerApplication`, `FavoriteRestaurant` |
| Filter | `API/Filters/CheckSellerSuspensionAttribute.cs` |
| FE | `RestaurantDetailPage`, `RestaurantsPage`, `SellerSettingsPage`, `SellerApplyPage`, `SellerMallApplicationPage`, `AdminRestaurantsPage`, `AdminApprovalsPage` |

---

## 6. Acceptance Criteria

- [ ] Nearby trả quán theo vị trí
- [ ] Favorite toggle đúng user
- [ ] Seller cập nhật giờ/status/delivery-config thành công
- [ ] Platform vs Self: checkout tính ship & ShipperIncome đúng
- [ ] ApplySeller → Pending → Admin Approve → Role Seller + có RestaurantProfile
- [ ] Suspend → Seller không ghi được API mutating
- [ ] UpgradeToMall tạo đơn; duyệt → Role Mall
- [ ] Appeal khi bị treo gửi được SystemReport

---

## 7. Cảnh báo / Thông báo hệ thống

| Message | Loại | File | Trigger | API | Mức độ |
|---------|------|------|---------|-----|--------|
| Đã lưu quán / Đã bỏ lưu quán | success | `RestaurantDetailPage.tsx` | Favorite | `POST /Restaurant/{id}/Favorite` | Info |
| Không thể tải thông tin nhà hàng | error | `RestaurantDetailPage.tsx` | Load fail | `GET /Restaurant/{id}` | Error |
| Đã cập nhật thông tin / giờ / trạng thái / cấu hình giao hàng | success | `SellerSettingsPage.tsx` | Save settings | `PUT /Restaurant/*` | Info |
| Bán kính > 0 / Phí VC hợp lệ / nhập đủ… | error | `SellerSettingsPage.tsx` | Validation | — | Warning |
| Cửa hàng đã mở cửa / tạm đóng cửa | success | `SellerSettingsPage.tsx` | Toggle status | `PUT /Restaurant/status` | Info |
| Đăng ký thành công! Vui lòng chờ phê duyệt | success | `SellerApplyPage.tsx` | Apply | `POST /User/ApplySeller` | Info |
| Vui lòng tải GP / logo; file type/size | error | `SellerApplyPage.tsx` | Validation upload | — | Warning |
| Cập nhật và gửi lại đơn thành công! | success | `CustomerApplications` / Mall page | Resubmit | `PUT /User/SellerApplication` | Info |
| Đã treo/mở nhà hàng / nhãn tín nhiệm | success | `AdminRestaurantsPage.tsx` | Admin ops | suspend / toggle-verification | Warning |
| Đã duyệt/từ chối hồ sơ đối tác | success | `useAdmin.ts` / `AdminApprovalsPage` | Approve | `POST /Admin/ApproveSellerApplication` | Info |
| Vui lòng nhập lý do/thông báo | error | `AdminApprovalsPage.tsx` | Reject thiếu lý do | — | Warning |
| Đăng ký lên Mall (PromptModal) | confirm | `SellerLayout.tsx` | Upgrade | `POST /User/UpgradeToMall` | Confirm |
| Yêu cầu lên Mall đã được gửi thành công | success | `useAuth.ts` | Upgrade OK | `UpgradeToMall` | Info |
| Nhà hàng không hỗ trợ giao đến địa chỉ này | error | Checkout (API) | SelfDelivery vượt bán kính | `POST /Order/checkout` | Error |

---

## 8. Liên kết

- Workflow: [../workflows/Restaurant_Seller_Workflow.md](../workflows/Restaurant_Seller_Workflow.md)  
- Chia tiền: [Revenue_Split_Requirements.md](./Revenue_Split_Requirements.md)  
- Support appeal: [Support_Admin_Requirements.md](./Support_Admin_Requirements.md)  
