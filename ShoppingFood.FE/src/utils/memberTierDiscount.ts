import { normalizeMemberTier, type MemberTierKey } from '../components/common/MemberTierBadge';

export type MemberTierDiscountRule = {
  percent: number;
  minOrder: number;
  maxCap: number;
};

/** Khớp logic `GetMemberTierDiscountAsync` trên backend. */
export const MEMBER_TIER_DISCOUNT_RULES: Record<MemberTierKey, MemberTierDiscountRule | null> = {
  Bronze: null,
  Silver: { percent: 0.03, minOrder: 100_000, maxCap: 20_000 },
  Gold: { percent: 0.05, minOrder: 150_000, maxCap: 35_000 },
  Diamond: { percent: 0.08, minOrder: 200_000, maxCap: 50_000 },
};

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

export function formatTierPercent(rule: MemberTierDiscountRule): string {
  return `${Math.round(rule.percent * 100)}%`;
}
