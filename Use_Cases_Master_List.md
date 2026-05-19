# Master List of 150 System Use Cases - Shopping Food

Tài liệu này cung cấp danh sách đặc tả đầy đủ **150 Use Cases** của hệ thống đặt và giao nhận đồ ăn **Shopping Food**, được phân loại chi tiết theo **9 phân hệ chính**. Cấu trúc này đảm bảo tính quy mô và đáp ứng đầy đủ nghiệp vụ của một nền tảng thương mại điện tử giao đồ ăn chuyên nghiệp (Enterprise-level Food Delivery Platform).

---

## 📊 Tổng quan phân bổ 150 Use Cases

| STT | Phân hệ (Module) | Số lượng Use Cases | Mã ký hiệu |
| :-: | :--- | :-: | :-: |
| 1 | **Authentication & Profile** (Xác thực & Tài khoản) | 17 | `UC-AUTH-xxx` |
| 2 | **Product & Menu Management** (Món ăn & Thực đơn) | 18 | `UC-MENU-xxx` |
| 3 | **Restaurant & Shop Management** (Quản lý nhà hàng) | 15 | `UC-SHOP-xxx` |
| 4 | **Order & Cart Management** (Giỏ hàng & Đặt hàng) | 18 | `UC-ORD-xxx` |
| 5 | **Logistics & Shipping Management** (Vận chuyển & Tài xế) | 15 | `UC-SHIP-xxx` |
| 6 | **Payment & Finance Management** (Thanh toán & Tài chính) | 15 | `UC-PAY-xxx` |
| 7 | **Promotion & Loyalty Management** (Khuyến mãi & Tích điểm) | 18 | `UC-PROM-xxx` |
| 8 | **Support & Trust Management** (Chăm sóc khách hàng & Đánh giá) | 18 | `UC-SUP-xxx` |
| 9 | **Admin, Analytics & System Config** (Quản trị & Cấu hình hệ thống) | 16 | `UC-SYS-xxx` |
| | **TỔNG CỘNG** | **150** | |

---

## 1. Phân hệ 1: Authentication & Profile (17 Use Cases)
Quản lý việc định danh, đăng ký, đăng nhập, bảo mật và thông tin cá nhân của toàn bộ các đối tượng người dùng.

| Mã UC | Tên Use Case | Tác nhân chính (Actor) | Mô tả ngắn gọn |
| :--- | :--- | :--- | :--- |
| `UC-AUTH-001` | Đăng ký tài khoản Customer | Guest | Tạo tài khoản khách hàng mới qua SĐT/Email. |
| `UC-AUTH-002` | Đăng ký tài khoản đối tác Seller | Guest | Tạo tài khoản đăng ký mở cửa hàng bán thức ăn. |
| `UC-AUTH-003` | Đăng nhập bằng Email/Mật khẩu | User | Đăng nhập truyền thống vào hệ thống. |
| `UC-AUTH-004` | Đăng nhập bằng Số điện thoại + OTP | User | Đăng nhập nhanh không mật khẩu qua mã xác minh SMS. |
| `UC-AUTH-005` | Đăng nhập bên thứ ba (Social Login) | User | Đăng nhập tích hợp qua tài khoản Google/Facebook. |
| `UC-AUTH-006` | Đăng xuất khỏi hệ thống | User | Đăng xuất, hủy phiên hoạt động (session/token) an toàn. |
| `UC-AUTH-007` | Yêu cầu khôi phục mật khẩu | User | Yêu cầu liên kết đổi mật khẩu khi quên. |
| `UC-AUTH-008` | Xác thực mã OTP đặt lại mật khẩu | User | Xác minh mã OTP 6 số để kích hoạt đổi mật khẩu mới. |
| `UC-AUTH-009` | Thay đổi mật khẩu tài khoản | User | Cập nhật mật khẩu mới khi đang trong trạng thái đăng nhập. |
| `UC-AUTH-010` | Xem thông tin cá nhân (Profile) | User | Hiển thị thông tin cá nhân, vai trò và ngày tham gia. |
| `UC-AUTH-011` | Cập nhật thông tin cá nhân | User | Thay đổi họ tên, số điện thoại liên hệ, ảnh đại diện. |
| `UC-AUTH-012` | Xác thực/Liên kết số điện thoại | User | Xác minh OTP số điện thoại để tăng độ tin cậy tài khoản. |
| `UC-AUTH-013` | Xác thực/Liên kết địa chỉ Email | User | Xác thực email đăng ký để nhận thông tin hóa đơn. |
| `UC-AUTH-014` | Quản lý sổ địa chỉ nhận hàng | Customer | Thêm, sửa, xóa các địa chỉ nhận hàng (Nhà riêng, Cơ quan...). |
| `UC-AUTH-015` | Thiết lập địa chỉ nhận hàng mặc định | Customer | Đánh dấu 1 địa chỉ để tự động điền khi đặt hàng. |
| `UC-AUTH-016` | Khóa/Mở khóa tài khoản thủ công | Admin | Khóa tài khoản người dùng vi phạm quy chế hệ thống. |
| `UC-AUTH-017` | Yêu cầu xóa tài khoản vĩnh viễn | Customer | Người dùng yêu cầu xóa vĩnh viễn tài khoản và dữ liệu cá nhân. |

