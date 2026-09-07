/**
 * Định dạng số tiền thành chuỗi tiền tệ Việt Nam Đồng (VNĐ).
 * @param amount - Số tiền cần định dạng (có thể là số, undefined hoặc null)
 * @returns Chuỗi tiền tệ định dạng chuẩn VNĐ (ví dụ: "50.000 ₫")
 */
export function formatCurrency(amount: number | undefined | null): string {
  const validAmount = (typeof amount === 'number' && !isNaN(amount)) ? amount : 0;
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(validAmount);
}

/**
 * Định dạng chuỗi ngày tháng theo chuẩn định dạng tiếng Việt (ngày/tháng/năm giờ:phút).
 * @param dateString - Chuỗi thời gian ISO hoặc định dạng ngày hợp lệ
 * @returns Chuỗi ngày giờ hiển thị theo định dạng VN (ví dụ: "15:30 19/08/2026")
 */
export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
}

/**
 * Chuyển đổi chuỗi ngày UTC sang định dạng ngày giờ cục bộ YYYY-MM-DDTHH:mm dùng cho thẻ <input type="datetime-local">.
 * @param dateString - Chuỗi thời gian UTC
 * @returns Chuỗi ngày giờ cục bộ theo định dạng HTML5 datetime-local
 */
export function toLocalDatetimeLocal(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  const yyyy = date.getFullYear();
  const MM = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${yyyy}-${MM}-${dd}T${hh}:${mm}`;
}

/**
 * Cắt ngắn chuỗi văn bản nếu vượt quá độ dài tối đa và thêm dấu chấm lửng "..." vào cuối.
 * @param text - Chuỗi văn bản gốc
 * @param maxLength - Độ dài ký tự tối đa cho phép
 * @returns Chuỗi văn bản đã được cắt ngắn nếu vượt độ dài
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * Lấy nhãn tiếng Việt hiển thị cho trạng thái kho hàng của sản phẩm.
 * @param status - Mã trạng thái kho (InStock, OutOfStock,...)
 * @returns Nhãn tiếng Việt tương ứng ("Còn hàng", "Hết hàng")
 */
export function getStockStatusLabel(status: string): string {
  const map: Record<string, string> = {
    InStock: 'Còn hàng',
    OutOfStock: 'Hết hàng',
  };
  return map[status] || status;
}

/**
 * Lấy nhãn tiếng Việt hiển thị cho trạng thái tiến trình đơn hàng (Fulfillment status).
 * @param status - Mã trạng thái đơn hàng (Pending, Confirmed, Preparing, Shipping,...)
 * @returns Nhãn trạng thái tiếng Việt thân thiện với người dùng
 */
export function getOrderStatusLabel(status: string): string {
  const map: Record<string, string> = {
    Pending: 'Chờ xác nhận',
    Confirmed: 'Đã xác nhận',
    Preparing: 'Đang chuẩn bị',
    WaitingForShipper: 'Chờ tài xế',
    Shipping: 'Đang giao',
    Delivered: 'Đã giao',
    Cancelled: 'Đã hủy',
  };
  return map[status] || status;
}

/**
 * Lấy lớp CSS Tailwind màu sắc tương ứng với trạng thái đơn hàng (để hiển thị badge trạng thái).
 * @param status - Mã trạng thái đơn hàng
 * @returns Chuỗi class Tailwind CSS (màu nền và màu chữ)
 */
export function getOrderStatusColor(status: string): string {
  const map: Record<string, string> = {
    Pending: 'bg-yellow-100 text-yellow-800',
    Confirmed: 'bg-blue-100 text-blue-800',
    Preparing: 'bg-indigo-100 text-indigo-800',
    WaitingForShipper: 'bg-purple-100 text-purple-800',
    Shipping: 'bg-orange-100 text-orange-800',
    Delivered: 'bg-green-100 text-green-800',
    Cancelled: 'bg-red-100 text-red-800',
  };
  return map[status] || 'bg-gray-100 text-gray-800';
}

/**
 * Lấy nhãn tiếng Việt cho trạng thái thanh toán của đơn hàng (Backend Enum Order.PaymentStatus).
 * @param status - Mã trạng thái thanh toán
 * @returns Nhãn tiếng Việt ("Chưa thanh toán", "Đã thanh toán",...)
 */
export function getPaymentStatusLabel(status: string): string {
  const map: Record<string, string> = {
    Pending: 'Chưa thanh toán',
    Paid: 'Đã thanh toán',
    Failed: 'Thanh toán thất bại',
    Refunded: 'Đã hoàn tiền',
    Settled: 'Đã quyết toán',
  };
  return map[status] || status;
}

/**
 * Lấy lớp CSS Tailwind màu sắc badge tương ứng với trạng thái thanh toán đơn hàng.
 * @param status - Mã trạng thái thanh toán
 * @returns Chuỗi class Tailwind CSS
 */
export function getPaymentStatusColor(status: string): string {
  const map: Record<string, string> = {
    Pending: 'bg-amber-100 text-amber-800',
    Paid: 'bg-green-100 text-green-800',
    Failed: 'bg-red-100 text-red-800',
    Refunded: 'bg-gray-100 text-gray-700',
    Settled: 'bg-blue-100 text-blue-800',
  };
  return map[status] || 'bg-gray-100 text-gray-800';
}

/**
 * Lấy nhãn tiếng Việt cho phiên thanh toán chuẩn từ API hoặc SePay.
 * @param status - Trạng thái phiên thanh toán (paid, awaiting_payment, expired,...)
 * @param statusLabel - Nhãn tùy chọn ghi đè từ API
 * @returns Nhãn hiển thị tiếng Việt
 */
export function getPaymentDisplayStatusLabel(status: string, statusLabel?: string): string {
  if (statusLabel) return statusLabel;
  const map: Record<string, string> = {
    paid: 'Đã thanh toán',
    awaiting_payment: 'Chờ chuyển khoản',
    processing: 'Đang xác nhận thanh toán',
    expired: 'Hết hạn thanh toán',
    failed: 'Thanh toán thất bại',
    pending: 'Chờ thanh toán',
    // legacy session enum values
    Completed: 'Đã thanh toán',
    Pending: 'Chờ thanh toán',
    Expired: 'Hết hạn thanh toán',
    Failed: 'Thanh toán thất bại',
  };
  return map[status] || status;
}

/**
 * Lấy lớp CSS Tailwind màu sắc badge tương ứng với trạng thái phiên thanh toán SePay.
 * @param status - Trạng thái phiên thanh toán
 * @returns Chuỗi class Tailwind CSS
 */
export function getPaymentDisplayStatusColor(status: string): string {
  const map: Record<string, string> = {
    paid: 'bg-green-100 text-green-800',
    awaiting_payment: 'bg-amber-100 text-amber-800',
    processing: 'bg-blue-100 text-blue-800',
    expired: 'bg-gray-100 text-gray-600',
    failed: 'bg-red-100 text-red-800',
    pending: 'bg-amber-100 text-amber-800',
    Completed: 'bg-green-100 text-green-800',
    Pending: 'bg-amber-100 text-amber-800',
    Expired: 'bg-gray-100 text-gray-600',
    Failed: 'bg-red-100 text-red-800',
  };
  return map[status] || 'bg-gray-100 text-gray-800';
}

/**
 * Lấy nhãn tiếng Việt hiển thị cho phương thức thanh toán.
 * @param method - Mã phương thức (COD, CreditCard, EWallet, Sepay,...)
 * @returns Tên phương thức thanh toán bằng tiếng Việt
 */
export function getPaymentMethodLabel(method: string): string {
  const map: Record<string, string> = {
    COD: 'Tiền mặt khi nhận hàng',
    CreditCard: 'Thẻ tín dụng',
    EWallet: 'Ví điện tử',
    SystemWallet: 'Ví hệ thống',
    Sepay: 'Chuyển khoản (SePay)',
  };
  return map[method] || method;
}

/**
 * Lấy nhãn hiển thị tiếng Việt tương ứng cho vai trò người dùng trong hệ thống.
 * @param role - Tên vai trò (Customer, Shipper, Seller, Admin, Coordinator)
 * @returns Tên vai trò bằng tiếng Việt
 */
export function getRoleLabel(role: string): string {
  const map: Record<string, string> = {
    'Customer': 'Khách hàng',
    'Shipper': 'Tài xế',
    'Seller': 'Người bán hàng',
    'Admin': 'Quản trị viên',
    'Coordinator': 'Điều phối viên',
  };
  return map[role] || role;
}

/**
 * Rút gọn các mã UUID dài trong chuỗi mô tả giao dịch để giao diện gọn gàng hơn (ví dụ: chỉ giữ 8 ký tự đầu).
 * @param desc - Chuỗi mô tả giao dịch ban đầu
 * @returns Chuỗi mô tả sau khi đã rút gọn mã UUID
 */
export function formatTransactionDescription(desc: string): string {
  if (!desc) return desc;
  const uuidRegex = /#?([a-fA-F0-9]{8})-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}/g;
  return desc.replace(uuidRegex, (_match, p1) => `#${p1.toUpperCase()}`);
}

