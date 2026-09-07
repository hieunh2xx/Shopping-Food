# Sơ đồ lớp Class Diagram & Prompts tối ưu hóa cho Visual Paradigm AI

Tài liệu này tổng hợp toàn bộ các câu prompt vẽ sơ đồ lớp (Class Diagram) bằng AI trên Visual Paradigm của phân hệ **2.1.4 (Order & Cart)** và **2.1.9 (Admin, Analytics & Config)**.

*Lưu ý: Tất cả các quan hệ liên kết đã được loại bỏ từ khóa `directly` và đồng bộ theo đúng định dạng mẫu của phần 2.1.4 để đảm bảo Visual Paradigm AI nhận dạng và vẽ các đường nối chính xác 100%.*

---

# PHẦN A: CLASS DIAGRAMS CHO PHÂN HỆ 2.1.4 (ORDER & CART)

## 1. Sơ đồ 1: Sơ đồ Quản lý giỏ hàng (Cart Management)
```text
Create a UML Class Diagram for a Shopping Cart System with explicit separate lines.

[Classes Definition]
- Class CartController has methods: AddToCart(), UpdateQuantity(), RemoveItem(), ClearCart(), GetCart().
- Class Cart has attributes: id: int, userAccountId: int, guestUserId: int, createdAt: DateTime, updatedAt: DateTime.
- Class CartItem has attributes: id: int, cartId: int, productId: int, quantity: int, priceAtAdded: float, createdAt: DateTime.
- Class Product has attributes: id: int, restaurantId: int, name: String, price: float, stockStatus: String, isHidden: boolean.
- Class Topping has attributes: id: int, toppingName: String, price: float, isAvailable: boolean.
- Class User has attributes: id: int, username: String, email: String.

[Strict Connections Layout]
- Line 1: Draw a dashed dependency arrow from CartController directly to Cart.
- Line 2: Draw a composition line from Cart to CartItem. The solid black diamond is at Cart (1) and connects to CartItem (*).
- Line 3: Draw a brand new, independent association line from CartItem to Product. Multiplicity is * at CartItem and 1 at Product.
- Line 4: Draw a brand new, independent association line from CartItem to Topping. Multiplicity is * at CartItem and * at Topping.
- Line 5: Draw a brand new, independent association line from Cart to User. Multiplicity is * at Cart and 1 at User.

[Positioning Rules]
- Move Product and Topping to the right side of CartItem.
- Move User to the top, right above Cart.
- Absolutely do not combine or overlay labels on the same line. Each line must connect separate boxes.
```

---

## 2. Sơ đồ 2: Sơ đồ Đặt hàng (Place Order / Checkout)
```text
Create a UML Class Diagram for an Order Checkout System with strict separate lines and layout.

[Classes Definition]
- Class CheckoutController has methods: Checkout(), SendCheckoutOtp().
- Class Order has attributes: id: int, userAccountId: int, guestUserId: int, restaurantId: int, totalAmount: double, shippingFee: double, deliveryAddress: String, contactName: String, contactPhone: String, status: String, paymentMethod: String, paymentStatus: String.
- Class OrderItem has attributes: id: int, orderId: int, productId: int, itemName: String, quantity: int, unitPrice: double, totalPrice: double.
- Class Product has attributes: id: int, name: String, price: double.
- Class Topping has attributes: id: int, toppingName: String, price: double.
- Class Discount has attributes: id: int, code: String, discountValue: double, isActive: boolean.
- Class OtpRecord has attributes: id: int, emailOrPhone: String, otpCode: String, expiryTime: DateTime, isUsed: boolean.
- Class User has attributes: id: int, username: String, email: String.

[Strict Connections Layout]
- Line 1: Draw a dashed dependency arrow from CheckoutController to Order. Labeled as "processes".
- Line 2: Draw a dashed dependency arrow from CheckoutController to OtpRecord. Labeled as "verifies".
- Line 3: Draw a composition line from Order to OrderItem. The solid black diamond is at Order (multiplicity 1) and connects to OrderItem (multiplicity *). Labeled as "contains".
- Line 4: Draw an independent association line from OrderItem to Product. Multiplicity is * at OrderItem and 1 at Product. Labeled as "references".
- Line 5: Draw an independent association line from OrderItem to Topping. Multiplicity is * at OrderItem and * at Topping. Labeled as "has topping".
- Line 6: Draw an independent association line from Order to Discount. Multiplicity is * at Order and 1 at Discount. Labeled as "applies discount".
- Line 7: Draw an independent association line from Order to User. Multiplicity is * at Order and 1 at User. Labeled as "placed by".

[Positioning Rules]
- Place CheckoutController on the far left.
- Place Order next to CheckoutController.
- Place OtpRecord directly below CheckoutController.
- Place OrderItem, Product, and Topping in a horizontal row to the right of Order.
- Place User right above Order, and place Discount right below Order.
- Absolutely do not combine or overlay labels on the same line.
```

---