---

## 2. Phân hệ 2: Product & Menu Management (18 Use Cases)
Quản lý vòng đời của món ăn, các danh mục thực đơn, tìm kiếm và tối ưu hiển thị danh sách món.

| Mã UC | Tên Use Case | Tác nhân chính (Actor) | Mô tả ngắn gọn |
| :--- | :--- | :--- | :--- |
| `UC-MENU-001` | Xem danh mục món ăn hệ thống | Guest, Customer | Hiển thị các nhóm ẩm thực toàn sàn (Cơm, Bún, Trà sữa...). |
| `UC-MENU-002` | Xem chi tiết món ăn | Guest, Customer | Xem hình ảnh, giá cả, mô tả, các tùy chọn toppings của món. |
| `UC-MENU-003` | Tìm kiếm món ăn bằng từ khóa | Guest, Customer | Tìm món ăn hoặc nhà hàng qua thanh công cụ tìm kiếm. |
| `UC-MENU-004` | Lọc món ăn nâng cao | Guest, Customer | Lọc món theo khoảng giá, đánh giá, khoảng cách, Freeship. |
| `UC-MENU-005` | Xem danh sách món ăn bán chạy | Guest, Customer | Hiển thị danh sách món có lượng đặt hàng cao nhất khu vực. |
| `UC-MENU-006` | Gợi ý món ăn thông minh | Customer | Đề xuất món ăn dựa trên lịch sử tìm kiếm và thói quen ăn uống. |
| `UC-MENU-007` | Thêm món ăn mới vào thực đơn | Seller | Đăng món mới với tên, mô tả, giá bán và hình ảnh. |
| `UC-MENU-008` | Cập nhật thông tin món ăn | Seller | Sửa đổi giá, mô tả hoặc hình ảnh của món ăn hiện tại. |
| `UC-MENU-009` | Ẩn/Hiện món ăn trên thực đơn | Seller | Đóng/mở hiển thị món ăn mà không cần xóa khỏi cơ sở dữ liệu. |
| `UC-MENU-010` | Xóa món ăn khỏi thực đơn | Seller | Gỡ bỏ hoàn toàn món ăn ra khỏi thực đơn của quán. |
| `UC-MENU-011` | Cập nhật trạng thái còn/hết hàng | Seller | Đánh dấu món ăn là Hết hàng (Out of Stock) tạm thời. |
| `UC-MENU-012` | Tạo danh mục thực đơn riêng của quán | Seller | Nhóm các món ăn lại thành danh mục (ví dụ: Combo Tiết Kiệm). |
| `UC-MENU-013` | Cập nhật tên/thứ tự danh mục | Seller | Chỉnh sửa tên hoặc sắp xếp thứ tự hiển thị danh mục món. |
| `UC-MENU-014` | Thiết lập tùy chọn thêm (Topping) | Seller | Thêm danh sách Topping, kích cỡ (Size) kèm giá tiền cộng thêm. |
| `UC-MENU-015` | Đặt khung giờ mở bán món ăn | Seller | Cấu hình món ăn chỉ bán vào giờ cố định (ví dụ: Món Ăn Sáng). |
| `UC-MENU-016` | Quản lý danh mục món ăn toàn sàn | Admin | Thêm/Sửa/Xóa các danh mục ẩm thực chung của ứng dụng. |
| `UC-MENU-017` | Phê duyệt món ăn mới của Seller | Admin | Kiểm duyệt hình ảnh và nội dung món ăn nhạy cảm trước khi lên sàn. |
| `UC-MENU-018` | Báo cáo món ăn vi phạm vệ sinh/pháp lý | Customer | Khách hàng cắm cờ báo cáo các món ăn không lành mạnh. |

