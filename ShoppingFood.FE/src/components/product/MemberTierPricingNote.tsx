import { Link } from 'react-router-dom';
import { Crown, Info } from 'lucide-react';
import { MemberTierBadge, getMemberTierLabel } from '../common';
import { formatCurrency } from '../../utils/formatters';
import {
  MEMBER_TIER_DISCOUNT_RULES,
  calcMemberTierDiscount,
  formatTierPercent,
} from '../../utils/memberTierDiscount';
import { ROUTES } from '../../routes/routeConfig';

type Props = {
  displayPrice: number;
  isFlashSale?: boolean;
  isAuthenticated?: boolean;
  userTier?: string | null;
};

/**
 * Khung Ghi Chú Ưu Đãi Hạng Thành Viên (MemberTierPricingNote).
 * Hiển thị ước tính mức giảm giá được hưởng theo hạng thành viên (Bạc, Vàng, Kim Cương) khi mua sản phẩm:
 * - Nếu sản phẩm đang Flash Sale: Thông báo giá đã tối ưu và không cộng dồn giảm hạng
 * - Nếu chưa đăng nhập: Gợi ý đăng nhập để nhận ưu đãi
 * - Nếu đã đăng nhập: Hiển thị tỷ lệ giảm %, số tiền giảm ước tính và điều kiện giá trị đơn tối thiểu.
 */
export function MemberTierPricingNote({
  displayPrice,
  isFlashSale,
  isAuthenticated,
  userTier,
}: Props) {
  if (isFlashSale) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-900">
        <div className="flex gap-2">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
          <div>
            <p className="font-semibold">Giá Flash Sale — không giảm thêm theo hạng</p>
            <p className="text-xs text-amber-800/90 mt-1 leading-relaxed">
              Món đang trong chương trình Flash Sale nên <strong>không áp dụng</strong> thêm ưu đãi hạng thành viên khi thanh toán.
              Giá bạn thấy là giá cuối cho món này (chưa gồm phí ship / mã giảm giá khác).
            </p>
          </div>
        </div>
      </div>
    );
  }

  const tierLabel = getMemberTierLabel(userTier);
  const { amount, rule, eligible, shortfall } = calcMemberTierDiscount(displayPrice, userTier);
  const estimatedPay = Math.max(0, displayPrice - amount);

  return (
    <div className="rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50/90 to-fuchsia-50/50 px-4 py-3 text-sm text-gray-800">
      <div className="flex items-start gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
          <Crown className="w-4 h-4 text-violet-600" />
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-gray-900">Ưu đãi hạng thành viên khi thanh toán</p>
            {isAuthenticated && <MemberTierBadge tier={userTier} size="sm" />}
          </div>

          <p className="text-xs text-gray-600 leading-relaxed">
            Giá món ở trên <strong>chưa trừ</strong> ưu đãi hạng. Khi đặt hàng, hệ thống tính giảm trên{' '}
            <strong>tổng tiền món</strong> trong đơn (không gồm phí ship), sau mã giảm giá voucher nếu có.
          </p>

          {!isAuthenticated ? (
            <p className="text-xs text-violet-800 bg-white/70 rounded-lg px-2.5 py-2 border border-violet-100">
              <Link to={ROUTES.LOGIN} className="font-semibold text-violet-700 hover:underline">
                Đăng nhập
              </Link>{' '}
              để xem hạng của bạn và biết mức giảm áp dụng khi thanh toán.
            </p>
          ) : !rule ? (
            <p className="text-xs text-gray-600 bg-white/70 rounded-lg px-2.5 py-2 border border-gray-100">
              Hạng <strong>{tierLabel}</strong> chưa có giảm giá khi thanh toán. Tích điểm và lên hạng Bạc trở lên để được giảm thêm.
            </p>
          ) : eligible ? (
            <div className="text-xs bg-white/80 rounded-lg px-2.5 py-2 border border-violet-100 space-y-1">
              <p>
                Hạng <strong>{tierLabel}</strong>: giảm thêm{' '}
                <strong>{formatTierPercent(rule)}</strong> trên tổng tiền món (tối đa {formatCurrency(rule.maxCap)} / đơn).
              </p>
              <p className="text-violet-800 font-medium">
                Ví dụ chỉ mua món này ({formatCurrency(displayPrice)}): có thể giảm khoảng{' '}
                <strong>{formatCurrency(amount)}</strong> → còn ~{formatCurrency(estimatedPay)} tiền món
                <span className="text-gray-500 font-normal"> (chưa ship / voucher)</span>.
              </p>
            </div>
          ) : (
            <div className="text-xs bg-white/80 rounded-lg px-2.5 py-2 border border-amber-100 text-amber-900 space-y-1">
              <p>
                Hạng <strong>{tierLabel}</strong> được giảm <strong>{formatTierPercent(rule)}</strong> khi tổng tiền món từ{' '}
                {formatCurrency(rule.minOrder)}.
              </p>
              <p>
                Món này {formatCurrency(displayPrice)} — cần thêm khoảng{' '}
                <strong>{formatCurrency(shortfall)}</strong> tiền món (cùng đơn) để được giảm hạng.
              </p>
            </div>
          )}

          <details className="text-[11px] text-gray-500">
            <summary className="cursor-pointer hover:text-violet-700 font-medium">Xem bảng ưu đãi các hạng</summary>
            <ul className="mt-2 space-y-1 pl-1">
              {(['Silver', 'Gold', 'Diamond'] as const).map((key) => {
                const r = MEMBER_TIER_DISCOUNT_RULES[key]!;
                return (
                  <li key={key}>
                    {getMemberTierLabel(key)}: giảm {formatTierPercent(r)}, đơn từ {formatCurrency(r.minOrder)}, tối đa{' '}
                    {formatCurrency(r.maxCap)}
                  </li>
                );
              })}
            </ul>
          </details>

          {isAuthenticated && (
            <Link
              to={`${ROUTES.PROFILE}?tab=loyalty`}
              className="inline-block text-[11px] font-semibold text-violet-700 hover:text-violet-900 hover:underline"
            >
              Xem điểm & hạng của tôi →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
