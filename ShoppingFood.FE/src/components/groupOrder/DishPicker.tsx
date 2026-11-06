import { useState } from 'react';
import { Minus, Plus, Search, ShoppingCart, Trash2 } from 'lucide-react';
import { DishImage } from './DishImage';
import type { ICartItem, IGroupOrderDraftItem, IGroupOrderMenuItemDto } from '../../interfaces';
import { formatCurrency } from '../../utils/formatters';
import { cartItemsTotal } from './groupOrderLabels';

interface DishPickerProps {
  menu: IGroupOrderMenuItemDto[];
  draft: IGroupOrderDraftItem[];
  onChange: (draft: IGroupOrderDraftItem[]) => void;
  /** Món của đúng quán này trong giỏ hàng mà vẫn đang bán. */
  cartItems: ICartItem[];
  /** Món trong giỏ đã dừng bán — chỉ để báo, không được chuyển sang phòng. */
  stoppedCartItems?: ICartItem[];
  useCart: boolean;
  onUseCartChange: (value: boolean) => void;
  disabled?: boolean;
}

/** Chọn món cho phần của mình trước khi tạo / vào phòng gom đơn (bắt buộc ít nhất 1 món). */
export function DishPicker({ menu, draft, onChange, cartItems, stoppedCartItems = [], useCart, onUseCartChange, disabled = false }: DishPickerProps) {
  const [search, setSearch] = useState('');
  const [sizes, setSizes] = useState<Record<string, string>>({});
  const paidCart = cartItems.filter((i) => !i.isGift);

  const visible = menu.filter((m) => !search.trim() || m.itemName.toLowerCase().includes(search.trim().toLowerCase()));

  const add = (item: IGroupOrderMenuItemDto) => {
    const size = sizes[item.id] ?? item.sizes.find((s) => s.isDefault)?.sizeName ?? item.sizes[0]?.sizeName;
    const key = `${item.id}|${size ?? ''}`;
    const existing = draft.find((d) => d.key === key);
    if (existing) {
      onChange(draft.map((d) => (d.key === key ? { ...d, quantity: Math.min(20, d.quantity + 1) } : d)));
      return;
    }
    const extra = item.sizes.find((s) => s.sizeName === size)?.extraPrice ?? 0;
    onChange([...draft, { key, productId: item.id, itemName: item.itemName, unitPrice: item.price + extra, quantity: 1, selectedSize: size }]);
  };

  const setQty = (key: string, qty: number) =>
    onChange(qty <= 0 ? draft.filter((d) => d.key !== key) : draft.map((d) => (d.key === key ? { ...d, quantity: Math.min(20, qty) } : d)));

  return (
    <div className="space-y-3">
      {paidCart.length > 0 && (
        <label className={`flex items-start gap-3 rounded-xl border-2 p-3 cursor-pointer ${useCart ? 'border-orange-400 bg-orange-50' : 'border-gray-200 bg-white'}`}>
          <input type="checkbox" className="mt-1" checked={useCart} disabled={disabled} onChange={(e) => onUseCartChange(e.target.checked)} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
              <ShoppingCart className="w-4 h-4 text-orange-500" /> Dùng {paidCart.reduce((s, i) => s + i.quantity, 0)} món trong giỏ hàng ({formatCurrency(cartItemsTotal(cartItems))})
            </p>
            <p className="text-xs text-gray-500 truncate">{paidCart.map((i) => `${i.quantity}× ${i.product.itemName}`).join(', ')}</p>
            <p className="text-[11px] text-gray-400">Các món này sẽ được chuyển từ giỏ hàng sang phòng gom đơn.</p>
          </div>
        </label>
      )}
      {stoppedCartItems.length > 0 && (
        <p className="text-[11px] text-gray-500 bg-gray-100 rounded-lg px-3 py-2">
          {stoppedCartItems.map((i) => i.product.itemName).join(', ')} trong giỏ hàng đã dừng bán nên không được thêm vào đơn nhóm.
        </p>
      )}

      {draft.length > 0 && (
        <ul className="rounded-xl border border-gray-100 divide-y divide-gray-100 bg-white">
          {draft.map((d) => (
            <li key={d.key} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
              <span className="min-w-0">
                <span className="font-semibold text-gray-900">{d.itemName}</span>
                {d.selectedSize && <span className="text-xs text-gray-400"> · {d.selectedSize}</span>}
                <span className="block text-xs text-orange-600">{formatCurrency(d.unitPrice * d.quantity)}</span>
              </span>
              <span className="flex items-center gap-1 shrink-0">
                <button type="button" disabled={disabled} onClick={() => setQty(d.key, d.quantity - 1)} className="p-1 rounded border border-gray-200"><Minus className="w-3 h-3" /></button>
                <span className="w-6 text-center font-semibold">{d.quantity}</span>
                <button type="button" disabled={disabled} onClick={() => setQty(d.key, d.quantity + 1)} className="p-1 rounded border border-gray-200"><Plus className="w-3 h-3" /></button>
                <button type="button" disabled={disabled} onClick={() => setQty(d.key, 0)} className="p-1 text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm món của quán..."
          className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-orange-500" />
      </div>
      <div className="grid sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
        {visible.map((item) => (
          <div key={item.id} className="flex items-center gap-2 rounded-xl border border-gray-100 bg-white p-2">
            <DishImage src={item.imageUrl} alt={item.itemName} className="w-11 h-11 rounded-lg shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-gray-900 line-clamp-1">{item.itemName}</p>
              <p className="text-xs text-orange-600 font-semibold">{formatCurrency(item.price)}</p>
              {item.sizes.length > 0 && (
                <select
                  value={sizes[item.id] ?? item.sizes.find((s) => s.isDefault)?.sizeName ?? item.sizes[0]?.sizeName}
                  onChange={(e) => setSizes({ ...sizes, [item.id]: e.target.value })}
                  className="mt-0.5 w-full text-[11px] border border-gray-200 rounded px-1 py-0.5 bg-white"
                >
                  {item.sizes.map((s) => <option key={s.sizeName} value={s.sizeName}>{s.sizeName}{s.extraPrice > 0 ? ` +${formatCurrency(s.extraPrice)}` : ''}</option>)}
                </select>
              )}
            </div>
            <button
              type="button"
              disabled={disabled}
              onClick={() => add(item)}
              className="shrink-0 p-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-40"
              title="Thêm vào phần của bạn"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        ))}
        {visible.length === 0 && (
          <p className="col-span-full text-center text-xs text-gray-400 py-4">
            {menu.length === 0 ? 'Quán hiện chưa có món nào đang bán.' : 'Không có món phù hợp.'}
          </p>
        )}
      </div>
    </div>
  );
}