---

## 3. Phân hệ 3: Restaurant & Shop Management (15 Use Cases)
Quản lý thông tin hồ sơ cửa hàng, trạng thái hoạt động của nhà hàng và phê duyệt hồ sơ đối tác mới.

| Mã UC | Tên Use Case | Tác nhân chính (Actor) | Mô tả ngắn gọn |
| :--- | :--- | :--- | :--- |
| `UC-SHOP-001` | Xem danh sách cửa hàng gần đây | Guest, Customer | Hiển thị các nhà hàng hoạt động dựa trên GPS của thiết bị. |
| `UC-SHOP-002` | Xem chi tiết hồ sơ nhà hàng | Guest, Customer | Hiển thị địa chỉ, giờ hoạt động, đánh giá và thực đơn quán. |
| `UC-SHOP-003` | Lưu nhà hàng vào danh sách yêu thích | Customer | Đánh dấu yêu thích nhà hàng để truy cập nhanh lần sau. |
| `UC-SHOP-004` | Gửi đơn đăng ký mở quán (Seller App) | Guest | Nộp hồ sơ đăng ký kinh doanh, ảnh quán và thông tin liên hệ. |
| `UC-SHOP-005` | Xem trạng thái phê duyệt hồ sơ | Guest | Theo dõi tiến độ duyệt hồ sơ mở quán từ Admin. |
| `UC-SHOP-006` | Cập nhật hồ sơ đăng ký theo yêu cầu | Guest | Sửa đổi thông tin, bổ sung giấy phép khi bị Admin yêu cầu. |
| `UC-SHOP-007` | Duyệt hồ sơ đăng ký quán mới | Admin | Thẩm định tài liệu kinh doanh và kích hoạt gian hàng Seller. |
| `UC-SHOP-008` | Cấu hình thông tin cơ bản quán | Seller | Sửa đổi Logo, tên hiển thị, Hotline và Banner của nhà hàng. |
| `UC-SHOP-009` | Cấu hình giờ đóng/mở cửa định kỳ | Seller | Thiết lập thời gian hoạt động cố định các ngày trong tuần. |
| `UC-SHOP-010` | Cập nhật trạng thái hoạt động khẩn cấp | Seller | Đổi trạng thái sang "Tạm nghỉ" khi quá tải hoặc có việc đột xuất. |
| `UC-SHOP-011` | Cấu hình bán kính giao hàng tối đa | Seller | Giới hạn khoảng cách nhận giao đơn (ví dụ: chỉ nhận trong 5km). |
| `UC-SHOP-012` | Quản lý đánh giá sao trung bình | System | Hệ thống tự tính toán lại điểm rating trung bình của nhà hàng. |
| `UC-SHOP-013` | Thiết lập phí dịch vụ giao hàng riêng | Seller | Cấu hình biểu phí ship riêng đối với quán tự giao hàng. |
| `UC-SHOP-014` | Đình chỉ hoạt động nhà hàng vi phạm | Admin | Khóa tài khoản nhà hàng do nhận khiếu nại nghiêm trọng. |
| `UC-SHOP-015` | Cài đặt tỷ lệ chiết khấu riêng cho quán | Admin | Áp dụng mức hoa hồng đặc biệt cho các đối tác lớn (Key Accounts). |

---

## 4. Phân hệ 4: Order & Cart Management (18 Use Cases)
Quản lý toàn bộ vòng đời giỏ hàng của người dùng, tiến trình đặt hàng, xử lý đơn của nhà hàng.