/**
 * Tính toán khoảng cách địa lý theo đường chim bay giữa hai tọa độ (vĩ độ, kinh độ) theo công thức Haversine.
 * @param lat1 - Vĩ độ điểm thứ nhất
 * @param lon1 - Kinh độ điểm thứ nhất
 * @param lat2 - Vĩ độ điểm thứ hai
 * @param lon2 - Kinh độ điểm thứ hai
 * @returns Khoảng cách tính bằng kilomet (km)
 */
export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const p = 0.017453292519943295;
  const c = Math.cos;
  const a =
    0.5 -
    c((lat2 - lat1) * p) / 2 +
    (c(lat1 * p) * c(lat2 * p) * (1 - c((lon2 - lon1) * p))) / 2;
  return 12742 * Math.asin(Math.sqrt(a));
}

/**
 * Định dạng khoảng cách hiển thị: dưới 1000m hiển thị đơn vị mét (m), từ 1000m trở lên hiển thị kilomet (km).
 * @param distanceKm - Khoảng cách tính theo kilomet
 * @returns Chuỗi khoảng cách định dạng (ví dụ: "450 m" hoặc "3.2 km")
 */
export function formatDistanceKm(distanceKm: number): string {
  if (!Number.isFinite(distanceKm) || distanceKm < 0) return '';
  const meters = Math.round(distanceKm * 1000);
  if (meters < 1000) {
    return `${meters.toLocaleString('vi-VN')} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Ẩn bớt ký tự email bảo mật cho giao diện quản trị (ví dụ: j***@gmail.com).
 * @param email - Địa chỉ email cần ẩn
 * @returns Email đã được che bớt ký tự
 */
export function maskEmail(email?: string | null): string {
  if (!email || !email.includes('@')) return email ? '***' : '—';
  const [local, domain] = email.split('@');
  if (!local) return `***@${domain}`;
  const keep = Math.min(2, local.length);
  return `${local.slice(0, keep)}${'*'.repeat(Math.max(3, local.length - keep))}@${domain}`;
}

/**
 * Ẩn bớt số điện thoại bảo mật thông tin (ví dụ: 090***4567, giữ 3 số đầu và 4 số cuối).
 * @param phone - Số điện thoại cần ẩn
 * @returns Số điện thoại đã được che ký tự
 */
export function maskPhone(phone?: string | null): string {
  if (!phone) return '—';
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 7) return '*'.repeat(Math.max(3, phone.length));
  const start = digits.slice(0, 3);
  const end = digits.slice(-4);
  return `${start}${'*'.repeat(Math.max(3, digits.length - 7))}${end}`;
}

