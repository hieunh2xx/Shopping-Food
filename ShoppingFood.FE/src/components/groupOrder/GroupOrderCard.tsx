import { Link } from 'react-router-dom';
import { Clock, MapPin, Store, Users } from 'lucide-react';
import type { IGroupOrderSummaryDto } from '../../interfaces';
import { formatCurrency, getOrderStatusLabel } from '../../utils/formatters';
import { DELIVERY_MODE_SHORT, GROUP_STATUS_COLORS, GROUP_STATUS_LABELS, groupOrderPath, minutesLeft } from './groupOrderLabels';

export function GroupOrderCard({ group, compact = false }: { group: IGroupOrderSummaryDto; compact?: boolean }) {
  const left = minutesLeft(group.expiresAt);
  const enough = group.memberCount >= group.minMembers;

  return (
    <Link
      to={groupOrderPath(group.id)}
      className="block p-3.5 rounded-xl border border-gray-100 bg-white hover:border-orange-300 hover:shadow-md transition-all"
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-orange-50 text-orange-600">#{group.code}</span>
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${GROUP_STATUS_COLORS[group.status]}`}>
          {group.status === 'Submitted' && group.orderStatus ? getOrderStatusLabel(group.orderStatus) : GROUP_STATUS_LABELS[group.status]}
        </span>
      </div>
      <p className="font-bold text-sm text-gray-900 line-clamp-1">{group.title}</p>
      <div className="mt-1.5 space-y-1 text-xs text-gray-500">
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1 min-w-0"><Store className="w-3.5 h-3.5 shrink-0" /><span className="truncate">{group.restaurantName}</span></span>
          <span className={`flex items-center gap-1 shrink-0 font-semibold ${enough ? 'text-emerald-600' : 'text-gray-600'}`}>
            <Users className="w-3.5 h-3.5" /> {group.memberCount}/{group.minMembers}+ bạn
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1 min-w-0 text-rose-500"><MapPin className="w-3.5 h-3.5 shrink-0" /><span className="truncate">{group.buildingName} · {DELIVERY_MODE_SHORT[group.deliveryMode]}</span></span>
          {!compact && group.status === 'Open' && (
            <span className="flex items-center gap-1 shrink-0"><Clock className="w-3.5 h-3.5" /> {left}p</span>
          )}
        </div>
      </div>
      {group.status === 'Open' && (
        <p className="mt-2 text-[11px] text-emerald-700 bg-emerald-50 rounded-lg px-2 py-1">
          Ship chỉ ~{formatCurrency(group.shippingSharePerMember)}/người · chủ phòng: {group.hostName}
        </p>
      )}
    </Link>
  );
}