| Mã UC | Tên Use Case | Tác nhân chính (Actor) | Mô tả ngắn gọn |
| :--- | :--- | :--- | :--- |
| `UC-ORD-001` | Thêm món ăn vào giỏ hàng | Guest, Customer | Đưa món ăn kèm các tùy chọn toppings đã chọn vào giỏ hàng. |
| `UC-ORD-002` | Xem thông tin chi tiết giỏ hàng | Guest, Customer | Hiển thị danh sách món, số lượng, giá và tổng tiền tạm tính. |
| `UC-ORD-003` | Cập nhật số lượng món trong giỏ | Guest, Customer | Tăng hoặc giảm số lượng của một món ăn trong giỏ. |
| `UC-ORD-004` | Xóa món ăn khỏi giỏ hàng | Guest, Customer | Loại bỏ hoàn toàn một món ăn khỏi giỏ hàng hiện tại. |
| `UC-ORD-005` | Làm trống giỏ hàng (Clear Cart) | Guest, Customer | Xóa toàn bộ sản phẩm khỏi giỏ hàng nhanh chóng. |
| `UC-ORD-006` | Đặt hàng không tài khoản (Guest Checkout) | Guest | Điền thông tin nhận hàng, nhận OTP qua SMS và tạo đơn hàng. |
| `UC-ORD-007` | Đặt hàng bằng tài khoản thành viên | Customer | Tiến hành đặt đơn nhanh bằng thông tin hồ sơ đã lưu. |
| `UC-ORD-008` | Thiết lập ghi chú đơn hàng | Guest, Customer | Nhập yêu cầu riêng cho quán (ít cay) hoặc tài xế (gọi trước). |
| `UC-ORD-009` | Xem danh sách lịch sử mua hàng | Customer | Xem lại danh sách toàn bộ các đơn hàng đã đặt trong quá khứ. |
| `UC-ORD-010` | Theo dõi trạng thái đơn hàng thời gian thực | Guest, Customer | Theo dõi đơn hàng qua các bước: Nhận đơn, Chuẩn bị, Đang giao. |
| `UC-ORD-011` | Hủy đơn hàng chủ động | Customer | Hủy đơn hàng trong thời gian chờ nhà hàng tiếp nhận. |
| `UC-ORD-012` | Tiếp nhận đơn hàng mới | Seller | Nhận thông tin đơn hàng mới và nhấn nút xác nhận chuẩn bị. |
| `UC-ORD-013` | Từ chối đơn hàng mới kèm lý do | Seller | Từ chối đơn (hết món, đóng cửa sớm...) để hệ thống hoàn tiền/hủy. |
| `UC-ORD-014` | Cập nhật trạng thái "Đang chuẩn bị" | Seller | Chuyển trạng thái đơn sang chế độ chế biến thức ăn. |
| `UC-ORD-015` | Cập nhật trạng thái "Đang chờ Tài xế" | Seller | Xác nhận nấu xong, đóng gói món và phát tín hiệu tìm tài xế giao. |
| `UC-ORD-016` | Tra cứu đơn hàng bằng Mã đơn hàng | Guest | Kiểm tra trạng thái đơn hàng vãng lai bằng ID đơn hàng nhận được. |
| `UC-ORD-017` | Đặt lại đơn hàng cũ nhanh chóng | Customer | Sao chép lại toàn bộ giỏ hàng của một đơn đã đặt trước đó. |
| `UC-ORD-018` | Hủy đơn hàng do sự cố đột xuất | Seller | Hủy đơn khi đang nấu do sự cố (cháy, hết nguyên liệu đột xuất). |

---

## 5. Phân hệ 5: Logistics & Shipping Management (15 Use Cases)
Quản lý đăng ký tài xế, quy trình khớp đơn hàng tự động, hành trình giao nhận đồ ăn thời gian thực.

