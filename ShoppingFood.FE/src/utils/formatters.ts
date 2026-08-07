/**
 * Format currency to Vietnamese Dong
 */
export function formatCurrency(amount: number | undefined | null): string {
  const validAmount = (typeof amount === 'number' && !isNaN(amount)) ? amount : 0;
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(validAmount);
}

/**
 * Format date to Vietnamese locale
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
 * Convert UTC date string to local YYYY-MM-DDTHH:mm format for datetime-local inputs
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
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * Get stock status label
 */
export function getStockStatusLabel(status: string): string {
  const map: Record<string, string> = {
    InStock: 'Còn hàng',
    OutOfStock: 'Hết hàng',
  };
  return map[status] || status;
}

/**
 * Get order status label (fulfillment)
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

/** Order.PaymentStatus from backend enum */
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

/** Canonical payment session display status from API */
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
 * Get role label
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
 * Format transaction description to truncate UUIDs
 */
export function formatTransactionDescription(desc: string): string {
  if (!desc) return desc;
  const uuidRegex = /#?([a-fA-F0-9]{8})-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}/g;
  return desc.replace(uuidRegex, (_match, p1) => `#${p1.toUpperCase()}`);
}