## 3. Sơ đồ 3: Sơ đồ Theo dõi & Xử lý đơn hàng (Order Tracking & Management)
```text
Create a UML Class Diagram for Order Tracking and Management with strict entity isolation.

[Classes Definition]
- Class OrderController has methods: trackOrderStatus(), acceptOrder(), rejectOrder(), prepareOrder(), waitingShipper(), cancelOrder().
- Class Order has attributes: id: int, userAccountId: int, shipperId: int, restaurantId: int, totalAmount: double, status: String, rejectReason: String, updatedAt: DateTime.
- Class ShipperProfile has attributes: id: int, fullName: String, phone: String, vehiclePlate: String, isOnline: boolean.
- Class RestaurantProfile has attributes: id: int, restaurantName: String, address: String, phone: String.

[Strict Connections Layout]
- Line 1: Draw a dashed dependency arrow from OrderController to Order. Labeled as "controls".
- Line 2: Draw an independent association line from Order to ShipperProfile. Multiplicity is * at Order and 1 at ShipperProfile. Labeled as "has shipper".
- Line 3: Draw an independent association line from Order to RestaurantProfile. Multiplicity is * at Order and 1 at RestaurantProfile. Labeled as "has restaurant".

[Positioning Rules]
- Arrange all 4 classes in a single horizontal row from left to right in this exact order: OrderController, Order, RestaurantProfile, ShipperProfile.
- Ensure all boxes are aligned cleanly on a grid layout and do not overlap.
```

---

# PHẦN B: CLASS DIAGRAMS CHO PHÂN HỆ 2.1.9 (ADMIN, ANALYTICS & CONFIG)

## 1. Sơ đồ 4: Manage Shipper (Quản lý hồ sơ tài xế - UC-SYS-001)
```text
Create a UML Class Diagram for Shipper Account Management with strict separate lines and layout.

[Classes Definition]
- Class ShipperController has methods: getShipperList(), getShipperDetail(), suspendShipper(), reactivateShipper().
- Class ShipperProfile has attributes: id: int, userProfileId: int, fullName: String, phone: String, vehiclePlate: String, status: String, reputationScore: int.
- Class ShipperApplication has attributes: id: int, userProfileId: int, status: String, submittedAt: DateTime.
- Class User has attributes: id: int, username: String, email: String.

[Strict Connections Layout]
- Line 1: Draw a dashed dependency arrow from ShipperController to ShipperProfile. Labeled as "manages".
- Line 2: Draw a dashed dependency arrow from ShipperController to ShipperApplication. Labeled as "reviews".
- Line 3: Draw an independent association line from ShipperProfile to User. Multiplicity is 1 at User and 0..1 at ShipperProfile. Labeled as "belongs to".
- Line 4: Draw an independent association line from ShipperApplication to User. Multiplicity is 1 at User and * at ShipperApplication. Labeled as "submitted by".

[Positioning Rules]
- Place ShipperController on the far left.
- Place ShipperProfile and ShipperApplication in a vertical column next to ShipperController.
- Place User to the far right, next to ShipperProfile.
- Absolutely do not combine or overlay labels on the same line.
```

---

## 2. Sơ đồ 5: View Real-Time Revenue Dashboard (Báo cáo doanh thu hệ thống - UC-SYS-0012)
```text
Create a UML Class Diagram for Revenue Analytics and Dashboard with strict separate lines and layout.

[Classes Definition]
- Class DashboardController has methods: viewRevenueDashboard(), getRevenueMetrics().
- Class Order has attributes: id: int, restaurantId: int, totalAmount: double, platformCommission: double, sellerPayout: double, status: String, createdAt: DateTime.
- Class PaymentSession has attributes: id: int, orderId: int, amount: double, paymentMethod: String, status: String, createdAt: DateTime.
- Class FinancialTransaction has attributes: id: int, orderId: int, amount: double, transactionType: String, status: String, createdAt: DateTime.

[Strict Connections Layout]
- Line 1: Draw a dashed dependency arrow from DashboardController to Order. Labeled as "reads metrics".
- Line 2: Draw a dashed dependency arrow from DashboardController to FinancialTransaction. Labeled as "analyzes".
- Line 3: Draw an independent association line from Order to PaymentSession. Multiplicity is 1 at Order and 0..1 at PaymentSession. Labeled as "has payment".
- Line 4: Draw an independent association line from FinancialTransaction to Order. Multiplicity is * at FinancialTransaction and 1 at Order. Labeled as "records".

[Positioning Rules]
- Place DashboardController on the far left.
- Place Order in the center.
- Place PaymentSession directly above Order.
- Place FinancialTransaction to the right of Order.
- Absolutely do not combine or overlay labels on the same line.
```

---