| Mã UC | Tên Use Case | Tác nhân chính (Actor) | Mô tả ngắn gọn |
| :--- | :--- | :--- | :--- |
| `UC-SHIP-001` | Đăng ký trở thành Tài xế (Shipper) | Guest | Nộp hồ sơ lý lịch, thông tin xe và bằng lái để ứng tuyển. |
| `UC-SHIP-002` | Thẩm định & Duyệt tài xế mới | Admin | Phỏng vấn, đối chiếu hồ sơ gốc và kích hoạt tài khoản Shipper. |
| `UC-SHIP-003` | Bật/Tắt trạng thái hoạt động nhận đơn | Shipper | Chuyển chế độ hoạt động sang Online để hệ thống gán đơn giao. |
| `UC-SHIP-004` | Tiếp nhận đề xuất đơn giao hàng mới | Shipper | Nhận thông tin quãng đường, phí ship và thông tin điểm lấy/giao. |
| `UC-SHIP-005` | Chấp nhận đơn giao hàng | Shipper | Nhấn đồng ý nhận giao đơn trong thời gian đếm ngược. |
| `UC-SHIP-006` | Hệ thống tự động gán đơn (Auto Match) | System | Tìm tài xế tối ưu nhất dựa trên khoảng cách và tuyến đường. |
| `UC-SHIP-007` | Xác nhận đã đến cửa hàng lấy thức ăn | Shipper | Xác nhận định vị đã tới điểm bán của Seller. |
| `UC-SHIP-008` | Xác nhận đã lấy đồ ăn thành công | Shipper | Nhập mã xác nhận của cửa hàng cung cấp để bắt đầu giao hàng. |
| `UC-SHIP-009` | Tra cứu bản đồ lộ trình giao hàng | Shipper | Xem định vị đường đi ngắn nhất đến địa chỉ người mua trên bản đồ. |
| `UC-SHIP-010` | Cập nhật vị trí GPS thời gian thực | Shipper | Tự động gửi tọa độ GPS lên hệ thống để khách hàng theo dõi. |
| `UC-SHIP-011` | Liên hệ trực tiếp với Khách/Quán | Shipper | Thực hiện gọi điện hoặc gửi tin nhắn SMS/Chat trong ứng dụng. |
| `UC-SHIP-012` | Xác nhận giao hàng thành công | Shipper | Bấm xác nhận đã trao đồ ăn cho khách (kèm chụp ảnh giao nhận). |
| `UC-SHIP-013` | Báo cáo giao hàng thất bại (Sự cố) | Shipper | Khai báo lý do không giao được (khách không nghe máy, boom hàng). |
| `UC-SHIP-014` | Xem báo cáo thu nhập theo ngày/tuần | Shipper | Thống kê số tiền ship thực nhận, tiền thưởng và số đơn hoàn thành. |
| `UC-SHIP-015` | Đăng ký lịch làm việc/Khu vực hoạt động | Shipper | Cấu hình khu vực mong muốn nhận đơn để tối ưu hóa quãng đường. |

---

## 6. Phân hệ 6: Payment & Finance Management (15 Use Cases)
Xử lý các cổng thanh toán, nạp rút tiền ví điện tử, quản lý công nợ và hoàn tiền giao dịch.

| Mã UC | Tên Use Case | Tác nhân chính (Actor) | Mô tả ngắn gọn |
| :--- | :--- | :--- | :--- |
| `UC-PAY-001` | Xem danh sách phương thức thanh toán | Guest, Customer | Hiển thị các hình thức thanh toán được hỗ trợ cho đơn hàng. |
| `UC-PAY-002` | Thanh toán trả sau bằng tiền mặt (COD) | Guest, Customer | Lựa chọn trả tiền trực tiếp cho tài xế khi nhận đồ ăn. |
| `UC-PAY-003` | Thanh toán qua Ví điện tử liên kết | Customer | Trả tiền đơn hàng bằng ví điện tử Momo, ZaloPay... tích hợp. |
| `UC-PAY-004` | Thanh toán qua Thẻ Quốc tế (Gateway) | Customer | Nhập thông tin và thanh toán bằng thẻ Visa/Mastercard/JCB. |
| `UC-PAY-005` | Khởi tạo lệnh hoàn tiền tự động | System | Xử lý hoàn tiền về tài khoản nguồn khi đơn hàng trả trước bị hủy. |
| `UC-PAY-006` | Nạp tiền vào Ví tích lũy hệ thống | Customer | Nạp tiền trực tiếp vào số dư ví của app để thanh toán nhanh. |
| `UC-PAY-007` | Rút tiền từ Ví tích lũy về Ngân hàng | Seller | Rút doanh thu bán hàng về tài khoản ngân hàng đã liên kết. |
| `UC-PAY-008` | Rút tiền ví tài xế về Ngân hàng | Shipper | Rút tiền công giao hàng tích lũy về tài khoản ngân hàng cá nhân. |
| `UC-PAY-009` | Phê duyệt lệnh rút tiền thủ công | Admin | Kiểm duyệt và duyệt chi các giao dịch rút tiền giá trị lớn. |
| `UC-PAY-010` | Xem lịch sử giao dịch tài chính | User | Tra cứu toàn bộ lịch sử nạp, rút, thanh toán và hoàn tiền. |
| `UC-PAY-011` | Yêu cầu xuất hóa đơn điện tử | Customer | Điền thông tin mã số thuế và yêu cầu nhận hóa đơn VAT qua email. |
| `UC-PAY-012` | Tự động tính toán & Trừ chiết khấu sàn | System | Khấu trừ phí hoa hồng ngay sau khi đơn hàng giao thành công. |
| `UC-PAY-013` | Quản lý hạn mức công nợ của tài xế | Admin | Thiết lập hạn mức thu tiền hộ tối đa trước khi tài xế phải nộp tiền. |
| `UC-PAY-014` | Nộp tiền hoàn công nợ tài xế | Shipper | Chuyển khoản nạp lại tiền thu hộ vượt hạn mức về cho công ty. |
| `UC-PAY-015` | Xem báo cáo đối soát tài chính định kỳ | Admin | Đối soát doanh thu chênh lệch, phí dịch vụ sàn hàng tháng. |

