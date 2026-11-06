import type {
  CampusBuildingType, GroupDeliveryMode, GroupMemberPaymentStatus, GroupOrderStatus, GroupPaymentMode, ICartItem, IGroupOrderDraftItem,
  IGroupOrderMenuItemDto,
} from '../../interfaces';

/** Món của quán trong giỏ, tách phần còn bán (có trên thực đơn gom đơn) và phần đã dừng bán. */
export function splitRestaurantCart(cartItems: ICartItem[], restaurantId: string, menu: IGroupOrderMenuItemDto[]) {
  const sellable = new Set(menu.map((m) => m.id));
  const mine = restaurantId ? cartItems.filter((i) => i.product.restaurantId === restaurantId && !i.isGift) : [];
  return {
    available: mine.filter((i) => !i.isProductDeleted && sellable.has(i.product.id)),
    stopped: menu.length > 0 ? mine.filter((i) => i.isProductDeleted || !sellable.has(i.product.id)) : [],
  };
}

export function cartItemsTotal(items: ICartItem[]): number {
  return items.filter((i) => !i.isGift).reduce((s, i) => s + (i.priceAtAdded ?? i.product.price) * i.quantity, 0);
}

export function draftTotal(draft: IGroupOrderDraftItem[]): number {
  return draft.reduce((s, d) => s + d.unitPrice * d.quantity, 0);
}

export function draftToRequest(draft: IGroupOrderDraftItem[]) {
  return draft.map(({ productId, quantity, selectedSize, selectedToppings, note }) => ({ productId, quantity, selectedSize, selectedToppings, note }));
}

export const BUILDING_TYPE_LABELS: Record<CampusBuildingType, string> = {
  Dormitory: 'Ký túc xá',
  Lecture: 'Tòa học / Giảng đường',
  Gate: 'Cổng trường',
  Landmark: 'Cảnh quan / Đường',
};

export const DELIVERY_MODE_LABELS: Record<GroupDeliveryMode, string> = {
  Gate: 'Ship cổng trường',
  Lobby: 'Ship tới sảnh Dom / Tòa',
  Room: 'Ship tận phòng',
};

export const DELIVERY_MODE_SHORT: Record<GroupDeliveryMode, string> = {
  Gate: 'Cổng',
  Lobby: 'Sảnh',
  Room: 'Tận phòng',
};

export const PAYMENT_MODE_LABELS: Record<GroupPaymentMode, string> = {
  Individual: 'Mỗi người tự trả phần mình',
  HostPaysAll: 'Trưởng nhóm trả hộ cả nhóm',
};

export const GROUP_STATUS_LABELS: Record<GroupOrderStatus, string> = {
  Open: 'Đang mở chọn món',
  Submitted: 'Đã chốt đơn',
  Cancelled: 'Đã hủy',
};

export const GROUP_STATUS_COLORS: Record<GroupOrderStatus, string> = {
  Open: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Submitted: 'bg-blue-50 text-blue-700 border-blue-200',
  Cancelled: 'bg-gray-100 text-gray-500 border-gray-200',
};

export const MEMBER_PAYMENT_LABELS: Record<GroupMemberPaymentStatus, string> = {
  Unpaid: 'Chưa thanh toán',
  Paid: 'Đã thanh toán',
  Refunded: 'Đã hoàn tiền',
};

/** Mirrors backend GroupOrderPricing.ShareFor (làm tròn lên 500đ). */
export function estimateShippingShare(baseFee: number, surcharge: number, memberCount: number): number {
  const n = Math.max(1, memberCount);
  return Math.ceil(baseFee / n / 500) * 500 + surcharge;
}

export function groupOrderPath(id: string) {
  return `/group-orders/${id}`;
}

export function minutesLeft(expiresAt: string): number {
  return Math.max(0, Math.round((new Date(expiresAt).getTime() - Date.now()) / 60000));
}

export function getApiErrorMessage(err: unknown, fallback = 'Có lỗi xảy ra, vui lòng thử lại.'): string {
  const anyErr = err as { response?: { data?: { message?: string } }; message?: string };
  return anyErr?.response?.data?.message || fallback;
}
