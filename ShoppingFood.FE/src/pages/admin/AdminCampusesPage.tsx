import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import toast from 'react-hot-toast';
import { Building2, Loader2, MapPinned, Plus, Save, School, Trash2 } from 'lucide-react';
import { campusService } from '../../services/GroupOrderService';
import type { CampusBuildingType, ICampusBuildingDto, ICampusDto, IUpsertCampusBuildingRequest, IUpsertCampusRequest } from '../../interfaces';
import { CampusMap } from '../../components/groupOrder/CampusMap';
import { BUILDING_TYPE_LABELS, getApiErrorMessage } from '../../components/groupOrder/groupOrderLabels';
import { formatCurrency } from '../../utils/formatters';

const EMPTY_CAMPUS: IUpsertCampusRequest = {
  code: '', name: '', shortName: '', address: '', description: '', latitude: null, longitude: null,
  minGroupMembers: 3, maxGroupMembers: 10, groupBaseShippingFee: 15000, lobbySurchargePerMember: 3000,
  roomSurchargePerMember: 8000, singleRoomDeliveryFee: 25000, isActive: true, sortOrder: 0,
};

const EMPTY_BUILDING: IUpsertCampusBuildingRequest = {
  code: '', name: '', shortName: '', buildingType: 'Dormitory', zone: '', description: '', dropPoint: '',
  floors: 5, allowRoomDelivery: true, mapX: 45, mapY: 45, mapWidth: 10, mapHeight: 9,
  latitude: null, longitude: null, isActive: true, sortOrder: 0,
};

const DRAFT_ID = '__draft__';

function toCampusForm(c: ICampusDto): IUpsertCampusRequest {
  return {
    code: c.code, name: c.name, shortName: c.shortName, address: c.address, description: c.description ?? '',
    latitude: c.latitude ?? null, longitude: c.longitude ?? null, minGroupMembers: c.minGroupMembers,
    maxGroupMembers: c.maxGroupMembers, groupBaseShippingFee: c.groupBaseShippingFee,
    lobbySurchargePerMember: c.lobbySurchargePerMember, roomSurchargePerMember: c.roomSurchargePerMember,
    singleRoomDeliveryFee: c.singleRoomDeliveryFee, isActive: c.isActive, sortOrder: c.sortOrder,
  };
}

function toBuildingForm(b: ICampusBuildingDto): IUpsertCampusBuildingRequest {
  return {
    code: b.code, name: b.name, shortName: b.shortName, buildingType: b.buildingType, zone: b.zone ?? '',
    description: b.description ?? '', dropPoint: b.dropPoint ?? '', floors: b.floors, allowRoomDelivery: b.allowRoomDelivery,
    mapX: b.mapX, mapY: b.mapY, mapWidth: b.mapWidth, mapHeight: b.mapHeight,
    latitude: b.latitude ?? null, longitude: b.longitude ?? null, isActive: b.isActive, sortOrder: b.sortOrder,
  };
}

const inputCls = 'w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-orange-500';