---

## 7. Phân hệ 7: Promotion & Loyalty Management (18 Use Cases)
Quản lý các chương trình khuyến mãi, phân phát coupon giảm giá, tích lũy điểm và thăng hạng thành viên.

| Mã UC | Tên Use Case | Tác nhân chính (Actor) | Mô tả ngắn gọn |
| :--- | :--- | :--- | :--- |
| `UC-PROM-001` | Xem danh sách mã giảm giá khả dụng | Guest, Customer | Hiển thị các mã khuyến mãi có thể áp dụng tại trang thanh toán. |
| `UC-PROM-002` | Áp dụng mã giảm giá trực tiếp | Guest, Customer | Nhập mã voucher và kiểm tra số tiền giảm trừ thực tế. |
| `UC-PROM-003` | Tạo mã giảm giá toàn hệ thống | Admin | Phát hành chiến dịch khuyến mãi lớn áp dụng cho toàn bộ các quán. |
| `UC-PROM-004` | Tạo mã giảm giá riêng của nhà hàng | Seller | Tự cấu hình voucher giảm giá riêng chi trả bởi ngân sách của quán. |
| `UC-PROM-005` | Thiết lập mã giảm giá phí vận chuyển | Admin | Tạo chương trình hỗ trợ phí ship (Freeship Code). |
| `UC-PROM-006` | Thiết lập chương trình Mua 1 Tặng 1 | Seller | Cấu hình ưu đãi tặng kèm món tương đương khi mua số lượng quy định. |
| `UC-PROM-007` | Giới hạn số lần sử dụng của Mã giảm giá | Seller, Admin | Cấu hình số lượt dùng tối đa của voucher và lượt dùng/người. |
| `UC-PROM-008` | Tích lũy điểm thưởng khi mua hàng | Customer | Tự động cộng điểm thưởng (Loyalty Points) sau khi đơn hoàn tất. |
| `UC-PROM-009` | Tra cứu số dư điểm thưởng tích lũy | Customer | Xem tổng số điểm đang sở hữu và lịch sử cộng/trừ điểm. |
| `UC-PROM-010` | Đổi điểm tích lũy lấy Voucher giảm giá | Customer | Đổi số điểm quy định để nhận mã giảm giá đặc quyền. |
| `UC-PROM-011` | Cấu hình danh mục quà tặng đổi điểm | Admin | Quản lý danh sách voucher và quà tặng vật lý quy đổi bằng điểm. |
| `UC-PROM-012` | Đánh giá hạng thành viên định kỳ | System | Tự động xếp hạng (Đồng, Bạc, Vàng, Kim Cương) theo chi tiêu năm. |
| `UC-PROM-013` | Cấu hình chương trình Flash Sale giờ vàng | Admin | Thiết lập khung giờ bán món giảm giá sâu (ví dụ: 12h-13h). |
| `UC-PROM-014` | Gửi thông báo khuyến mãi cá nhân hóa | Admin | Phát tin nhắn thông báo đẩy (Push) tới tập khách hàng mục tiêu. |
| `UC-PROM-015` | Đăng ký tham gia Flash Sale của sàn | Seller | Đăng ký đưa món ăn của quán vào chiến dịch Flash Sale chung. |
| `UC-PROM-016` | Thống kê hiệu quả sử dụng Coupon | Seller | Xem báo cáo số lượng đơn và doanh thu mang lại từ mã giảm giá. |
| `UC-PROM-017` | Hủy/Khóa mã giảm giá khẩn cấp | Admin | Tạm dừng mã giảm giá khi phát hiện lỗi cấu hình hoặc bị trục lợi. |
| `UC-PROM-018` | Áp dụng tự động ưu đãi hạng thành viên | System | Giảm giá trực tiếp % đơn hàng dựa trên hạng thành viên của khách. |

