import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Building2, CheckSquare, DoorOpen, Home, Loader2, MapPin, ShoppingBag, Sparkles, Square, Truck, UserPlus, Users, Wallet,
} from 'lucide-react';
import { useAuth, useCart } from '../../hooks';
import { ROUTES } from '../../routes/routeConfig';
import { formatCurrency } from '../../utils/formatters';
import { campusService, groupOrderService } from '../../services/GroupOrderService';
import type {
  CampusBuildingType, GroupDeliveryMode, ICampusBuildingDto, ICampusDto,
  IGroupOrderDraftItem, IGroupOrderMenuItemDto, IGroupOrderRestaurantDto, IGroupOrderSummaryDto,
} from '../../interfaces';
import { CampusMap } from '../../components/groupOrder/CampusMap';
import { BuildingPicker } from '../../components/groupOrder/BuildingPicker';
import { DishPicker } from '../../components/groupOrder/DishPicker';
import { GroupOrderCard } from '../../components/groupOrder/GroupOrderCard';
import {
  cartItemsTotal, draftToRequest, draftTotal, estimateShippingShare, getApiErrorMessage, groupOrderPath, splitRestaurantCart,
} from '../../components/groupOrder/groupOrderLabels';

const GROUP_ORDER_DURATION_MINUTES = 45;

const MODE_TYPES: Record<GroupDeliveryMode, CampusBuildingType[]> = {
  Gate: ['Gate'],
  Lobby: ['Dormitory', 'Lecture'],
  Room: ['Dormitory', 'Lecture'],
};

