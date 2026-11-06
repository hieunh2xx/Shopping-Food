import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  AlertTriangle, ArrowLeft, Ban, CheckCircle2, Clock, Copy, Crown, LogOut, Loader2, MapPin, Minus, Plus, Receipt,
  Search, Share2, ShoppingBag, Store, Trash2, Truck, Undo2, UserMinus, Users, Wallet,
} from 'lucide-react';
import { useAuth, useCart } from '../../hooks';
import { ROUTES } from '../../routes/routeConfig';
import { formatCurrency, getOrderStatusColor, getOrderStatusLabel } from '../../utils/formatters';
import { campusService, groupOrderService } from '../../services/GroupOrderService';
import { paymentService } from '../../services/PaymentService';
import type { ICampusBuildingDto, IGroupOrderDetailDto, IGroupOrderDraftItem, IGroupOrderMemberDto, IGroupOrderMenuItemDto } from '../../interfaces';
import { Modal } from '../../components/common/Modal';
import { CampusMap } from '../../components/groupOrder/CampusMap';
import { DishPicker } from '../../components/groupOrder/DishPicker';
import {
  DELIVERY_MODE_LABELS, GROUP_STATUS_COLORS, GROUP_STATUS_LABELS, MEMBER_PAYMENT_LABELS,
  draftToRequest, getApiErrorMessage, minutesLeft, splitRestaurantCart,
} from '../../components/groupOrder/groupOrderLabels';
import { DishImage } from '../../components/groupOrder/DishImage';

type MenuSelection = { size?: string; toppings: string[]; note: string; qty: number };

