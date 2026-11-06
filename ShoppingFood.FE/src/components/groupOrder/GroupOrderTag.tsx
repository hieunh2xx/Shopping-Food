import { Users } from 'lucide-react';
import type { IGroupOrderForOrderDto } from '../../interfaces';
import { DELIVERY_MODE_SHORT } from './groupOrderLabels';

/** Compact pill marking an order as a gom đơn (restaurant / shipper lists). */
export function GroupOrderTag({ info, className = '' }: { info: IGroupOrderForOrderDto; className?: string }) {
  return (
    <span className={`inline-flex flex-wrap items-center gap-1.5 text-xs font-semibold bg-violet-100 text-violet-700 px-2 py-1 rounded-md ${className}`}>
      <Users className="w-3.5 h-3.5" />
      Đơn gom #{info.code} · {info.portionCount} phần · {DELIVERY_MODE_SHORT[info.deliveryMode]} {info.buildingName}
      {info.isPrepaid && <span className="px-1.5 rounded bg-emerald-100 text-emerald-700">Đã trả trước</span>}
    </span>
  );
}
