import { useMemo, type MouseEvent } from 'react';
import type { CampusBuildingType, ICampusBuildingDto } from '../../interfaces';

interface CampusMapProps {
  buildings: ICampusBuildingDto[];
  selectedId?: string | null;
  onSelect?: (building: ICampusBuildingDto) => void;
  /** Only these types are clickable; others are dimmed. Omit to allow all. */
  selectableTypes?: CampusBuildingType[];
  showCounts?: boolean;
  /** Admin placement mode: click on empty map area returns percent coordinates. */
  onMapClick?: (x: number, y: number) => void;
  className?: string;
}

type Shape = 'dorm' | 'lecture' | 'gate' | 'road' | 'lake' | 'field';

function shapeOf(b: ICampusBuildingDto): Shape {
  if (b.buildingType === 'Dormitory') return 'dorm';
  if (b.buildingType === 'Lecture') return 'lecture';
  if (b.buildingType === 'Gate') return 'gate';
  const code = b.code.toUpperCase();
  const name = b.name.toLowerCase();
  if (code.includes('ROAD') || (b.mapWidth >= 50 && b.mapHeight <= 8)) return 'road';
  if (code.includes('LAKE') || name.startsWith('hồ')) return 'lake';
  return 'field';
}

const SHAPE_CLASSES: Record<Shape, string> = {
  dorm: 'bg-emerald-600 text-white border-emerald-700 shadow-md rounded-lg',
  lecture: 'bg-blue-600 text-white border-blue-700 shadow-md rounded-lg',
  gate: 'bg-slate-500 text-white border-slate-600 shadow rounded-lg',
  road: 'bg-slate-600/90 text-white/90 border-slate-700 rounded-md tracking-[0.25em] uppercase',
  lake: 'bg-sky-300/80 text-sky-900 border-sky-400 rounded-[50%]',
  field: 'bg-emerald-300/70 text-emerald-900 border-emerald-500 rounded-lg',
};

const ZONE_CLASSES: Record<'dorm' | 'lecture' | 'mixed', string> = {
  dorm: 'border-emerald-500/70 bg-emerald-100/40 text-emerald-800',
  lecture: 'border-blue-500/70 bg-blue-100/40 text-blue-800',
  mixed: 'border-slate-400/70 bg-white/30 text-slate-700',
};

export function CampusMap({ buildings, selectedId, onSelect, selectableTypes, showCounts = false, onMapClick, className = '' }: CampusMapProps) {
  const zones = useMemo(() => {
    const groups = new Map<string, ICampusBuildingDto[]>();
    buildings
      .filter((b) => b.zone && (b.buildingType === 'Dormitory' || b.buildingType === 'Lecture'))
      .forEach((b) => {
        const list = groups.get(b.zone!) ?? [];
        list.push(b);
        groups.set(b.zone!, list);
      });

    return Array.from(groups.entries()).map(([name, list]) => {
      const pad = 1.8;
      const minX = Math.max(0.5, Math.min(...list.map((b) => b.mapX)) - pad);
      const minY = Math.max(0.5, Math.min(...list.map((b) => b.mapY)) - pad - 3);
      const maxX = Math.min(99.5, Math.max(...list.map((b) => b.mapX + b.mapWidth)) + pad);
      const maxY = Math.min(99.5, Math.max(...list.map((b) => b.mapY + b.mapHeight)) + pad);
      const kinds = new Set(list.map((b) => b.buildingType));
      const kind: 'dorm' | 'lecture' | 'mixed' = kinds.size > 1 ? 'mixed' : kinds.has('Dormitory') ? 'dorm' : 'lecture';
      return { name, kind, left: minX, top: minY, width: maxX - minX, height: maxY - minY };
    });
  }, [buildings]);

  const handleBackgroundClick = (e: MouseEvent<HTMLDivElement>) => {
    if (!onMapClick) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    onMapClick(Math.round(x * 10) / 10, Math.round(y * 10) / 10);
  };

  const isSelectable = (b: ICampusBuildingDto) =>
    !!onSelect && b.isActive && (!selectableTypes || selectableTypes.includes(b.buildingType));

  return (
    <div className={className}>
      <div
        className={`relative w-full aspect-[16/10] rounded-2xl overflow-hidden border border-emerald-200 bg-gradient-to-br from-emerald-50 via-lime-50 to-sky-50 select-none ${onMapClick ? 'cursor-crosshair' : ''}`}
        style={{ backgroundImage: 'radial-gradient(circle, rgba(16,185,129,0.12) 1px, transparent 1px)', backgroundSize: '18px 18px' }}
        onClick={handleBackgroundClick}
      >
        <div className="absolute inset-[2.5%] rounded-xl border-2 border-dashed border-emerald-400/60 pointer-events-none" />

        {zones.map((z) => (
          <div
            key={z.name}
            className={`absolute rounded-xl border-2 pointer-events-none ${ZONE_CLASSES[z.kind]}`}
            style={{ left: `${z.left}%`, top: `${z.top}%`, width: `${z.width}%`, height: `${z.height}%` }}
          >
            <span className="absolute left-2 top-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wide whitespace-nowrap">
              {z.name}
            </span>
          </div>
        ))}

        {buildings.map((b) => {
          const shape = shapeOf(b);
          const selected = b.id === selectedId;
          const selectable = isSelectable(b);
          const dimmed = !!onSelect && !selectable && shape !== 'road' && shape !== 'lake' && shape !== 'field';
          return (
            <button
              key={b.id}
              type="button"
              title={`${b.name}${b.dropPoint ? ` — ${b.dropPoint}` : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                if (selectable) onSelect?.(b);
              }}
              className={`absolute flex flex-col items-center justify-center text-center border px-0.5 leading-tight transition-all duration-150
                ${SHAPE_CLASSES[shape]}
                ${selected ? '!bg-orange-500 !border-orange-600 !text-white ring-4 ring-orange-300 z-20 scale-[1.04]' : 'z-10'}
                ${selectable ? 'cursor-pointer hover:brightness-110 hover:scale-[1.03]' : onMapClick ? 'cursor-crosshair' : 'cursor-default'}
                ${dimmed ? 'opacity-50' : ''}
                ${!b.isActive ? 'opacity-40 grayscale' : ''}`}
              style={{ left: `${b.mapX}%`, top: `${b.mapY}%`, width: `${b.mapWidth}%`, height: `${b.mapHeight}%` }}
            >
              <span className={`font-bold truncate max-w-full ${shape === 'road' ? 'text-[8px] sm:text-[10px]' : 'text-[9px] sm:text-xs'}`}>
                {shape === 'road' ? b.name : b.shortName}
              </span>
              {b.description && shape !== 'road' && (
                <span className="hidden md:block text-[8px] opacity-80 truncate max-w-full">{b.description}</span>
              )}
              {showCounts && b.openGroupCount > 0 && (
                <span className="absolute -top-2 -right-2 min-w-5 h-5 px-1 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white shadow">
                  {b.openGroupCount}
                </span>
              )}
              {selected && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-white animate-ping" />}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-gray-600">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-600" /> Ký túc xá</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-600" /> Tòa học / Giảng đường</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-slate-500" /> Cổng</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-orange-500" /> Đang chọn</span>
        {showCounts && (
          <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded-full bg-orange-500 text-white text-[9px] font-bold flex items-center justify-center">2</span> Phòng gom đang mở</span>
        )}
      </div>
    </div>
  );
}
