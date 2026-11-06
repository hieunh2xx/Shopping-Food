import { useMemo, useState } from 'react';
import { Building2, CheckCircle2, DoorOpen, Home } from 'lucide-react';
import type { CampusBuildingType, ICampusBuildingDto } from '../../interfaces';
import { formatCurrency } from '../../utils/formatters';

interface BuildingPickerProps {
  buildings: ICampusBuildingDto[];
  selectableTypes: CampusBuildingType[];
  selectedId?: string | null;
  onSelect: (building: ICampusBuildingDto) => void;
  surcharge: number;
}

const FILTERS: { key: 'all' | CampusBuildingType; label: string; icon: typeof Home }[] = [
  { key: 'all', label: 'Tất cả khu vực', icon: Building2 },
  { key: 'Dormitory', label: 'Ký túc xá', icon: Home },
  { key: 'Lecture', label: 'Tòa giảng đường', icon: Building2 },
  { key: 'Gate', label: 'Cổng trường', icon: DoorOpen },
];

export function BuildingPicker({ buildings, selectableTypes, selectedId, onSelect, surcharge }: BuildingPickerProps) {
  const [filter, setFilter] = useState<'all' | CampusBuildingType>('all');

  const candidates = useMemo(
    () => buildings.filter((b) => b.isActive && selectableTypes.includes(b.buildingType)),
    [buildings, selectableTypes]
  );
  const visible = filter === 'all' ? candidates : candidates.filter((b) => b.buildingType === filter);
  const filters = FILTERS.filter((f) => f.key === 'all' || selectableTypes.includes(f.key));

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-3">
        {filters.map((f) => {
          const count = f.key === 'all' ? candidates.length : candidates.filter((b) => b.buildingType === f.key).length;
          const Icon = f.icon;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                filter === f.key ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {f.label} ({count})
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {visible.map((b) => {
          const selected = b.id === selectedId;
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => onSelect(b)}
              className={`relative text-left p-2.5 rounded-xl border transition-all ${
                selected ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/30' : 'bg-white border-gray-200 text-gray-900 hover:border-orange-300 hover:shadow-sm'
              }`}
            >
              {selected && <CheckCircle2 className="absolute top-2 right-2 w-4 h-4" />}
              <p className="text-xs font-bold pr-5 leading-snug">{b.name}</p>
              <p className={`text-[11px] mt-0.5 truncate ${selected ? 'text-orange-50' : 'text-gray-400'}`}>{b.dropPoint || b.description || '—'}</p>
              <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${selected ? 'bg-white/20' : 'bg-orange-50 text-orange-600'}`}>
                  {surcharge > 0 ? `+${formatCurrency(surcharge)}` : 'Miễn phụ phí'}
                </span>
                {b.openGroupCount > 0 && (
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${selected ? 'bg-white/20' : 'bg-emerald-50 text-emerald-700'}`}>
                    {b.openGroupCount} phòng mở
                  </span>
                )}
              </div>
            </button>
          );
        })}
        {visible.length === 0 && (
          <p className="col-span-full text-sm text-gray-400 py-4 text-center">Không có điểm giao phù hợp với hình thức giao đã chọn.</p>
        )}
      </div>
    </div>
  );
}