---

## 8. Phân hệ 8: Support & Trust Management (18 Use Cases)
Giải quyết khiếu nại của khách hàng, đánh giá chất lượng sản phẩm dịch vụ, kiểm duyệt bình luận và xử lý tranh chấp.

| Mã UC | Tên Use Case | Tác nhân chính (Actor) | Mô tả ngắn gọn |
| :--- | :--- | :--- | :--- |
| `UC-SUP-001` | Đánh giá & bình luận món ăn/nhà hàng | Customer | Gửi điểm sao rating (1-5) và viết bình luận kèm ảnh sau khi mua. |
| `UC-SUP-002` | Đánh giá thái độ phục vụ của Tài xế | Customer | Chấm sao đánh giá Shipper sau khi nhận đồ ăn thành công. |
| `UC-SUP-003` | Phản hồi bình luận của khách hàng | Seller | Viết câu trả lời cảm ơn hoặc giải trình dưới đánh giá của khách. |
| `UC-SUP-004` | Báo cáo bình luận xấu/Spam/Phỉ báng | Seller, Customer | Cắm cờ báo cáo bình luận không đúng sự thật lên hệ thống. |
| `UC-SUP-005` | Kiểm duyệt & Gỡ bỏ bình luận vi phạm | Admin | Duyệt các báo cáo bình luận xấu và ẩn các nội dung thô tục. |
| `UC-SUP-006` | Gửi khiếu nại đơn hàng bị lỗi/thiếu món | Customer | Yêu cầu hỗ trợ khi nhận thiếu đồ ăn hoặc đồ ăn không đảm bảo. |
| `UC-SUP-007` | Khiếu nại tài xế không giao hàng | Customer | Khiếu nại khi app báo đơn hoàn thành nhưng thực tế chưa nhận được. |
| `UC-SUP-008` | Tiếp nhận và mở Ticket hỗ trợ | Admin | Nhân viên CSKH tiếp nhận yêu cầu khiếu nại và chuyển tới bộ phận xử lý. |
| `UC-SUP-009` | Chat trực tuyến với hỗ trợ viên (Livechat) | User | Nhắn tin trực tiếp với nhân viên hỗ trợ để được giải đáp khẩn cấp. |
| `UC-SUP-010` | Cập nhật bộ câu hỏi FAQ thường gặp | Admin | Cung cấp tài liệu hướng dẫn giải quyết các thắc mắc phổ biến. |
| `UC-SUP-011` | Quyết định đền bù và hoàn tiền đơn lỗi | Admin | Duyệt hoàn lại tiền cho khách và trừ tiền tương ứng của quán/tài xế. |
| `UC-SUP-012` | Gắn nhãn tín nhiệm Quán Ăn Chuẩn | Admin | Trao huy hiệu xác minh độ uy tín cho nhà hàng có chất lượng tốt. |
| `UC-SUP-013` | Ghi nhận điểm uy tín của Tài xế | System | Cộng/Trừ điểm uy tín Shipper dựa trên tỷ lệ hoàn thành, hủy đơn. |
| `UC-SUP-014` | Tự động phạt tài xế tự ý hủy đơn | System | Trừ tiền phạt tài khoản tài xế tự ý hủy đơn sau khi đã nhận đồ ăn. |
| `UC-SUP-015` | Tạm khóa tài xế do điểm uy tín quá thấp | Admin | Khóa tài khoản tài xế tạm thời để đào tạo lại nghiệp vụ. |
| `UC-SUP-016` | Báo cáo khách hàng có hành vi quấy rối | Shipper | Tài xế báo cáo người mua có thái độ đe dọa hoặc không thanh toán. |
| `UC-SUP-017` | Báo cáo nhà hàng chuẩn bị món quá lâu | Shipper | Tài xế báo cáo cửa hàng om đơn, chuẩn bị lâu gây trễ giờ giao. |
| `UC-SUP-018` | Xem lịch sử khiếu nại của tài khoản | Admin | Tra cứu số lần gửi khiếu nại của khách để phát hiện hành vi trục lợi. |