export function GroupOrderHubPage() {
  const { user, isAuthenticated } = useAuth();
  const { items: cartItems, refreshCart } = useCart();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [campuses, setCampuses] = useState<ICampusDto[]>([]);
  const [campusId, setCampusId] = useState<string>('');
  const [loadingCampuses, setLoadingCampuses] = useState(true);
  const [restaurants, setRestaurants] = useState<IGroupOrderRestaurantDto[]>([]);
  const [openGroups, setOpenGroups] = useState<IGroupOrderSummaryDto[]>([]);
  const [myGroups, setMyGroups] = useState<IGroupOrderSummaryDto[]>([]);
  const [browseBuildingId, setBrowseBuildingId] = useState<string | null>(null);
  const [pin, setPin] = useState('');
  const [joiningPin, setJoiningPin] = useState(false);

  const [restaurantId, setRestaurantId] = useState(searchParams.get('restaurant') ?? '');
  const [menu, setMenu] = useState<IGroupOrderMenuItemDto[]>([]);
  const [draft, setDraft] = useState<IGroupOrderDraftItem[]>([]);
  const [useCartItems, setUseCartItems] = useState(searchParams.get('fromCart') === '1');
  const [title, setTitle] = useState('');
  const [phoneInput, setPhone] = useState<string | null>(null);
  const [deliveryMode, setDeliveryMode] = useState<GroupDeliveryMode>('Room');
  const [pickedBuildingId, setBuildingId] = useState<string | null>(null);
  const [roomNumber, setRoomNumber] = useState('');
  const [note, setNote] = useState('');
  const [creating, setCreating] = useState(false);

  const campus = campuses.find((c) => c.id === campusId) ?? null;
  const buildings = useMemo(() => campus?.buildings ?? [], [campus]);
  const pickedBuilding = buildings.find((b) => b.id === pickedBuildingId) ?? null;
  const pickedFitsMode = !!pickedBuilding
    && MODE_TYPES[deliveryMode].includes(pickedBuilding.buildingType)
    && (deliveryMode !== 'Room' || pickedBuilding.allowRoomDelivery);
  const selectedBuilding = pickedFitsMode ? pickedBuilding : null;
  const buildingId = selectedBuilding?.id ?? null;
  const phone = phoneInput ?? user?.phone ?? '';
  const surcharge = !campus ? 0 : deliveryMode === 'Room' ? campus.roomSurchargePerMember : deliveryMode === 'Lobby' ? campus.lobbySurchargePerMember : 0;
  const { available: restaurantCartItems, stopped: stoppedCartItems } = useMemo(
    () => splitRestaurantCart(cartItems, restaurantId, menu),
    [cartItems, restaurantId, menu]
  );
  const takeFromCart = useCartItems && restaurantCartItems.length > 0;
  const myDishCount = draft.reduce((s, d) => s + d.quantity, 0) + (takeFromCart ? restaurantCartItems.reduce((s, i) => s + i.quantity, 0) : 0);
  const myDishTotal = draftTotal(draft) + (takeFromCart ? cartItemsTotal(restaurantCartItems) : 0);

  useEffect(() => {
    if (!restaurantId) return;
    groupOrderService.getMenu(restaurantId).then((res) => setMenu(res.data ?? [])).catch(() => setMenu([]));
  }, [restaurantId]);

  const changeRestaurant = (id: string) => {
    setRestaurantId(id);
    setDraft([]);
    setMenu([]);
  };

  useEffect(() => {
    campusService.getCampuses()
      .then((res) => {
        const list = res.data ?? [];
        setCampuses(list);
        const fromQuery = searchParams.get('campus');
        const initial = list.find((c) => c.code === fromQuery || c.id === fromQuery) ?? list[0];
        if (initial) setCampusId(initial.id);
      })
      .catch((err) => toast.error(getApiErrorMessage(err, 'Không tải được danh sách trường.')))
      .finally(() => setLoadingCampuses(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadGroups = useCallback(async () => {
    if (!campusId) return;
    try {
      const [open, fresh] = await Promise.all([
        groupOrderService.getOpen({ campusId, take: 60 }),
        campusService.getCampuses(),
      ]);
      setOpenGroups(open.data ?? []);
      if (fresh.data) setCampuses(fresh.data);
    } catch {
      /* polling — bỏ qua lỗi mạng tạm thời */
    }
  }, [campusId]);

  useEffect(() => {
    if (!campusId) return;
    groupOrderService.getRestaurants(campusId)
      .then((res) => setRestaurants(res.data ?? []))
      .catch(() => setRestaurants([]));
    loadGroups();
    const timer = window.setInterval(loadGroups, 15000);
    return () => window.clearInterval(timer);
  }, [campusId, loadGroups]);

  useEffect(() => {
    if (!isAuthenticated) return;
    groupOrderService.getMine().then((res) => setMyGroups(res.data ?? [])).catch(() => setMyGroups([]));
  }, [isAuthenticated]);

  const selectCampus = (id: string) => {
    if (id === campusId) return;
    setCampusId(id);
    setBuildingId(null);
    setBrowseBuildingId(null);
    changeRestaurant('');
    setRestaurants([]);
    const c = campuses.find((x) => x.id === id);
    if (c) setSearchParams({ campus: c.code }, { replace: true });
  };

  const pickBuilding = (b: ICampusBuildingDto) => {
    setBuildingId(b.id);
    setBrowseBuildingId(b.id);
  };

  const groupsInSelectedBuilding = useMemo(
    () => (buildingId ? openGroups.filter((g) => g.buildingId === buildingId) : []),
    [openGroups, buildingId]
  );
  const restaurantOpenGroups = restaurantId ? openGroups.filter((g) => g.restaurantId === restaurantId) : [];
  const browseGroups = browseBuildingId ? openGroups.filter((g) => g.buildingId === browseBuildingId) : openGroups;
  const browseBuilding = buildings.find((b) => b.id === browseBuildingId) ?? null;

  const directoryBuildings = useMemo(
    () => buildings
      .filter((b) => b.isActive && b.buildingType !== 'Landmark')
      .sort((a, b) => b.openGroupCount - a.openGroupCount || a.sortOrder - b.sortOrder),
    [buildings]
  );

  const handleJoinByPin = async () => {
    const code = pin.trim().toUpperCase();
    if (code.length < 4) {
      toast.error('Nhập mã phòng 6 ký tự (VD: F8K2QX).');
      return;
    }
    setJoiningPin(true);
    try {
      const res = await groupOrderService.getByCode(code);
      navigate(groupOrderPath(res.data.id));
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Không tìm thấy phòng với mã này.'));
    } finally {
      setJoiningPin(false);
    }
  };

  const handleCreate = async () => {
    if (!isAuthenticated) {
      navigate(ROUTES.LOGIN);
      return;
    }
    if (!campus) return;
    if (!restaurantId) return toast.error('Chọn quán muốn gom đơn.');
    if (myDishCount === 0) return toast.error('Thêm ít nhất 1 món cho phần của bạn (từ giỏ hàng hoặc thực đơn) trước khi tạo đơn nhóm.');
    if (!buildingId) return toast.error('Chọn điểm giao trên sơ đồ trường.');
    if (deliveryMode === 'Room' && !roomNumber.trim()) return toast.error('Nhập số phòng để shipper giao tận phòng.');
    if (!phone.trim()) return toast.error('Nhập số điện thoại nhận hàng.');

    setCreating(true);
    try {
      const res = await groupOrderService.create({
        campusId: campus.id,
        buildingId,
        restaurantId,
        title: title.trim(),
        deliveryMode,
        paymentMode: 'Individual',
        roomNumber: roomNumber.trim() || undefined,
        phone: phone.trim(),
        note: note.trim() || undefined,
        durationMinutes: GROUP_ORDER_DURATION_MINUTES,
        items: draftToRequest(draft),
        fromCart: takeFromCart,
      });
      if (takeFromCart) refreshCart();
      toast.success(res.message || 'Đã tạo phòng gom đơn!');
      navigate(groupOrderPath(res.data.id));
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Tạo phòng gom đơn thất bại.'));
    } finally {
      setCreating(false);
    }
  };

  if (loadingCampuses) {
    return <div className="flex justify-center py-32"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>;
  }

  if (!campus) {
    return <div className="max-w-3xl mx-auto py-24 text-center text-gray-500">Chưa có trường nào bật tính năng gom đơn.</div>;
  }

  const minM = campus.minGroupMembers;
  const examples = [minM, minM + 1, minM + 2].map((n) => ({
    n,
    share: estimateShippingShare(campus.groupBaseShippingFee, surcharge, n),
    shipper: campus.groupBaseShippingFee + surcharge * n,
  }));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6 text-gray-900">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-400 text-white p-6 sm:p-8 shadow-xl shadow-orange-500/20">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider bg-white/20 rounded-full px-3 py-1">
          <Sparkles className="w-3.5 h-3.5" /> Tính năng đặc quyền sinh viên {campus.shortName}
        </span>
        <h1 className="mt-3 text-2xl sm:text-3xl font-black">Đặt Đơn Nhóm & Tự Động Chia Tiền</h1>
        <p className="mt-2 max-w-3xl text-sm sm:text-base text-orange-50 leading-relaxed">
          Gộp chung đơn từ <b>{minM} người trở lên</b> cùng Dom / tòa học — cùng một quán — để chia nhỏ phí ship.
          Ship tận phòng chỉ từ <b>{formatCurrency(examples[2].share)}</b>/người thay vì ~{formatCurrency(campus.singleRoomDeliveryFee)} khi đặt lẻ.
          Mỗi bạn đăng nhập vào phòng tự chọn món, ghi số phòng riêng và <b>thanh toán trước</b> phần của mình — tiền ship tự chia đều.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {campuses.map((c) => (
            <button
              key={c.id}
              onClick={() => selectCampus(c.id)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                c.id === campusId ? 'bg-white text-orange-600 shadow-lg' : 'bg-white/15 text-white hover:bg-white/25'
              }`}
            >
              {c.shortName} <span className="font-normal opacity-80">· {c.openGroupCount} phòng mở</span>
            </button>
          ))}
        </div>
      </section>

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        {/* Create form */}
        <section className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900"><Users className="w-5 h-5 text-orange-500" /> Khởi tạo phòng gom đơn mới</h2>
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-orange-50 text-orange-600 border border-orange-100">Ship khi đủ {minM} người trở lên</span>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs font-bold text-gray-600 uppercase">Chọn nhà hàng / quán ăn *</span>
              <select
                value={restaurantId}
                onChange={(e) => changeRestaurant(e.target.value)}
                className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-orange-500"
              >
                <option value="">— Chọn quán —</option>
                {restaurants.map((r) => (
                  <option key={r.id} value={r.id} disabled={!r.isOpen}>
                    {r.restaurantName}{r.distanceKm != null ? ` · ${r.distanceKm} km` : ''}{!r.isOpen ? ' (đang đóng)' : ''}{r.openGroupCount > 0 ? ` · ${r.openGroupCount} phòng mở` : ''}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-bold text-gray-600 uppercase">Tên phòng gom đơn</span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={150}
                placeholder={`Gom đơn ăn trưa ${selectedBuilding?.shortName ?? campus.shortName}`}
                className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-orange-500"
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold text-gray-600 uppercase">Số điện thoại nhận hàng *</span>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="VD: 0988123456"
                className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-orange-500"
              />
            </label>
          </div>

          {/* Host dishes — a group order cannot be created empty */}
          <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="flex items-center gap-2 font-bold text-gray-900"><ShoppingBag className="w-5 h-5 text-orange-500" /> Món của bạn *</h3>
              {myDishCount > 0 && (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-orange-500 text-white">{myDishCount} món · {formatCurrency(myDishTotal)}</span>
              )}
            </div>
            {!restaurantId ? (
              <p className="text-sm text-gray-500">Chọn quán trước, sau đó lấy món từ giỏ hàng hoặc chọn món ngay tại đây. Phòng gom chỉ được tạo khi bạn đã có món.</p>
            ) : (
              <>
                {restaurantOpenGroups.length > 0 && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                    <p className="text-sm font-bold text-emerald-800 mb-2">Quán này đang có {restaurantOpenGroups.length} phòng gom mở — vào chung để được giảm ship!</p>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {restaurantOpenGroups.slice(0, 4).map((g) => <GroupOrderCard key={g.id} group={g} compact />)}
                    </div>
                  </div>
                )}
                <DishPicker
                  menu={menu}
                  draft={draft}
                  onChange={setDraft}
                  cartItems={restaurantCartItems}
                  stoppedCartItems={stoppedCartItems}
                  useCart={useCartItems}
                  onUseCartChange={setUseCartItems}
                />
                {myDishCount === 0 && <p className="text-xs font-semibold text-amber-600">Chưa có món nào — thêm ít nhất 1 món để tạo đơn nhóm.</p>}
              </>
            )}
          </div>

          {/* Delivery options */}
          <div className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <h3 className="flex items-center gap-2 font-bold text-gray-900"><MapPin className="w-5 h-5 text-orange-500" /> Tùy chọn giao hàng khuôn viên {campus.name}</h3>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                <Truck className="w-3.5 h-3.5" /> Shipper nội khu {campus.shortName}
              </span>
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              {([
                { mode: 'Gate' as const, icon: DoorOpen, title: 'Ship cổng trường', fee: 0, desc: 'Ra cổng nhận đồ — rẻ nhất.' },
                { mode: 'Lobby' as const, icon: Building2, title: 'Ship tới sảnh Dom / Tòa', fee: campus.lobbySurchargePerMember, desc: 'Shipper mang vào sảnh tầng 1 của Dom hoặc tòa học.' },
                { mode: 'Room' as const, icon: Home, title: 'Ship tận phòng', fee: campus.roomSurchargePerMember, desc: 'Shipper leo tầng giao tận cửa từng phòng (mỗi bạn ghi số phòng).' },
              ]).map((opt) => {
                const active = deliveryMode === opt.mode;
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.mode}
                    type="button"
                    onClick={() => setDeliveryMode(opt.mode)}
                    className={`text-left p-3.5 rounded-xl border-2 transition-all ${active ? 'border-orange-400 bg-orange-50 shadow-sm' : 'border-gray-200 bg-white hover:border-orange-200'}`}
                  >
                    <div className="flex items-center gap-2">
                      {active ? <CheckSquare className="w-4 h-4 text-orange-500" /> : <Square className="w-4 h-4 text-gray-300" />}
                      <Icon className="w-4 h-4 text-orange-500" />
                      <span className="font-bold text-sm text-gray-900">{opt.title}</span>
                    </div>
                    <span className={`inline-block mt-2 text-[11px] font-semibold px-2 py-0.5 rounded ${opt.fee > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {opt.fee > 0 ? `+${formatCurrency(opt.fee)}/người` : 'Miễn phụ phí (0đ)'}
                    </span>
                    <p className="mt-1.5 text-xs text-gray-500 leading-relaxed">{opt.desc}</p>
                  </button>
                );
              })}
            </div>

            <div className="rounded-2xl bg-white border border-gray-100 p-3 sm:p-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <p className="font-bold text-gray-900 text-sm">Sơ đồ khuôn viên {campus.name}</p>
                  <p className="text-xs text-gray-500">Nhấp trực tiếp vào {deliveryMode === 'Gate' ? 'cổng' : 'Dom KTX hoặc tòa học'} trên bản đồ để chọn điểm giao.</p>
                </div>
                <span className="text-[11px] font-semibold px-2 py-1 rounded-full bg-orange-50 text-orange-600 whitespace-nowrap">Tương tác trực tiếp</span>
              </div>
              <CampusMap
                buildings={buildings}
                selectedId={buildingId}
                onSelect={pickBuilding}
                selectableTypes={MODE_TYPES[deliveryMode]}
                showCounts
              />
            </div>

            {selectedBuilding ? (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-orange-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-gray-900">Điểm giao đã chọn: <span className="text-orange-600">{selectedBuilding.name}</span></p>
                    <p className="text-xs text-gray-500">
                      {deliveryMode === 'Room' ? `Giao tận phòng · ${selectedBuilding.floors} tầng` : selectedBuilding.dropPoint}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white border border-orange-200 text-orange-600">
                  {surcharge > 0 ? `+${formatCurrency(surcharge)} phí giao ${deliveryMode === 'Room' ? 'tận phòng' : 'tận sảnh'}` : 'Miễn phụ phí'}
                </span>
              </div>
            ) : (
              <p className="text-xs text-gray-500">Chưa chọn điểm giao.</p>
            )}

            {groupsInSelectedBuilding.length > 0 && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                <p className="text-sm font-bold text-emerald-800 mb-2">
                  {selectedBuilding?.shortName} đang có {groupsInSelectedBuilding.length} phòng gom mở — vào chung để giảm ship ngay!
                </p>
                <div className="grid sm:grid-cols-2 gap-2">
                  {groupsInSelectedBuilding.slice(0, 4).map((g) => <GroupOrderCard key={g.id} group={g} compact />)}
                </div>
              </div>
            )}

            <BuildingPicker
              buildings={buildings.filter((b) => deliveryMode !== 'Room' || b.allowRoomDelivery)}
              selectableTypes={MODE_TYPES[deliveryMode]}
              selectedId={buildingId}
              onSelect={pickBuilding}
              surcharge={surcharge}
            />
          </div>

          {deliveryMode === 'Room' && (
            <label className="block sm:max-w-xs">
              <span className="text-xs font-bold text-gray-600 uppercase">Số phòng của bạn *</span>
              <input
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                maxLength={30}
                placeholder="VD: A305"
                className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-orange-500"
              />
            </label>
          )}

          <label className="block">
            <span className="text-xs font-bold text-gray-600 uppercase">Ghi chú thêm cho tài xế (tùy chọn)</span>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={300}
              placeholder="VD: Tới sảnh Dom gọi mình xuống lấy ngay..."
              className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-orange-500"
            />
          </label>

          <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
            <p className="text-sm font-bold text-gray-900 mb-2">Phí ship ước tính mỗi người</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              {examples.map((e) => (
                <div key={e.n} className="rounded-xl bg-white border border-gray-100 p-2.5">
                  <p className="text-[11px] text-gray-500">{e.n} người</p>
                  <p className="text-lg font-black text-orange-600">{formatCurrency(e.share)}</p>
                  <p className="text-[10px] text-emerald-600">Shipper nhận {formatCurrency(e.shipper)}</p>
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Phí cơ bản {formatCurrency(campus.groupBaseShippingFee)} chia đều cho cả nhóm + phụ phí {formatCurrency(surcharge)}/người.
              Khi thanh toán trước sẽ tạm tính theo {minM} người; chốt đơn đông hơn sẽ tự hoàn phần chênh lệch về ví.
              Phòng mở trong {GROUP_ORDER_DURATION_MINUTES} phút — quá hạn chưa chốt sẽ tự hủy và hoàn tiền.
            </p>
          </div>

          <button
            onClick={handleCreate}
            disabled={creating || (isAuthenticated && myDishCount === 0)}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold shadow-lg shadow-orange-500/30 hover:from-orange-600 hover:to-orange-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
            {!isAuthenticated
              ? 'Đăng nhập để tạo phòng gom đơn'
              : myDishCount === 0
                ? 'Thêm món của bạn để tạo đơn nhóm'
                : `Tạo phòng gom đơn với ${myDishCount} món & lấy mã mời bạn bè`}
          </button>
        </section>

        {/* Sidebar */}
        <aside className="space-y-5">
          <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
            <h2 className="flex items-center gap-2 font-bold text-gray-900"><UserPlus className="w-5 h-5 text-orange-500" /> Vào phòng bằng mã PIN</h2>
            <p className="text-xs text-gray-500 mt-1">Nhập mã 6 ký tự bạn bè gửi (VD: <b>F8K2QX</b>) để vào phòng và đặt món bằng tài khoản của bạn.</p>
            <div className="mt-3 flex gap-2">
              <input
                value={pin}
                onChange={(e) => setPin(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleJoinByPin()}
                maxLength={8}
                placeholder="MÃ PIN"
                className="flex-1 min-w-0 px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-mono tracking-widest uppercase focus:outline-none focus:border-orange-500"
              />
              <button
                onClick={handleJoinByPin}
                disabled={joiningPin}
                className="px-4 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-gray-800 disabled:opacity-60"
              >
                {joiningPin ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Vào phòng'}
              </button>
            </div>
          </section>

          {isAuthenticated && myGroups.length > 0 && (
            <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-bold text-gray-900 mb-3">Phòng của tôi</h2>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {myGroups.slice(0, 8).map((g) => <GroupOrderCard key={g.id} group={g} compact />)}
              </div>
            </section>
          )}

          <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="flex items-center gap-2 font-bold text-gray-900"><Building2 className="w-5 h-5 text-orange-500" /> Các tòa trong trường</h2>
              {browseBuildingId && (
                <button onClick={() => setBrowseBuildingId(null)} className="text-xs font-semibold text-orange-600 hover:underline">Tất cả</button>
              )}
            </div>
            <p className="text-xs text-gray-500 mb-3">Chọn tòa của bạn để xem các phòng gom đơn đang mở trong tòa đó.</p>
            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
              {directoryBuildings.map((b) => (
                <button
                  key={b.id}
                  onClick={() => setBrowseBuildingId(b.id === browseBuildingId ? null : b.id)}
                  className={`flex items-center justify-between gap-1 px-2.5 py-2 rounded-xl border text-left text-xs transition-colors ${
                    b.id === browseBuildingId ? 'bg-orange-500 text-white border-orange-500' : 'bg-white border-gray-200 text-gray-800 hover:border-orange-300'
                  }`}
                >
                  <span className="font-semibold truncate">{b.shortName}</span>
                  <span className={`shrink-0 min-w-5 text-center rounded-full px-1.5 text-[10px] font-bold ${
                    b.id === browseBuildingId ? 'bg-white/25' : b.openGroupCount > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'
                  }`}>{b.openGroupCount}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-gray-900">{browseBuilding ? `Phòng gom tại ${browseBuilding.shortName}` : 'Phòng gom đơn gần đây'}</h2>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-orange-600">{browseGroups.length} phòng</span>
            </div>
            <div className="space-y-2 max-h-[28rem] overflow-y-auto pr-1">
              {browseGroups.map((g) => <GroupOrderCard key={g.id} group={g} />)}
              {browseGroups.length === 0 && (
                <div className="text-center py-6 text-sm text-gray-400">
                  {browseBuilding ? `Chưa có phòng nào ở ${browseBuilding.shortName}. Hãy tạo phòng đầu tiên!` : 'Chưa có phòng gom đơn nào đang mở.'}
                </div>
              )}
            </div>
          </section>

          {isAuthenticated && (
            <Link to={ROUTES.CUSTOMER_WALLET} className="flex items-center gap-2 text-xs text-gray-500 hover:text-orange-600 px-2">
              <Wallet className="w-4 h-4" /> Gom đơn thanh toán trước bằng ví UniEats — nạp ví tại đây
            </Link>
          )}
        </aside>
      </div>
    </div>
  );
}