function Field({ label, children, className = '' }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-[11px] font-bold text-gray-500 uppercase">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

export function AdminCampusesPage() {
  const [campuses, setCampuses] = useState<ICampusDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [campusId, setCampusId] = useState<string | null>(null);
  const [campusForm, setCampusForm] = useState<IUpsertCampusRequest>(EMPTY_CAMPUS);
  const [buildingId, setBuildingId] = useState<string | null>(null);
  const [buildingForm, setBuildingForm] = useState<IUpsertCampusBuildingRequest | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  const campus = campuses.find((c) => c.id === campusId) ?? null;

  const load = useCallback(async (selectId?: string | null) => {
    try {
      const res = await campusService.adminGetCampuses();
      const list = res.data ?? [];
      setCampuses(list);
      const target = list.find((c) => c.id === (selectId ?? campusId)) ?? list[0] ?? null;
      setCampusId(target?.id ?? null);
      setCampusForm(target ? toCampusForm(target) : EMPTY_CAMPUS);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Không tải được danh sách trường.'));
    } finally {
      setLoading(false);
    }
  }, [campusId]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectCampus = (c: ICampusDto | null) => {
    setCampusId(c?.id ?? null);
    setCampusForm(c ? toCampusForm(c) : { ...EMPTY_CAMPUS });
    setBuildingId(null);
    setBuildingForm(null);
  };

  const selectBuilding = (b: ICampusBuildingDto) => {
    if (b.id === DRAFT_ID) return;
    setBuildingId(b.id);
    setBuildingForm(toBuildingForm(b));
  };

  const previewBuildings = useMemo(() => {
    const list = campus?.buildings ?? [];
    if (!buildingForm) return list;
    const draft: ICampusBuildingDto = {
      ...buildingForm,
      id: buildingId ?? DRAFT_ID,
      campusId: campus?.id ?? '',
      openGroupCount: 0,
      shortName: buildingForm.shortName || buildingForm.name || 'Mới',
      name: buildingForm.name || 'Tòa mới',
    };
    return buildingId ? list.map((b) => (b.id === buildingId ? draft : b)) : [...list, draft];
  }, [campus, buildingForm, buildingId]);

  const handleMapClick = (x: number, y: number) => {
    if (!buildingForm) {
      toast('Chọn một tòa (hoặc bấm "Thêm tòa") rồi click lên sơ đồ để đặt vị trí.', { icon: '📍' });
      return;
    }
    const w = buildingForm.mapWidth;
    const h = buildingForm.mapHeight;
    setBuildingForm({
      ...buildingForm,
      mapX: Math.round(Math.min(Math.max(0, x - w / 2), 100 - w) * 10) / 10,
      mapY: Math.round(Math.min(Math.max(0, y - h / 2), 100 - h) * 10) / 10,
    });
  };

  const saveCampus = async () => {
    setSaving('campus');
    try {
      const payload = { ...campusForm, code: campusForm.code.trim().toUpperCase() };
      const res = campusId ? await campusService.updateCampus(campusId, payload) : await campusService.createCampus(payload);
      toast.success(res.message || 'Đã lưu trường.');
      await load(res.data?.id ?? campusId);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSaving(null);
    }
  };

  const deleteCampus = async () => {
    if (!campusId || !window.confirm(`Xóa trường ${campus?.name}? Nếu đã có gom đơn, trường sẽ chỉ bị ẩn.`)) return;
    setSaving('campus-del');
    try {
      const res = await campusService.deleteCampus(campusId);
      toast.success(res.message || 'Đã xóa.');
      await load(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSaving(null);
    }
  };

  const saveBuilding = async () => {
    if (!campusId || !buildingForm) return;
    setSaving('building');
    try {
      const payload = { ...buildingForm, code: buildingForm.code.trim().toUpperCase() };
      const res = buildingId ? await campusService.updateBuilding(buildingId, payload) : await campusService.createBuilding(campusId, payload);
      toast.success(res.message || 'Đã lưu tòa nhà.');
      setBuildingId(res.data?.id ?? buildingId);
      await load(campusId);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSaving(null);
    }
  };

  const deleteBuilding = async () => {
    if (!buildingId || !window.confirm(`Xóa ${buildingForm?.name}? Nếu tòa đã có gom đơn sẽ chỉ bị ẩn.`)) return;
    setSaving('building-del');
    try {
      const res = await campusService.deleteBuilding(buildingId);
      toast.success(res.message || 'Đã xóa.');
      setBuildingId(null);
      setBuildingForm(null);
      await load(campusId);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSaving(null);
    }
  };

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>;

  const num = (v: string) => (v === '' ? 0 : Number(v));
  const optNum = (v: string) => (v === '' ? null : Number(v));
  const cf = campusForm;
  const bf = buildingForm;

  return (
    <div className="space-y-6 text-gray-900">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><School className="w-6 h-6 text-orange-500" /> Trường, Ký túc xá & Giảng đường</h1>
          <p className="text-sm text-gray-500">Quản lý khuôn viên, sơ đồ tòa nhà và phí ship gom đơn nội khu cho sinh viên.</p>
        </div>
        <button onClick={() => selectCampus(null)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600">
          <Plus className="w-4 h-4" /> Thêm trường
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {campuses.map((c) => (
          <button key={c.id} onClick={() => selectCampus(c)}
            className={`px-4 py-2 rounded-xl border text-sm font-semibold ${c.id === campusId ? 'bg-orange-500 text-white border-orange-500' : 'bg-white border-gray-200 text-gray-700 hover:border-orange-300'} ${!c.isActive ? 'opacity-60' : ''}`}>
            {c.shortName} <span className="font-normal opacity-75">· {c.buildings.length} điểm{!c.isActive ? ' · ẩn' : ''}</span>
          </button>
        ))}
      </div>

      {/* Campus form */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <h2 className="font-bold text-gray-900">{campusId ? `Thông tin ${campus?.name}` : 'Thêm trường mới'}</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Field label="Mã trường *"><input className={inputCls} value={cf.code} onChange={(e) => setCampusForm({ ...cf, code: e.target.value })} placeholder="FPTU-HL" /></Field>
          <Field label="Tên viết tắt"><input className={inputCls} value={cf.shortName} onChange={(e) => setCampusForm({ ...cf, shortName: e.target.value })} placeholder="FPTU" /></Field>
          <Field label="Tên trường *" className="sm:col-span-2"><input className={inputCls} value={cf.name} onChange={(e) => setCampusForm({ ...cf, name: e.target.value })} /></Field>
          <Field label="Địa chỉ *" className="sm:col-span-2"><input className={inputCls} value={cf.address} onChange={(e) => setCampusForm({ ...cf, address: e.target.value })} /></Field>
          <Field label="Vĩ độ"><input type="number" step="any" className={inputCls} value={cf.latitude ?? ''} onChange={(e) => setCampusForm({ ...cf, latitude: optNum(e.target.value) })} /></Field>
          <Field label="Kinh độ"><input type="number" step="any" className={inputCls} value={cf.longitude ?? ''} onChange={(e) => setCampusForm({ ...cf, longitude: optNum(e.target.value) })} /></Field>
          <Field label="Mô tả" className="sm:col-span-2 lg:col-span-4"><input className={inputCls} value={cf.description ?? ''} onChange={(e) => setCampusForm({ ...cf, description: e.target.value })} /></Field>
          <Field label="Số người tối thiểu"><input type="number" min={2} className={inputCls} value={cf.minGroupMembers} onChange={(e) => setCampusForm({ ...cf, minGroupMembers: num(e.target.value) })} /></Field>
          <Field label="Số người tối đa"><input type="number" min={2} className={inputCls} value={cf.maxGroupMembers} onChange={(e) => setCampusForm({ ...cf, maxGroupMembers: num(e.target.value) })} /></Field>
          <Field label="Phí ship cơ bản / đơn gom"><input type="number" min={0} step={500} className={inputCls} value={cf.groupBaseShippingFee} onChange={(e) => setCampusForm({ ...cf, groupBaseShippingFee: num(e.target.value) })} /></Field>
          <Field label="Phụ phí giao sảnh / người"><input type="number" min={0} step={500} className={inputCls} value={cf.lobbySurchargePerMember} onChange={(e) => setCampusForm({ ...cf, lobbySurchargePerMember: num(e.target.value) })} /></Field>
          <Field label="Phụ phí tận phòng / người"><input type="number" min={0} step={500} className={inputCls} value={cf.roomSurchargePerMember} onChange={(e) => setCampusForm({ ...cf, roomSurchargePerMember: num(e.target.value) })} /></Field>
          <Field label="Ship lẻ tận phòng (tham khảo)"><input type="number" min={0} step={500} className={inputCls} value={cf.singleRoomDeliveryFee} onChange={(e) => setCampusForm({ ...cf, singleRoomDeliveryFee: num(e.target.value) })} /></Field>
          <Field label="Thứ tự hiển thị"><input type="number" className={inputCls} value={cf.sortOrder} onChange={(e) => setCampusForm({ ...cf, sortOrder: num(e.target.value) })} /></Field>
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mt-5">
            <input type="checkbox" checked={cf.isActive} onChange={(e) => setCampusForm({ ...cf, isActive: e.target.checked })} /> Bật gom đơn cho trường
          </label>
        </div>
        <p className="text-xs text-gray-500">
          Ví dụ nhóm {cf.maxGroupMembers >= 5 ? 5 : cf.maxGroupMembers} người ship tận phòng: mỗi người trả ~{formatCurrency(Math.ceil(cf.groupBaseShippingFee / 5 / 500) * 500 + cf.roomSurchargePerMember)},
          shipper nhận {formatCurrency(cf.groupBaseShippingFee + cf.roomSurchargePerMember * 5)} cho 1 lượt giao.
        </p>
        <div className="flex gap-2 justify-end">
          {campusId && (
            <button onClick={deleteCampus} disabled={saving === 'campus-del'} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm text-red-600 border border-red-200 hover:bg-red-50">
              <Trash2 className="w-4 h-4" /> Xóa / ẩn trường
            </button>
          )}
          <button onClick={saveCampus} disabled={saving === 'campus'} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 disabled:opacity-60">
            {saving === 'campus' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Lưu trường
          </button>
        </div>
      </section>

      {campus && (
        <div className="grid xl:grid-cols-[1.4fr_1fr] gap-6 items-start">
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-bold text-gray-900 flex items-center gap-2"><MapPinned className="w-5 h-5 text-orange-500" /> Sơ đồ {campus.shortName}</h2>
              <button onClick={() => { setBuildingId(null); setBuildingForm({ ...EMPTY_BUILDING, sortOrder: campus.buildings.length }); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 text-orange-600 text-xs font-bold hover:bg-orange-100">
                <Plus className="w-3.5 h-3.5" /> Thêm tòa / KTX / cổng
              </button>
            </div>
            <p className="text-xs text-gray-500">Bấm vào tòa để sửa. Khi đang sửa, click vào vị trí bất kỳ trên sơ đồ để di chuyển tòa tới đó (chưa lưu cho tới khi bấm “Lưu tòa”).</p>
            <CampusMap buildings={previewBuildings} selectedId={buildingId ?? (buildingForm ? DRAFT_ID : null)} onSelect={selectBuilding} onMapClick={handleMapClick} />

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 border-b">
                    <th className="py-2 pr-2">Mã</th><th className="py-2 pr-2">Tên</th><th className="py-2 pr-2">Loại</th><th className="py-2 pr-2">Khu</th><th className="py-2 pr-2 text-center">Tầng</th><th className="py-2 text-center">Gom mở</th>
                  </tr>
                </thead>
                <tbody>
                  {campus.buildings.map((b) => (
                    <tr key={b.id} onClick={() => selectBuilding(b)}
                      className={`border-b border-gray-50 cursor-pointer hover:bg-orange-50/50 ${b.id === buildingId ? 'bg-orange-50' : ''} ${!b.isActive ? 'opacity-50' : ''}`}>
                      <td className="py-1.5 pr-2 font-mono text-xs">{b.code}</td>
                      <td className="py-1.5 pr-2 font-semibold">{b.name}</td>
                      <td className="py-1.5 pr-2 text-xs">{BUILDING_TYPE_LABELS[b.buildingType]}</td>
                      <td className="py-1.5 pr-2 text-xs text-gray-500">{b.zone || '—'}</td>
                      <td className="py-1.5 pr-2 text-center">{b.floors}</td>
                      <td className="py-1.5 text-center">{b.openGroupCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3 xl:sticky xl:top-4">
            <h2 className="font-bold text-gray-900 flex items-center gap-2"><Building2 className="w-5 h-5 text-orange-500" /> {bf ? (buildingId ? `Sửa ${bf.name}` : 'Thêm điểm mới') : 'Chọn một tòa để sửa'}</h2>
            {bf ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Mã *"><input className={inputCls} value={bf.code} onChange={(e) => setBuildingForm({ ...bf, code: e.target.value })} placeholder="DOM-A" /></Field>
                  <Field label="Loại">
                    <select className={inputCls} value={bf.buildingType} onChange={(e) => {
                      const type = e.target.value as CampusBuildingType;
                      setBuildingForm({ ...bf, buildingType: type, allowRoomDelivery: type === 'Dormitory' || type === 'Lecture' ? bf.allowRoomDelivery : false });
                    }}>
                      {(Object.keys(BUILDING_TYPE_LABELS) as CampusBuildingType[]).map((t) => <option key={t} value={t}>{BUILDING_TYPE_LABELS[t]}</option>)}
                    </select>
                  </Field>
                  <Field label="Tên đầy đủ *" className="col-span-2"><input className={inputCls} value={bf.name} onChange={(e) => setBuildingForm({ ...bf, name: e.target.value })} placeholder="KTX Dom A" /></Field>
                  <Field label="Tên trên sơ đồ"><input className={inputCls} value={bf.shortName} onChange={(e) => setBuildingForm({ ...bf, shortName: e.target.value })} placeholder="Dom A" /></Field>
                  <Field label="Khu (gom khung)"><input className={inputCls} value={bf.zone ?? ''} onChange={(e) => setBuildingForm({ ...bf, zone: e.target.value })} placeholder="Khu Ký túc xá" /></Field>
                  <Field label="Điểm giao sảnh" className="col-span-2"><input className={inputCls} value={bf.dropPoint ?? ''} onChange={(e) => setBuildingForm({ ...bf, dropPoint: e.target.value })} placeholder="Bàn lễ tân tầng 1" /></Field>
                  <Field label="Mô tả ngắn" className="col-span-2"><input className={inputCls} value={bf.description ?? ''} onChange={(e) => setBuildingForm({ ...bf, description: e.target.value })} /></Field>
                  <Field label="Số tầng"><input type="number" min={1} className={inputCls} value={bf.floors} onChange={(e) => setBuildingForm({ ...bf, floors: num(e.target.value) })} /></Field>
                  <Field label="Thứ tự"><input type="number" className={inputCls} value={bf.sortOrder} onChange={(e) => setBuildingForm({ ...bf, sortOrder: num(e.target.value) })} /></Field>
                  <Field label="X (%)"><input type="number" step={0.5} min={0} max={100} className={inputCls} value={bf.mapX} onChange={(e) => setBuildingForm({ ...bf, mapX: num(e.target.value) })} /></Field>
                  <Field label="Y (%)"><input type="number" step={0.5} min={0} max={100} className={inputCls} value={bf.mapY} onChange={(e) => setBuildingForm({ ...bf, mapY: num(e.target.value) })} /></Field>
                  <Field label="Rộng (%)"><input type="number" step={0.5} min={1} max={100} className={inputCls} value={bf.mapWidth} onChange={(e) => setBuildingForm({ ...bf, mapWidth: num(e.target.value) })} /></Field>
                  <Field label="Cao (%)"><input type="number" step={0.5} min={1} max={100} className={inputCls} value={bf.mapHeight} onChange={(e) => setBuildingForm({ ...bf, mapHeight: num(e.target.value) })} /></Field>
                  <Field label="Vĩ độ (tùy chọn)"><input type="number" step="any" className={inputCls} value={bf.latitude ?? ''} onChange={(e) => setBuildingForm({ ...bf, latitude: optNum(e.target.value) })} /></Field>
                  <Field label="Kinh độ (tùy chọn)"><input type="number" step="any" className={inputCls} value={bf.longitude ?? ''} onChange={(e) => setBuildingForm({ ...bf, longitude: optNum(e.target.value) })} /></Field>
                </div>
                <div className="flex flex-wrap gap-4 text-sm">
                  <label className="flex items-center gap-2"><input type="checkbox" checked={bf.allowRoomDelivery} disabled={bf.buildingType !== 'Dormitory' && bf.buildingType !== 'Lecture'}
                    onChange={(e) => setBuildingForm({ ...bf, allowRoomDelivery: e.target.checked })} /> Cho phép giao tận phòng</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={bf.isActive} onChange={(e) => setBuildingForm({ ...bf, isActive: e.target.checked })} /> Đang hoạt động</label>
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  {buildingId && (
                    <button onClick={deleteBuilding} disabled={saving === 'building-del'} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-red-600 border border-red-200 hover:bg-red-50">
                      <Trash2 className="w-4 h-4" /> Xóa
                    </button>
                  )}
                  <button onClick={() => { setBuildingId(null); setBuildingForm(null); }} className="px-3 py-2 rounded-xl text-sm border border-gray-200">Đóng</button>
                  <button onClick={saveBuilding} disabled={saving === 'building'} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 disabled:opacity-60">
                    {saving === 'building' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Lưu tòa
                  </button>
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-500">Bấm vào một tòa trên sơ đồ hoặc trong bảng, hoặc “Thêm tòa / KTX / cổng”.</p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
