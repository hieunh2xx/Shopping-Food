import { normalizeMemberTier, type MemberTierKey } from '../components/common/MemberTierBadge';

/**
 * Định nghĩa quy tắc giảm giá theo hạng thành viên
 * - percent: Tỷ lệ giảm giá (ví dụ: 0.05 = 5%)
 * - minOrder: Giá trị đơn hàng tối thiểu để áp dụng chiết khấu (VNĐ)
 * - maxCap: Mức giảm giá tối đa cho phép (VNĐ)
 */
export type MemberTierDiscountRule = {
  percent: number;
  minOrder: number;
  maxCap: number;
};

/**
 * Danh mục cấu hình chiết khấu theo từng hạng thành viên (Đồng, Bạc, Vàng, Kim Cương).
 * Khớp hoàn toàn với logic `GetMemberTierDiscountAsync` trên backend.
 */
export const MEMBER_TIER_DISCOUNT_RULES: Record<MemberTierKey, MemberTierDiscountRule | null> = {
  Bronze: null,
  Silver: { percent: 0.03, minOrder: 100_000, maxCap: 20_000 },
  Gold: { percent: 0.05, minOrder: 150_000, maxCap: 35_000 },
  Diamond: { percent: 0.08, minOrder: 200_000, maxCap: 50_000 },
};

/**
 * Tính toán mức tiền được giảm giá theo hạng thành viên của người dùng.
 * @param itemsTotal - Tổng tiền hàng trước giảm giá
 * @param tier - Tên hoặc mã hạng thành viên hiện tại của người dùng
 * @returns Đối tượng gồm:
 *  - amount: Số tiền giảm thực tế (đã áp dụng giới hạn maxCap)
 *  - rule: Quy tắc giảm giá đang áp dụng
 *  - eligible: true nếu đơn hàng đủ điều kiện giảm giá, ngược lại false
 *  - shortfall: Số tiền cần mua thêm để đạt ngưỡng tối thiểu được giảm giá
 */
export function calcMemberTierDiscount(
  itemsTotal: number,
  tier?: string | null,
): { amount: number; rule: MemberTierDiscountRule | null; eligible: boolean; shortfall: number } {
  const tierKey = normalizeMemberTier(tier);
  const rule = MEMBER_TIER_DISCOUNT_RULES[tierKey];
  if (!rule || itemsTotal <= 0) {
    return { amount: 0, rule, eligible: false, shortfall: rule?.minOrder ?? 0 };
  }
  if (itemsTotal < rule.minOrder) {
    return { amount: 0, rule, eligible: false, shortfall: rule.minOrder - itemsTotal };
  }
  const raw = itemsTotal * rule.percent;
  return { amount: Math.min(raw, rule.maxCap), rule, eligible: true, shortfall: 0 };
}

/**
 * Định dạng tỷ lệ phần trăm chiết khấu của hạng thành viên sang chuỗi hiển thị (ví dụ: "5%").
 * @param rule - Quy tắc giảm giá của hạng thành viên
 * @returns Chuỗi phần trăm (ví dụ "5%", "8%")
 */
export function formatTierPercent(rule: MemberTierDiscountRule): string {
  return `${Math.round(rule.percent * 100)}%`;
}
