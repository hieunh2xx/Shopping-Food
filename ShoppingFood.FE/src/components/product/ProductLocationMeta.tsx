import { MapPin, Navigation } from 'lucide-react';
import { useUserLocation } from '../../hooks';
import { formatDistanceKm, haversineDistanceKm } from '../../utils/formatters';

interface ProductLocationMetaProps {
  restaurantAddress?: string | null;
  restaurantLatitude?: number | null;
  restaurantLongitude?: number | null;
  className?: string;
}

/**
 * Thành Phần Hiển Thị Khoảng Cách & Địa Chỉ Món Ăn/Quán Ăn (ProductLocationMeta).
 * Tự động tính toán khoảng cách theo km từ tọa độ hiện tại của người dùng đến tọa độ nhà hàng bằng công thức Haversine.
 */
export function ProductLocationMeta({
  restaurantAddress,
  restaurantLatitude,
  restaurantLongitude,
  className = '',
}: ProductLocationMetaProps) {
  const { hasGps, latitude, longitude, isLoading } = useUserLocation();

  if (isLoading) {
    return (
      <p className={`flex items-center gap-1 text-[11px] text-gray-400 ${className}`}>
        <MapPin className="w-3 h-3 shrink-0" />
        <span className="truncate">Đang xác định vị trí…</span>
      </p>
    );
  }

  const address = restaurantAddress?.trim();
  const canComputeDistance =
    hasGps &&
    latitude != null &&
    longitude != null &&
    restaurantLatitude != null &&
    restaurantLongitude != null &&
    Number.isFinite(restaurantLatitude) &&
    Number.isFinite(restaurantLongitude);

  if (canComputeDistance) {
    const km = haversineDistanceKm(
      latitude,
      longitude,
      restaurantLatitude,
      restaurantLongitude
    );
    return (
      <div className={`space-y-0.5 ${className}`}>
        <p
          className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold"
          title="Khoảng cách từ vị trí hiện tại của bạn đến quán"
        >
          <Navigation className="w-3 h-3 shrink-0" />
          <span className="truncate">{formatDistanceKm(km)}</span>
        </p>
        {address ? (
          <p className="flex items-center gap-1 text-[10px] text-gray-400" title={address}>
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">{address}</span>
          </p>
        ) : null}
      </div>
    );
  }

  // Khi GPS bật nhưng quán chưa có tọa độ: vẫn hiển thị địa chỉ quán
  if (hasGps && address) {
    return (
      <p
        className={`flex items-center gap-1 text-[11px] text-gray-500 ${className}`}
        title={`${address} (Quán chưa cấu hình GPS nên chưa tính được khoảng cách)`}
      >
        <MapPin className="w-3 h-3 shrink-0 text-orange-400" />
        <span className="truncate">{address}</span>
      </p>
    );
  }

  if (address) {
    return (
      <p
        className={`flex items-center gap-1 text-[11px] text-gray-500 ${className}`}
        title={
          hasGps
            ? address
            : `${address} — Bật GPS để xem khoảng cách`
        }
      >
        <MapPin className="w-3 h-3 shrink-0 text-orange-400" />
        <span className="truncate">{address}</span>
      </p>
    );
  }

  return (
    <p className={`flex items-center gap-1 text-[11px] text-gray-400 ${className}`}>
      <MapPin className="w-3 h-3 shrink-0" />
      <span className="truncate">
        {hasGps ? 'Quán chưa có GPS' : 'Chưa có địa chỉ · bật GPS để xem khoảng cách'}
      </span>
    </p>
  );
}