export function GroupOrderRoomPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [group, setGroup] = useState<IGroupOrderDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [menu, setMenu] = useState<IGroupOrderMenuItemDto[]>([]);
  const [campusBuildings, setCampusBuildings] = useState<ICampusBuildingDto[]>([]);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [selections, setSelections] = useState<Record<string, MenuSelection>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [showBill, setShowBill] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [joinForm, setJoinForm] = useState({ roomNumber: '', phone: '', note: '' });
  const [joinDraft, setJoinDraft] = useState<IGroupOrderDraftItem[]>([]);
  const [joinUseCart, setJoinUseCart] = useState<boolean | null>(null);
  const { items: cartItems, refreshCart } = useCart();
  const [editInfo, setEditInfo] = useState(false);
  const [myInfo, setMyInfo] = useState({ roomNumber: '', phone: '', note: '' });

  const load = useCallback(async (silent = false) => {
    try {
      const res = await groupOrderService.getDetail(id);
      setGroup(res.data);
    } catch (err) {
      if (!silent) toast.error(getApiErrorMessage(err, 'Không tải được phòng gom đơn.'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!group || group.status === 'Cancelled') return;
    if (group.status === 'Submitted' && group.orderStatus && ['Delivered', 'Cancelled'].includes(group.orderStatus)) return;
    const timer = window.setInterval(() => load(true), 6000);
    return () => window.clearInterval(timer);
  }, [group, load]);

  const restaurantId = group?.restaurantId;
  const campusId = group?.campusId;
  useEffect(() => {
    if (!restaurantId) return;
    groupOrderService.getMenu(restaurantId).then((res) => setMenu(res.data ?? [])).catch(() => setMenu([]));
  }, [restaurantId]);

  useEffect(() => {
    if (!campusId) return;
    campusService.getCampuses()
      .then((res) => setCampusBuildings(res.data?.find((c) => c.id === campusId)?.buildings ?? []))
      .catch(() => setCampusBuildings([]));
  }, [campusId]);

  const refreshWallet = useCallback(() => {
    if (!isAuthenticated) return;
    paymentService.getWallet().then((res) => setWalletBalance(res.data?.balance ?? 0)).catch(() => setWalletBalance(null));
  }, [isAuthenticated]);

  useEffect(() => {
    refreshWallet();
  }, [refreshWallet]);

  const me = useMemo(() => group?.members.find((m) => m.isMe) ?? null, [group]);

  const run = async (key: string, action: () => Promise<{ data: IGroupOrderDetailDto; message?: string }>, after?: () => void) => {
    setBusy(key);
    try {
      const res = await action();
      setGroup(res.data);
      if (res.message) toast.success(res.message);
      after?.();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-32"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>;
  }
  if (!group) {
    return (
      <div className="max-w-xl mx-auto py-24 text-center space-y-4">
        <p className="text-gray-500">Không tìm thấy phòng gom đơn.</p>
        <Link to="/group-orders" className="text-orange-600 font-semibold hover:underline">← Quay lại danh sách phòng gom đơn</Link>
      </div>
    );
  }

  const isOpen = group.status === 'Open' && minutesLeft(group.expiresAt) > 0;
  const isMember = !!me;
  const canEditItems = isOpen && isMember && me!.paymentStatus !== 'Paid' && group.restaurantIsOpen;
  const canDraft = !isMember && isOpen && isAuthenticated && group.restaurantIsOpen;
  const { available: restaurantCartItems, stopped: stoppedCartItems } = splitRestaurantCart(cartItems, group.restaurantId, menu);
  const joinFromCart = (joinUseCart ?? true) && restaurantCartItems.length > 0;
  const joinDishCount = joinDraft.reduce((s, d) => s + d.quantity, 0) + (joinFromCart ? restaurantCartItems.reduce((s, i) => s + i.quantity, 0) : 0);
  const activeCount = group.activeMemberCount;
  const enough = activeCount >= group.minMembers;
  const inviteLink = `${window.location.origin}/group-orders/${group.id}`;
  const singleSaving = Math.max(0, group.singleRoomDeliveryFee - group.shippingSharePerMember);

  const filteredMenu = menu.filter((m) => !search.trim() || m.itemName.toLowerCase().includes(search.trim().toLowerCase()));
  const selectionOf = (item: IGroupOrderMenuItemDto): MenuSelection =>
    selections[item.id] ?? { size: item.sizes.find((s) => s.isDefault)?.sizeName ?? item.sizes[0]?.sizeName, toppings: [], note: '', qty: 1 };
  const updateSelection = (item: IGroupOrderMenuItemDto, patch: Partial<MenuSelection>) =>
    setSelections((prev) => ({ ...prev, [item.id]: { ...selectionOf(item), ...patch } }));
  const priceOf = (item: IGroupOrderMenuItemDto, sel: MenuSelection) =>
    item.price
    + (item.sizes.find((s) => s.sizeName === sel.size)?.extraPrice ?? 0)
    + sel.toppings.reduce((s, t) => s + (item.toppings.find((x) => x.name === t)?.price ?? 0), 0);

  const copy = async (text: string, msg: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(msg);
    } catch {
      toast.error('Không sao chép được, hãy copy thủ công.');
    }
  };

  const billText = [
    `🧾 Gom đơn #${group.code} — ${group.title}`,
    `Quán: ${group.restaurantName} · Giao: ${group.buildingName} (${DELIVERY_MODE_LABELS[group.deliveryMode]})`,
    ...group.members.filter((m) => m.items.length > 0).map((m) =>
      `- ${m.displayName}${m.roomNumber ? ` (P.${m.roomNumber})` : ''}: ${formatCurrency(m.amountDue)}` +
      `${m.paymentStatus === 'Paid' ? (m.paidByUserId && m.paidByUserId !== m.userAccountId ? ` · ${m.paidByName} trả hộ` : ' · đã trả') : ' · chưa trả'}`),
    `Tổng: ${formatCurrency(group.totalAmount)} · Ship/người: ${formatCurrency(group.shippingSharePerMember)}`,
  ].join('\n');

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-5 text-gray-900">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button onClick={() => navigate('/group-orders')} className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-orange-600">
          <ArrowLeft className="w-4 h-4" /> Danh sách phòng gom đơn
        </button>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => copy(`Vào phòng gom đơn "${group.title}" (${group.restaurantName}) — mã PIN ${group.code}: ${inviteLink}`, 'Đã copy link mời bạn bè!')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-orange-200 bg-white text-sm font-semibold text-orange-600 hover:bg-orange-50"
          >
            <Share2 className="w-4 h-4" /> Mời bạn bè (Mã PIN: {group.code})
          </button>
          <button
            onClick={() => setShowBill(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600"
          >
            <Receipt className="w-4 h-4" /> Bảng chia tiền
          </button>
        </div>
      </div>

      {/* Header */}
      <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 grid md:grid-cols-[1fr_auto] gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-mono font-black px-2.5 py-1 rounded-lg bg-orange-500 text-white">#{group.code}</span>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900">{group.title}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${GROUP_STATUS_COLORS[group.status]}`}>{GROUP_STATUS_LABELS[group.status]}</span>
            {isOpen && <span className="flex items-center gap-1 text-xs text-gray-500"><Clock className="w-3.5 h-3.5" /> Còn {minutesLeft(group.expiresAt)} phút để gom</span>}
            {!group.restaurantIsOpen && group.status === 'Open' && <span className="text-xs font-semibold text-red-600">Quán đang đóng cửa</span>}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
            <Link to={`/restaurant/${group.restaurantId}`} className="flex items-center gap-1 hover:text-orange-600"><Store className="w-4 h-4" /> {group.restaurantName}</Link>
            <button onClick={() => setShowMap((v) => !v)} className="flex items-center gap-1 hover:text-orange-600">
              <MapPin className="w-4 h-4 text-rose-500" /> {group.buildingName}
            </button>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700">
              {DELIVERY_MODE_LABELS[group.deliveryMode]}{group.surchargePerMember > 0 ? ` · +${formatCurrency(group.surchargePerMember)}/người` : ''}
            </span>
          </div>
          <p className="text-sm text-gray-500 flex items-center gap-1"><Crown className="w-4 h-4 text-amber-500" /> Người tạo phòng: <b className="text-gray-800">{group.hostName}</b> · mỗi người tự trả phần mình</p>
          {group.note && <p className="text-sm text-gray-500 italic">Ghi chú: {group.note}</p>}
        </div>

        <div className="md:w-72 rounded-2xl border border-orange-100 bg-orange-50/60 p-4 text-sm space-y-2">
          {isMember ? (
            <>
              <p className="font-bold text-gray-900">
                Tài khoản: {me!.displayName}{' '}
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${me!.isHost ? 'bg-orange-500 text-white' : 'bg-blue-100 text-blue-700'}`}>
                  {me!.isHost ? 'Người tạo phòng' : 'Thành viên'}
                </span>
              </p>
              <p className="text-xs text-gray-500">
                {me!.isHost
                  ? `Bạn quản lý thành viên và chốt đơn khi đủ ${group.minMembers} người đã thanh toán.`
                  : 'Chọn món cho phần của bạn rồi thanh toán trước để người tạo phòng chốt đơn.'}
              </p>
              {walletBalance !== null && (
                <p className="flex items-center gap-1 text-xs text-gray-600"><Wallet className="w-3.5 h-3.5" /> Ví: <b>{formatCurrency(walletBalance)}</b>
                  <Link to={ROUTES.CUSTOMER_WALLET} className="ml-1 text-orange-600 hover:underline">Nạp ví</Link>
                </p>
              )}
            </>
          ) : (
            <p className="text-gray-600">Bạn chưa tham gia phòng này.</p>
          )}
        </div>
      </section>

      {/* Status banners */}
      {group.status === 'Submitted' && (
        <section className="rounded-2xl border border-blue-200 bg-blue-50 p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <Truck className="w-6 h-6 text-blue-600 mt-0.5" />
            <div>
              <p className="font-bold text-blue-900">Đơn gom đã chốt và gửi tới quán</p>
              <p className="text-sm text-blue-800">
                {activeCount} phần · ship mỗi người {formatCurrency(group.shippingSharePerMember)} · shipper nhận {formatCurrency(group.shipperIncome)} cho 1 lượt giao.
              </p>
            </div>
          </div>
          {group.orderStatus && (
            <span className={`text-sm font-bold px-3 py-1.5 rounded-full ${getOrderStatusColor(group.orderStatus)}`}>{getOrderStatusLabel(group.orderStatus)}</span>
          )}
        </section>
      )}
      {group.status === 'Cancelled' && (
        <section className="rounded-2xl border border-gray-200 bg-gray-50 p-4 flex items-start gap-3">
          <Ban className="w-6 h-6 text-gray-500" />
          <div>
            <p className="font-bold text-gray-800">Phòng gom đơn đã hủy</p>
            <p className="text-sm text-gray-600">{group.cancelReason || 'Không có lý do.'} Tiền đã thanh toán được hoàn về ví người trả.</p>
          </div>
        </section>
      )}

      {showMap && campusBuildings.length > 0 && (
        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4">
          <p className="text-sm font-bold text-gray-900 mb-2">Điểm giao: {group.buildingName}{group.buildingDropPoint ? ` — ${group.buildingDropPoint}` : ''}</p>
          <CampusMap buildings={campusBuildings} selectedId={group.buildingId} />
        </section>
      )}

      {/* Join panel */}
      {!isMember && isOpen && (
        <section className="rounded-3xl border-2 border-dashed border-orange-300 bg-orange-50/50 p-5">
          <h2 className="font-bold text-gray-900 flex items-center gap-2"><Users className="w-5 h-5 text-orange-500" /> Vào phòng & đặt chung — ship chỉ ~{formatCurrency(group.shippingSharePerMember)}/người</h2>
          {isAuthenticated ? (
            <>
            <div className="mt-3">
              <p className="text-sm font-bold text-gray-900 mb-2">1. Chọn món của bạn * <span className="font-normal text-gray-500">(phải có ít nhất 1 món mới vào được phòng)</span></p>
              <DishPicker
                menu={menu}
                draft={joinDraft}
                onChange={setJoinDraft}
                cartItems={restaurantCartItems}
                stoppedCartItems={stoppedCartItems}
                useCart={joinUseCart ?? true}
                onUseCartChange={setJoinUseCart}
              />
            </div>
            <p className="mt-4 text-sm font-bold text-gray-900">2. Thông tin nhận hàng</p>
            <div className="mt-2 grid sm:grid-cols-4 gap-3">
              {group.deliveryMode === 'Room' && (
                <input value={joinForm.roomNumber} onChange={(e) => setJoinForm({ ...joinForm, roomNumber: e.target.value })} placeholder="Số phòng của bạn *"
                  className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-orange-500" />
              )}
              <input value={joinForm.phone} onChange={(e) => setJoinForm({ ...joinForm, phone: e.target.value })} placeholder="SĐT nhận hàng (mặc định SĐT tài khoản)"
                className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-orange-500" />
              <input value={joinForm.note} onChange={(e) => setJoinForm({ ...joinForm, note: e.target.value })} placeholder="Ghi chú (tùy chọn)"
                className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-orange-500" />
              <button
                disabled={busy === 'join' || joinDishCount === 0}
                onClick={() => run('join', () => groupOrderService.join(group.id, {
                  roomNumber: joinForm.roomNumber.trim() || undefined,
                  phone: joinForm.phone.trim() || undefined,
                  note: joinForm.note.trim() || undefined,
                  items: draftToRequest(joinDraft),
                  fromCart: joinFromCart,
                }), () => {
                  setJoinDraft([]);
                  if (joinFromCart) refreshCart();
                })}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 text-white font-bold text-sm hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {busy === 'join' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {joinDishCount === 0 ? 'Chọn món để vào phòng' : `Vào phòng với ${joinDishCount} món`}
              </button>
            </div>
            </>
          ) : (
            <button onClick={() => navigate(ROUTES.LOGIN)} className="mt-3 px-4 py-2.5 rounded-xl bg-orange-500 text-white font-bold text-sm hover:bg-orange-600">
              Đăng nhập để tham gia
            </button>
          )}
        </section>
      )}

      <div className="grid lg:grid-cols-[1.15fr_1fr] gap-5 items-start">
        {/* Menu */}
        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <h2 className="font-bold text-gray-900">Thực đơn quán ({menu.length} món)</h2>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm món..."
                className="pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-orange-500 w-48" />
            </div>
          </div>
          {isMember && (
            <p className="text-xs px-3 py-2 rounded-xl bg-orange-50 text-orange-700 border border-orange-100 mb-3">
              {me!.paymentStatus === 'Paid'
                ? 'Phần của bạn đã thanh toán — hủy thanh toán ở giỏ nhóm nếu muốn sửa món.'
                : <>Đang đặt món cho tài khoản: <b>{me!.displayName}</b>{me!.isHost ? ' (người tạo phòng)' : ''}</>}
            </p>
          )}
          <div className="grid sm:grid-cols-2 gap-3">
            {filteredMenu.map((item) => {
              const sel = selectionOf(item);
              const disabled = !(canEditItems || canDraft);
              return (
                <div key={item.id} className="rounded-2xl border border-gray-100 p-3 flex flex-col gap-2">
                  <div className="flex gap-3">
                    <DishImage src={item.imageUrl} alt={item.itemName} className="w-16 h-16 rounded-xl shrink-0" />
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-gray-900 line-clamp-2">{item.itemName}</p>
                      {item.description && <p className="text-[11px] text-gray-400 line-clamp-1">{item.description}</p>}
                      <p className="text-orange-600 font-black text-sm mt-0.5">{formatCurrency(priceOf(item, sel))}</p>
                    </div>
                  </div>
                  {item.sizes.length > 0 && (
                    <select value={sel.size ?? ''} disabled={disabled} onChange={(e) => updateSelection(item, { size: e.target.value })}
                      className="px-2 py-1.5 rounded-lg border border-gray-200 text-xs bg-white">
                      {item.sizes.map((s) => (
                        <option key={s.sizeName} value={s.sizeName}>{s.sizeName}{s.extraPrice > 0 ? ` (+${formatCurrency(s.extraPrice)})` : ''}</option>
                      ))}
                    </select>
                  )}
                  {item.toppings.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {item.toppings.map((t) => {
                        const checked = sel.toppings.includes(t.name);
                        return (
                          <button key={t.name} type="button" disabled={disabled}
                            onClick={() => updateSelection(item, { toppings: checked ? sel.toppings.filter((x) => x !== t.name) : [...sel.toppings, t.name] })}
                            className={`text-[11px] px-2 py-0.5 rounded-full border ${checked ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-600 border-gray-200'}`}
                          >
                            {t.name} +{formatCurrency(t.price)}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  <input value={sel.note} disabled={disabled} onChange={(e) => updateSelection(item, { note: e.target.value })} maxLength={200}
                    placeholder="Ghi chú riêng (VD: ít đá, không hành)..." className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs" />
                  <div className="flex items-center gap-2">
                    <div className="flex items-center rounded-lg border border-gray-200">
                      <button type="button" disabled={disabled} onClick={() => updateSelection(item, { qty: Math.max(1, sel.qty - 1) })} className="p-1.5 text-gray-500"><Minus className="w-3.5 h-3.5" /></button>
                      <span className="w-6 text-center text-sm font-semibold">{sel.qty}</span>
                      <button type="button" disabled={disabled} onClick={() => updateSelection(item, { qty: Math.min(20, sel.qty + 1) })} className="p-1.5 text-gray-500"><Plus className="w-3.5 h-3.5" /></button>
                    </div>
                    <button
                      disabled={disabled || busy === `add-${item.id}`}
                      onClick={() => {
                        const clearSelection = () => setSelections((prev) => { const next = { ...prev }; delete next[item.id]; return next; });
                        if (!isMember) {
                          const note = sel.note.trim() || undefined;
                          const key = [item.id, sel.size ?? '', [...sel.toppings].sort().join(','), note ?? ''].join('|');
                          setJoinDraft((prev) => prev.some((d) => d.key === key)
                            ? prev.map((d) => (d.key === key ? { ...d, quantity: Math.min(20, d.quantity + sel.qty) } : d))
                            : [...prev, { key, productId: item.id, itemName: item.itemName, unitPrice: priceOf(item, sel), quantity: sel.qty, selectedSize: sel.size, selectedToppings: sel.toppings, note }]);
                          clearSelection();
                          toast.success(`Đã chọn ${item.itemName} — bấm "Vào phòng" để gửi món vào phòng.`);
                          return;
                        }
                        run(`add-${item.id}`, () => groupOrderService.addItem(group.id, {
                          productId: item.id,
                          quantity: sel.qty,
                          selectedSize: sel.size,
                          selectedToppings: sel.toppings,
                          note: sel.note.trim() || undefined,
                        }), clearSelection);
                      }}
                      className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-orange-500 text-white text-xs font-bold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {busy === `add-${item.id}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                      {isMember ? `Thêm vào phần của ${me!.displayName.split(' ').slice(-1)[0]}` : canDraft ? 'Chọn món để vào phòng' : 'Đăng nhập để đặt'}
                    </button>
                  </div>
                </div>
              );
            })}
            {filteredMenu.length === 0 && <p className="col-span-full text-center text-sm text-gray-400 py-8">Không có món phù hợp.</p>}
          </div>
        </section>

        {/* Group cart */}
        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 space-y-4 lg:sticky lg:top-20">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="font-bold text-gray-900 flex items-center gap-2"><ShoppingBag className="w-5 h-5 text-orange-500" /> Giỏ hàng nhóm & chia tiền</h2>
              <p className="text-xs text-gray-500">{group.memberCount} thành viên · {group.members.reduce((s, m) => s + m.items.reduce((a, i) => a + i.quantity, 0), 0)} phần ăn</p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
              Ship {formatCurrency(group.shippingSharePerMember)}/người
            </span>
          </div>

          {group.status === 'Open' && (
            <div className={`rounded-xl border p-3 text-sm ${enough ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
              <div className="flex items-center justify-between gap-2 font-bold">
                <span className="flex items-center gap-1.5">{enough ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />} Điều kiện ship đơn nhóm: từ {group.minMembers} người</span>
                <span className="px-2 py-0.5 rounded-full bg-white/70 border text-xs">{activeCount}/{group.minMembers} người</span>
              </div>
              <p className="text-xs mt-1">
                {enough
                  ? `Đã đủ người! ${group.paidMemberCount}/${activeCount} người đã thanh toán trước.`
                  : `Cần thêm ít nhất ${group.minMembers - activeCount} người nữa chọn món để đủ điều kiện giao đơn nhóm.`}
              </p>
            </div>
          )}

          <div className="space-y-3 max-h-[26rem] overflow-y-auto pr-1">
            {group.members.map((m) => (
              <MemberCard
                key={m.id}
                member={m}
                group={group}
                canEdit={m.isMe && canEditItems}
                canKick={group.isHost && !m.isHost && isOpen}
                busy={busy}
                onQty={(itemId, qty) => run(`qty-${itemId}`, () => groupOrderService.updateItem(group.id, itemId, qty))}
                onRemove={(itemId) => run(`qty-${itemId}`, () => groupOrderService.removeItem(group.id, itemId))}
                onKick={() => {
                  if (window.confirm(`Xóa ${m.displayName} khỏi phòng? Tiền đã trả (nếu có) sẽ được hoàn về ví.`))
                    run(`kick-${m.id}`, () => groupOrderService.removeMember(group.id, m.id));
                }}
                onUnpay={() => run(`unpay-${m.id}`, () => groupOrderService.unpay(group.id, m.id), refreshWallet)}
                canUnpay={isOpen && m.paymentStatus === 'Paid' && (m.isMe || group.isHost)}
              />
            ))}
          </div>

          {isMember && isOpen && (
            <div className="rounded-xl border border-gray-100 p-3 text-sm">
              {editInfo ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input value={myInfo.roomNumber} onChange={(e) => setMyInfo({ ...myInfo, roomNumber: e.target.value })} placeholder="Số phòng"
                      className="px-2.5 py-2 rounded-lg border border-gray-200 text-xs" />
                    <input value={myInfo.phone} onChange={(e) => setMyInfo({ ...myInfo, phone: e.target.value })} placeholder="SĐT"
                      className="px-2.5 py-2 rounded-lg border border-gray-200 text-xs" />
                  </div>
                  <input value={myInfo.note} onChange={(e) => setMyInfo({ ...myInfo, note: e.target.value })} placeholder="Ghi chú cho shipper"
                    className="w-full px-2.5 py-2 rounded-lg border border-gray-200 text-xs" />
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setEditInfo(false)} className="px-3 py-1.5 text-xs rounded-lg border border-gray-200">Hủy</button>
                    <button
                      onClick={() => run('me', () => groupOrderService.updateMe(group.id, {
                        roomNumber: myInfo.roomNumber.trim() || undefined,
                        phone: myInfo.phone.trim() || undefined,
                        note: myInfo.note.trim() || undefined,
                      }), () => setEditInfo(false))}
                      className="px-3 py-1.5 text-xs rounded-lg bg-orange-500 text-white font-semibold"
                    >Lưu</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2 text-xs text-gray-600">
                  <span>Nhận tại: <b>{me!.roomNumber ? `Phòng ${me!.roomNumber}` : group.buildingDropPoint || group.buildingName}</b> · {me!.phone}</span>
                  <button
                    onClick={() => {
                      setMyInfo({ roomNumber: me!.roomNumber ?? '', phone: me!.phone ?? '', note: me!.note ?? '' });
                      setEditInfo(true);
                    }}
                    className="text-orange-600 font-semibold hover:underline"
                  >Sửa</button>
                </div>
              )}
            </div>
          )}

          <div className="rounded-2xl bg-gray-50 p-4 space-y-1.5 text-sm">
            <Row label={`Tạm tính (${group.members.reduce((s, m) => s + m.items.reduce((a, i) => a + i.quantity, 0), 0)} món)`} value={formatCurrency(group.itemsSubtotal)} />
            <Row label={`Phí giao cơ bản (chia ${Math.max(activeCount, group.minMembers)} người)`} value={formatCurrency(group.baseShippingFee)} />
            <Row label={`Phụ phí ${group.deliveryMode === 'Room' ? 'tận phòng' : group.deliveryMode === 'Lobby' ? 'giao sảnh' : 'cổng'} (${group.buildingShortName})`}
              value={`+${formatCurrency(group.surchargePerMember * activeCount)}`} accent />
            <div className="flex items-center justify-between pt-2 border-t border-gray-200">
              <span className="font-bold text-gray-900">Tổng cộng cả nhóm:</span>
              <span className="text-xl font-black text-orange-600">{formatCurrency(group.totalAmount)}</span>
            </div>
            {singleSaving > 0 && (
              <p className="text-xs text-emerald-700">Mỗi người tiết kiệm ~{formatCurrency(singleSaving)} so với đặt lẻ ship tận phòng · shipper nhận {formatCurrency(group.shippingFeeTotal)} cho 1 lượt.</p>
            )}
          </div>

          {isMember && isOpen && (
            <div className="space-y-2">
              {me!.paymentStatus !== 'Paid' && me!.items.length > 0 && (
                <button
                  disabled={busy === 'pay'}
                  onClick={() => run('pay', () => groupOrderService.pay(group.id, false), refreshWallet)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold hover:from-orange-600 hover:to-orange-700 disabled:opacity-60"
                >
                  {busy === 'pay' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />}
                  Thanh toán trước phần của tôi ({formatCurrency(me!.prepayAmount)})
                </button>
              )}
              <p className="text-[11px] text-gray-500 text-center">
                Thanh toán trước tạm tính ship theo {group.minMembers} người ({formatCurrency(group.prepayShippingShare)}). Chốt đơn đông hơn sẽ tự hoàn chênh lệch về ví.
              </p>

              {group.isHost ? (
                <>
                  <button
                    disabled={!group.canSubmit || busy === 'submit'}
                    onClick={() => run('submit', () => groupOrderService.submit(group.id))}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gray-900 text-white font-bold hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed"
                  >
                    {busy === 'submit' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
                    {group.canSubmit ? `Chốt đơn & gửi cho quán (${activeCount} người)` : (group.submitBlockReason || 'Chưa thể chốt đơn')}
                  </button>
                  <button
                    disabled={busy === 'cancel'}
                    onClick={() => {
                      const reason = window.prompt('Lý do hủy phòng (mọi người đã thanh toán sẽ được hoàn ví):', 'Không đủ người');
                      if (reason !== null) run('cancel', () => groupOrderService.cancel(group.id, reason), refreshWallet);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm text-red-600 hover:bg-red-50"
                  >
                    <Ban className="w-4 h-4" /> Hủy phòng gom đơn
                  </button>
                </>
              ) : (
                <button
                  disabled={busy === 'leave'}
                  onClick={() => {
                    if (window.confirm('Rời phòng gom đơn? Món của bạn sẽ bị xóa và tiền đã trả được hoàn về ví.'))
                      run('leave', () => groupOrderService.leave(group.id), () => { refreshWallet(); navigate('/group-orders'); });
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-100"
                >
                  <LogOut className="w-4 h-4" /> Rời phòng
                </button>
              )}
            </div>
          )}
        </section>
      </div>

      <Modal isOpen={showBill} onClose={() => setShowBill(false)} title={`Bảng chia tiền #${group.code}`} size="lg">
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b">
                  <th className="py-2 pr-2">Thành viên</th>
                  <th className="py-2 pr-2">Phòng</th>
                  <th className="py-2 pr-2 text-right">Tiền món</th>
                  <th className="py-2 pr-2 text-right">Ship</th>
                  <th className="py-2 pr-2 text-right">Phải trả</th>
                  <th className="py-2">Thanh toán</th>
                </tr>
              </thead>
              <tbody>
                {group.members.filter((m) => m.items.length > 0).map((m) => (
                  <tr key={m.id} className="border-b border-gray-50">
                    <td className="py-2 pr-2 font-semibold">{m.displayName}{m.isHost ? ' 👑' : ''}</td>
                    <td className="py-2 pr-2 text-gray-500">{m.roomNumber || '—'}</td>
                    <td className="py-2 pr-2 text-right">{formatCurrency(m.itemsSubtotal)}</td>
                    <td className="py-2 pr-2 text-right">{formatCurrency(m.shippingShare)}</td>
                    <td className="py-2 pr-2 text-right font-bold text-orange-600">{formatCurrency(m.amountDue)}</td>
                    <td className="py-2 text-xs">
                      {m.paymentStatus === 'Paid'
                        ? (m.paidByUserId && m.paidByUserId !== m.userAccountId ? <span className="text-amber-600">{m.paidByName} trả hộ — chuyển lại</span> : <span className="text-emerald-600">Đã trả</span>)
                        : <span className="text-gray-400">{MEMBER_PAYMENT_LABELS[m.paymentStatus]}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="font-bold">
                  <td className="py-2" colSpan={2}>Tổng</td>
                  <td className="py-2 text-right">{formatCurrency(group.itemsSubtotal)}</td>
                  <td className="py-2 text-right">{formatCurrency(group.shippingFeeTotal)}</td>
                  <td className="py-2 text-right text-orange-600">{formatCurrency(group.totalAmount)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
          <p className="text-xs text-gray-500">
            Tiền ship = {formatCurrency(group.baseShippingFee)} phí cơ bản chia đều + {formatCurrency(group.surchargePerMember)}/người phụ phí {DELIVERY_MODE_LABELS[group.deliveryMode].toLowerCase()}.
            Mỗi người tự thanh toán trước phần của mình bằng ví UniEats.
          </p>
          <button onClick={() => copy(billText, 'Đã copy bảng chia tiền — dán vào nhóm chat nhé!')}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-orange-500 text-white font-bold hover:bg-orange-600">
            <Copy className="w-4 h-4" /> Copy bảng chia tiền gửi nhóm chat
          </button>
        </div>
      </Modal>
    </div>
  );
}

function Row({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-gray-600">{label}:</span>
      <span className={`font-semibold ${accent ? 'text-orange-600' : 'text-gray-900'}`}>{value}</span>
    </div>
  );
}

interface MemberCardProps {
  member: IGroupOrderMemberDto;
  group: IGroupOrderDetailDto;
  canEdit: boolean;
  canKick: boolean;
  canUnpay: boolean;
  busy: string | null;
  onQty: (itemId: string, qty: number) => void;
  onRemove: (itemId: string) => void;
  onKick: () => void;
  onUnpay: () => void;
}

function MemberCard({ member: m, group, canEdit, canKick, canUnpay, busy, onQty, onRemove, onKick, onUnpay }: MemberCardProps) {
  const paid = m.paymentStatus === 'Paid';
  return (
    <div className={`rounded-2xl border p-3 ${m.isMe ? 'border-orange-300 bg-orange-50/40' : 'border-gray-100'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {m.avatarUrl ? (
            <img src={m.avatarUrl} alt={m.displayName} className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-bold">{m.displayName.charAt(0).toUpperCase()}</div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate flex items-center gap-1.5">
              {m.displayName}
              {m.isHost && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-100 text-orange-700">Người tạo phòng</span>}
              {m.deliveredAt && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">Đã giao tới nơi</span>}
              {m.isMe && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">Bạn</span>}
            </p>
            <p className="text-[11px] text-gray-500">{m.roomNumber ? `Phòng ${m.roomNumber}` : group.deliveryMode === 'Room' ? 'Chưa nhập phòng' : group.buildingShortName}</p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-black text-orange-600">{formatCurrency(m.amountDue)}</p>
          <p className="text-[10px] text-gray-400">(Món {formatCurrency(m.itemsSubtotal)} + Ship {formatCurrency(m.shippingShare)})</p>
        </div>
      </div>

      {m.items.length === 0 ? (
        <p className="text-xs italic text-gray-400 mt-2 pl-10">Chưa chọn món nào</p>
      ) : (
        <ul className="mt-2 pl-10 space-y-1">
          {m.items.map((i) => (
            <li key={i.id} className="flex items-center justify-between gap-2 text-xs">
              <span className="min-w-0">
                <span className="font-semibold text-gray-800">{i.quantity}× {i.itemName}</span>
                {(i.selectedSize || i.selectedToppings) && <span className="text-gray-400"> · {[i.selectedSize, i.selectedToppings].filter(Boolean).join(', ')}</span>}
                {i.note && <span className="block text-gray-400 italic truncate">{i.note}</span>}
              </span>
              {canEdit ? (
                <span className="flex items-center gap-1 shrink-0">
                  <button disabled={busy === `qty-${i.id}`} onClick={() => onQty(i.id, i.quantity - 1)} className="p-0.5 rounded border border-gray-200"><Minus className="w-3 h-3" /></button>
                  <button disabled={busy === `qty-${i.id}`} onClick={() => onQty(i.id, i.quantity + 1)} className="p-0.5 rounded border border-gray-200"><Plus className="w-3 h-3" /></button>
                  <button disabled={busy === `qty-${i.id}`} onClick={() => onRemove(i.id)} className="p-0.5 text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                </span>
              ) : (
                <span className="shrink-0 text-gray-600">{formatCurrency(i.totalPrice)}</span>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-2 pl-10 flex flex-wrap items-center gap-2">
        {m.items.length > 0 && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${paid ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
            {paid
              ? (m.paidByUserId && m.paidByUserId !== m.userAccountId ? `${m.paidByName} trả hộ ${formatCurrency(m.paidAmount)}` : `Đã trả ${formatCurrency(m.paidAmount)}`)
              : MEMBER_PAYMENT_LABELS[m.paymentStatus]}
          </span>
        )}
        {canUnpay && (
          <button disabled={busy === `unpay-${m.id}`} onClick={onUnpay} className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-orange-600">
            <Undo2 className="w-3 h-3" /> Hủy thanh toán để sửa
          </button>
        )}
        {canKick && (
          <button disabled={busy === `kick-${m.id}`} onClick={onKick} className="flex items-center gap-1 text-[11px] text-red-500 hover:text-red-600 ml-auto">
            <UserMinus className="w-3 h-3" /> Xóa khỏi phòng
          </button>
        )}
      </div>
    </div>
  );
}
