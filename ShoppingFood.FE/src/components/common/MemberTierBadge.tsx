import { Medal, Gem, Crown, Award, type LucideIcon } from 'lucide-react';

export const MEMBER_TIERS = ['Bronze', 'Silver', 'Gold', 'Diamond'] as const;
export type MemberTierKey = (typeof MEMBER_TIERS)[number];

export type MemberTierMeta = {
  key: MemberTierKey;
  label: string;
  shortLabel: string;
  Icon: LucideIcon;
  emoji: string;
  /** Chip / badge surface */
  chipClass: string;
  /** Soft card / filter tile */
  tileClass: string;
  /** Gradient for hero surfaces */
  gradientClass: string;
  /** Extra animation class */
  animClass: string;
  ringClass: string;
};

const TIER_META: Record<MemberTierKey, MemberTierMeta> = {
  Bronze: {
    key: 'Bronze',
    label: 'Đồng',
    shortLabel: 'Đồng',
    Icon: Medal,
    emoji: '🥉',
    chipClass: 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-900 border-amber-300/80',
    tileClass: 'from-amber-50 to-orange-50 border-amber-200',
    gradientClass: 'from-amber-600 via-orange-500 to-amber-700',
    animClass: 'tier-pulse-bronze',
    ringClass: 'ring-amber-300/60',
  },
  Silver: {
    key: 'Silver',
    label: 'Bạc',
    shortLabel: 'Bạc',
    Icon: Award,
    emoji: '🥈',
    chipClass: 'bg-gradient-to-r from-slate-100 to-zinc-200 text-slate-800 border-slate-300',
    tileClass: 'from-slate-50 to-zinc-100 border-slate-200',
    gradientClass: 'from-slate-400 via-zinc-300 to-slate-500',
    animClass: 'tier-shimmer-silver',
    ringClass: 'ring-slate-300/70',
  },
  Gold: {
    key: 'Gold',
    label: 'Vàng',
    shortLabel: 'Vàng',
    Icon: Crown,
    emoji: '🥇',
    chipClass: 'bg-gradient-to-r from-yellow-100 to-amber-200 text-yellow-900 border-yellow-400/70',
    tileClass: 'from-yellow-50 to-amber-100 border-yellow-300',
    gradientClass: 'from-yellow-400 via-amber-400 to-yellow-600',
    animClass: 'tier-glow-gold',
    ringClass: 'ring-yellow-400/50',
  },
  Diamond: {
    key: 'Diamond',
    label: 'Kim cương',
    shortLabel: 'KC',
    Icon: Gem,
    emoji: '💎',
    chipClass: 'bg-gradient-to-r from-cyan-100 via-violet-100 to-fuchsia-100 text-violet-900 border-violet-300',
    tileClass: 'from-cyan-50 via-violet-50 to-fuchsia-50 border-violet-200',
    gradientClass: 'from-cyan-400 via-violet-500 to-fuchsia-500',
    animClass: 'tier-sparkle-diamond',
    ringClass: 'ring-violet-400/50',
  },
};

export function normalizeMemberTier(tier?: string | null): MemberTierKey {
  const raw = (tier || 'Bronze').trim();
  if (raw.toLowerCase() === 'platinum') return 'Diamond';
  const match = MEMBER_TIERS.find((t) => t.toLowerCase() === raw.toLowerCase());
  return match || 'Bronze';
}

export function getMemberTierMeta(tier?: string | null): MemberTierMeta {
  return TIER_META[normalizeMemberTier(tier)];
}

export function getMemberTierLabel(tier?: string | null): string {
  return getMemberTierMeta(tier).label;
}

type Size = 'sm' | 'md' | 'lg';

interface MemberTierBadgeProps {
  tier?: string | null;
  size?: Size;
  showIcon?: boolean;
  animated?: boolean;
  className?: string;
}

const sizeClass: Record<Size, string> = {
  sm: 'text-[10px] px-2 py-0.5 gap-1',
  md: 'text-xs px-2.5 py-1 gap-1.5',
  lg: 'text-sm px-3.5 py-1.5 gap-2',
};

const iconSize: Record<Size, string> = {
  sm: 'w-3 h-3',
  md: 'w-3.5 h-3.5',
  lg: 'w-4 h-4',
};

export function MemberTierBadge({
  tier,
  size = 'md',
  showIcon = true,
  animated = true,
  className = '',
}: MemberTierBadgeProps) {
  const meta = getMemberTierMeta(tier);
  const Icon = meta.Icon;

  return (
    <span
      className={`inline-flex items-center font-bold rounded-full border shadow-sm ${meta.chipClass} ${sizeClass[size]} ${
        animated ? meta.animClass : ''
      } ${className}`}
      title={`Hạng ${meta.label}`}
    >
      {showIcon && <Icon className={`${iconSize[size]} shrink-0`} />}
      <span>{meta.label}</span>
    </span>
  );
}

interface MemberTierCardProps {
  tier?: string | null;
  selected?: boolean;
  onClick?: () => void;
  subtitle?: string;
}

export function MemberTierSelectCard({ tier, selected, onClick, subtitle }: MemberTierCardProps) {
  const meta = getMemberTierMeta(tier);
  const Icon = meta.Icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl border-2 p-3 text-left transition-all ${
        selected
          ? `border-orange-400 bg-gradient-to-br ${meta.tileClass} ring-2 ${meta.ringClass}`
          : `border-gray-200 bg-white hover:border-orange-200`
      }`}
    >
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${meta.gradientClass}`} />
      <div className="flex items-center gap-2 mb-1">
        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br ${meta.gradientClass} text-white shadow ${meta.animClass}`}>
          <Icon className="w-4 h-4" />
        </span>
        <span className="font-bold text-gray-900 text-sm">{meta.label}</span>
      </div>
      {subtitle && <p className="text-[11px] text-gray-400">{subtitle}</p>}
    </button>
  );
}