---

## 9. Phân hệ 9: Admin, Analytics & System Configuration (16 Use Cases)
Báo cáo doanh thu, phân tích dữ liệu kinh doanh, cấu hình hệ thống toàn cục và quản lý hạ tầng.

| Mã UC | Tên Use Case | Tác nhân chính (Actor) | Mô tả ngắn gọn |
| :--- | :--- | :--- | :--- |
| `UC-SYS-001` | Xem Dashboard doanh thu thời gian thực | Admin | Theo dõi biểu đồ doanh thu, số đơn, số người online trực quan. |
| `UC-SYS-002` | Thống kê số lượng người dùng mới | Admin | Xem báo cáo tốc độ tăng trưởng khách hàng, tài xế và nhà hàng. |
| `UC-SYS-003` | Biểu diễn bản đồ nhiệt mật độ đơn hàng | Admin | Phân tích khu vực có nhu cầu đặt đồ ăn cao để điều phối tài xế. |
| `UC-SYS-004` | Xuất báo cáo tài chính định dạng PDF/Excel | Admin | Tải xuống dữ liệu doanh thu, thuế phục vụ báo cáo kế toán. |
| `UC-SYS-005` | Xem báo cáo hiệu quả kinh doanh của quán | Seller | Thống kê doanh số, món bán chạy nhất và tỷ lệ hủy đơn của quán. |
| `UC-SYS-006` | Cấu hình tỷ lệ chiết khấu sàn mặc định | Admin | Thiết lập tỷ lệ phần trăm hoa hồng thu từ mỗi đơn hàng thành công. |
| `UC-SYS-007` | Cấu hình công thức tính phí giao hàng | Admin | Cài đặt đơn giá cước vận chuyển theo km và giá giờ cao điểm. |
| `UC-SYS-008` | Cấu hình tích hợp Cổng thanh toán | Admin | Cài đặt thông số API kết nối các đối tác ví điện tử và ngân hàng. |
| `UC-SYS-009` | Cấu hình dịch vụ gửi OTP (SMS/Email Gateway) | Admin | Quản lý nhà cung cấp dịch vụ viễn thông gửi tin nhắn xác thực OTP. |
| `UC-SYS-010` | Quản lý và phân quyền nhân viên nội bộ | Admin | Tạo tài khoản và phân quyền cho nhân viên duyệt đơn, nhân viên CSKH. |
| `UC-SYS-011` | Tra cứu nhật ký hệ thống nâng cao (Audit Logs) | Admin | Giám sát các thao tác chỉnh sửa dữ liệu nhạy cảm của nhân viên. |
| `UC-SYS-012` | Kích hoạt chế độ bảo trì hệ thống | Admin | Tạm đóng ứng dụng và thông báo bảo trì nâng cấp máy chủ. |
| `UC-SYS-013` | Cấu hình danh sách từ khóa cấm (Blacklist) | Admin | Thiết lập các từ ngữ thô tục, nhạy cảm cần tự động lọc bỏ. |
| `UC-SYS-014` | Cập nhật điều khoản chính sách bảo mật | Admin | Thay đổi nội dung pháp lý hiển thị khi đăng ký tài khoản mới. |
| `UC-SYS-015` | Gửi thông báo khẩn cấp toàn hệ thống | Admin | Phát thông báo đẩy đến tất cả app người dùng về thiên tai, sự cố. |
| `UC-SYS-016` | Giám sát hiệu suất hạ tầng (Server Monitoring) | Admin | Theo dõi dung lượng CPU, RAM, băng thông để kịp thời nâng cấp. |
