import { useState } from 'react';
import toast from 'react-hot-toast';
import { Building2, CheckCircle2, Circle, DoorOpen, Home, Loader2, Phone, Printer, Users } from 'lucide-react';
import type { IGroupOrderForOrderDto } from '../../interfaces';
import { groupOrderService } from '../../services/GroupOrderService';
import { formatCurrency } from '../../utils/formatters';
import { printGroupPortionLabels } from '../../utils/printGroupPortionLabels';
import { DELIVERY_MODE_LABELS, getApiErrorMessage } from './groupOrderLabels';

interface GroupOrderPortionsPanelProps {
  info: IGroupOrderForOrderDto;
  /** restaurant: đóng gói & in tem từng phần. shipper: gọi khách & đánh dấu giao từng phòng. */
  mode: 'restaurant' | 'shipper';
  restaurantName?: string;
  onUpdated?: (info: IGroupOrderForOrderDto) => void;
}

const MODE_ICON = { Gate: DoorOpen, Lobby: Building2, Room: Home } as const;

export function GroupOrderPortionsPanel({ info, mode, restaurantName, onUpdated }: GroupOrderPortionsPanelProps) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const ModeIcon = MODE_ICON[info.deliveryMode];
  const allDelivered = info.portionCount > 0 && info.deliveredCount === info.portionCount;

  const toggleDelivered = async (memberId: string, delivered: boolean) => {
    setBusyId(memberId);
    try {
      const res = await groupOrderService.markPortionDelivered(info.groupOrderId, memberId, delivered);
      onUpdated?.(res.data);
      toast.success(res.message || 'Đã cập nhật');
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="rounded-2xl border-2 border-violet-200 bg-violet-50/50 p-4 space-y-3 text-gray-900">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="flex items-center gap-1.5 font-bold text-violet-800">
            <Users className="w-4 h-4" /> Đơn gom #{info.code} · {info.portionCount} phần
          </p>
          <p className="text-xs text-gray-600 mt-0.5 flex items-center gap-1">
            <ModeIcon className="w-3.5 h-3.5 text-violet-500" />
            {DELIVERY_MODE_LABELS[info.deliveryMode]} · <b>{info.buildingName}</b>
            {info.deliveryMode !== 'Room' && info.buildingDropPoint ? ` (${info.buildingDropPoint})` : ''}
            {info.deliveryMode === 'Room' ? ` · ${info.floors} tầng` : ''}
          </p>
          <p className="text-xs text-gray-500">{info.campusName}</p>
        </div>
        {mode === 'restaurant' ? (
          <button
            type="button"
            onClick={() => printGroupPortionLabels(info, restaurantName)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-bold hover:bg-violet-700"
          >
            <Printer className="w-3.5 h-3.5" /> In tem {info.portionCount} phần
          </button>
        ) : (
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${allDelivered ? 'bg-emerald-100 text-emerald-700' : 'bg-white text-violet-700 border border-violet-200'}`}>
            Đã giao {info.deliveredCount}/{info.portionCount}
          </span>
        )}
      </div>

      {mode === 'restaurant' ? (
        <p className="text-xs text-violet-800 bg-white/70 rounded-lg px-3 py-2 border border-violet-100">
          Đóng <b>mỗi phần một túi riêng</b> và dán tem (số phòng + tên) để shipper giao đúng từng phòng. Đơn đã được thanh toán trước.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg bg-white border border-emerald-100 px-3 py-2">
            <p className="text-gray-500">Thu nhập 1 lượt giao</p>
            <p className="font-extrabold text-emerald-600 text-sm">{formatCurrency(info.shipperIncome)}</p>
          </div>
          <div className="rounded-lg bg-white border border-gray-100 px-3 py-2">
            <p className="text-gray-500">Thu tiền khách</p>
            <p className="font-extrabold text-sm">{info.isPrepaid ? 'Không — đã trả trước' : 'Thu COD'}</p>
          </div>
        </div>
      )}

      {info.note && <p className="text-xs text-orange-700">Ghi chú chung: {info.note}</p>}

      <ol className="space-y-2">
        {info.portions.map((p) => {
          const delivered = !!p.deliveredAt;
          return (
            <li key={p.memberId} className={`rounded-xl border bg-white p-3 ${delivered ? 'border-emerald-200' : 'border-gray-100'}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 min-w-0">
                  <span className="shrink-0 w-7 h-7 rounded-lg bg-violet-600 text-white text-xs font-black flex items-center justify-center">{p.index}</span>
                  <div className="min-w-0">
                    <p className="font-bold text-sm">
                      {p.roomNumber ? `Phòng ${p.roomNumber}` : info.buildingDropPoint || info.buildingName}
                      <span className="font-medium text-gray-600"> · {p.displayName}{p.isHost ? ' (người tạo)' : ''}</span>
                    </p>
                    {p.note && <p className="text-[11px] text-orange-600">{p.note}</p>}
                  </div>
                </div>
                {mode === 'shipper' && p.phone && (
                  <a href={`tel:${p.phone.replace(/[^\d+]/g, '')}`}
                    className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-green-50 text-green-700 border border-green-200 text-[11px] font-bold">
                    <Phone className="w-3 h-3" /> {p.phone}
                  </a>
                )}
              </div>
              <ul className="mt-2 pl-9 space-y-0.5 text-xs text-gray-700">
                {p.items.map((i) => (
                  <li key={i.id}>
                    <b className="text-orange-600">{i.quantity}×</b> {i.itemName}
                    {(i.selectedSize || i.selectedToppings) && <span className="text-gray-400"> · {[i.selectedSize, i.selectedToppings].filter(Boolean).join(', ')}</span>}
                    {i.note && <span className="text-orange-600 italic"> · {i.note}</span>}
                  </li>
                ))}
              </ul>
              {mode === 'shipper' && (
                <div className="mt-2 pl-9">
                  {info.canMarkDelivered ? (
                    <button
                      type="button"
                      disabled={busyId === p.memberId}
                      onClick={() => toggleDelivered(p.memberId, !delivered)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${
                        delivered ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-orange-500 text-white hover:bg-orange-600'
                      } disabled:opacity-60`}
                    >
                      {busyId === p.memberId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : delivered ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                      {delivered ? 'Đã giao phần này' : 'Xác nhận đã giao phần này'}
                    </button>
                  ) : delivered ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600"><CheckCircle2 className="w-3.5 h-3.5" /> Đã giao</span>
                  ) : (
                    <span className="text-[11px] text-gray-400">Lấy hàng xong mới đánh dấu giao được</span>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {mode === 'shipper' && allDelivered && (
        <p className="text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">
          Đã giao đủ {info.portionCount} phần — bấm hoàn thành đơn (chụp ảnh xác nhận) như đơn thường.
        </p>
      )}
    </div>
  );
}
