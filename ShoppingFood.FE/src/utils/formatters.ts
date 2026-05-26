/**
 * Format currency to Vietnamese Dong
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
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
 * Get order status label
 */
export function getOrderStatusLabel(status: string): string {
  const map: Record<string, string> = {
    Pending: 'Chờ xác nhận',
    Confirmed: 'Đã xác nhận',
    Preparing: 'Đang chuẩn bị',
    Shipping: 'Đang giao',
    Delivered: 'Đã giao',
    Cancelled: 'Đã hủy',
  };
  return map[status] || status;
}

/**
 * Get role label
 */
export function getRoleLabel(role: string): string {
  const map: Record<string, string> = {
    Admin: 'Quản trị viên',
    Seller: 'Người bán',
    Customer: 'Khách hàng',
  };
  return map[role] || role;
}