## 3. Sơ đồ 6: View Restaurant Performance Reports (Báo cáo doanh số nhà hàng - UC-SYS-005)
```text
Create a UML Class Diagram for Restaurant Performance Analysis with strict separate lines and layout.

[Classes Definition]
- Class PerformanceReportController has methods: viewPerformanceReports(), getPerformanceMetrics().
- Class RestaurantProfile has attributes: id: int, restaurantName: String, ownerId: int, address: String, status: String.
- Class Order has attributes: id: int, restaurantId: int, totalAmount: double, status: String, createdAt: DateTime.
- Class Product has attributes: id: int, restaurantId: int, name: String, price: float.

[Strict Connections Layout]
- Line 1: Draw a dashed dependency arrow from PerformanceReportController to RestaurantProfile. Labeled as "queries".
- Line 2: Draw a dashed dependency arrow from PerformanceReportController to Order. Labeled as "calculates sales".
- Line 3: Draw an independent association line from Order to RestaurantProfile. Multiplicity is * at Order and 1 at RestaurantProfile. Labeled as "placed at".
- Line 4: Draw an independent association line from Product to RestaurantProfile. Multiplicity is * at Product and 1 at RestaurantProfile. Labeled as "offered by".

[Positioning Rules]
- Place PerformanceReportController on the far left.
- Place RestaurantProfile in the center.
- Place Order directly above RestaurantProfile.
- Place Product directly below RestaurantProfile.
- Absolutely do not combine or overlay labels on the same line.
```

---

## 4. Sơ đồ 7: Manage and Authorize Internal Staff Roles (Phân quyền nhân viên - UC-SYS-010)
```text
Create a UML Class Diagram for Internal Staff Account Authorization with strict separate lines and layout.

[Classes Definition]
- Class StaffRoleController has methods: createStaffAccount(), assignRole(), updatePermissions().
- Class User has attributes: id: int, username: String, email: String, status: String.
- Class UserProfile has attributes: id: int, userAccountId: int, fullName: String, role: String.
- Class UserPermission has attributes: id: int, userAccountId: int, permissionName: String.
- Class RolePermission has attributes: id: int, roleName: String, permissionName: String.

[Strict Connections Layout]
- Line 1: Draw a dashed dependency arrow from StaffRoleController to UserProfile. Labeled as "assigns role".
- Line 2: Draw a dashed dependency arrow from StaffRoleController to UserPermission. Labeled as "assigns permissions".
- Line 3: Draw an independent association line from User to UserProfile. Multiplicity is 1 at User and 1 at UserProfile. Labeled as "has profile".
- Line 4: Draw an independent association line from UserPermission to User. Multiplicity is * at UserPermission and 1 at User. Labeled as "granted to".
- Line 5: Draw an independent association line from RolePermission to UserProfile. Multiplicity is * at RolePermission and * at UserProfile. Labeled as "defines rules".

[Positioning Rules]
- Place StaffRoleController on the far left.
- Place User and UserProfile in a row in the center.
- Place UserPermission directly above UserProfile.
- Place RolePermission directly below UserProfile.
- Absolutely do not combine or overlay labels on the same line.
```

---

## 5. Sơ đồ 8: Activate System Maintenance Mode (Bảo trì hệ thống - UC-SYS-012)
```text
Create a UML Class Diagram for System Maintenance Administration with strict separate lines and layout.

[Classes Definition]
- Class MaintenanceController has methods: activateMaintenanceMode(), deactivateMaintenanceMode(), updateMaintenanceWarning().
- Class SystemConfig has attributes: id: int, key: String, value: String, description: String, updatedAt: DateTime.
- Class ActionLog has attributes: id: int, userAccountId: int, actionType: String, description: String, timestamp: DateTime.
- Class User has attributes: id: int, username: String, role: String.

[Strict Connections Layout]
- Line 1: Draw a dashed dependency arrow from MaintenanceController to SystemConfig. Labeled as "toggles state".
- Line 2: Draw a dashed dependency arrow from MaintenanceController to ActionLog. Labeled as "audits".
- Line 3: Draw an independent association line from ActionLog to User. Multiplicity is * at ActionLog and 1 at User. Labeled as "logged by".

[Positioning Rules]
- Place MaintenanceController on the far left.
- Place SystemConfig and ActionLog in a column in the center.
- Place User to the right of ActionLog.
- Absolutely do not combine or overlay labels on the same line.
```

---

## 6. Sơ đồ 9: Manage User List (Quản lý danh sách người dùng - UC-SYS-012)
```text
Create a UML Class Diagram for User Management System with strict separate lines and layout.

[Classes Definition]
- Class UserAdminController has methods: viewUserList(), searchUsers(), suspendUser(), reactivateUser().
- Class User has attributes: id: int, username: String, email: String, phone: String, status: String, createdAt: DateTime.
- Class UserProfile has attributes: id: int, userAccountId: int, fullName: String, role: String.
- Class UserAddress has attributes: id: int, userAccountId: int, receiverName: String, phone: String, streetAddress: String.

[Strict Connections Layout]
- Line 1: Draw a dashed dependency arrow from UserAdminController to User. Labeled as "manages".
- Line 2: Draw an independent association line from User to UserProfile. Multiplicity is 1 at User and 1 at UserProfile. Labeled as "has profile".
- Line 3: Draw an independent association line from UserAddress to User. Multiplicity is * at UserAddress and 1 at User. Labeled as "belongs to".

[Positioning Rules]
- Place UserAdminController on the far left.
- Place User in the center.
- Place UserProfile directly above User.
- Place UserAddress directly below User.
- Absolutely do not combine or overlay labels on the same line.
```
