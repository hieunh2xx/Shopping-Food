import { Link } from 'react-router-dom';
import { Star, Clock, Truck, ShieldCheck } from 'lucide-react';
import type { INearbyRestaurantDto } from '../../interfaces';
import { formatCurrency } from '../../utils/formatters';

interface Props {
  restaurant: INearbyRestaurantDto;
}

export function RestaurantCard({ restaurant }: Props) {
  return (
    <Link
      to={`/restaurant/${restaurant.id}`}
      className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-300 flex flex-col"
    >
      <div className="relative h-40 bg-gray-100 overflow-hidden">
        {restaurant.logoUrl ? (
          <img
            src={restaurant.logoUrl}
            alt={restaurant.restaurantName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-orange-50 text-orange-200">
            <span className="text-4xl">🏪</span>
          </div>
        )}
        <div className="absolute top-3 left-3 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-xs font-bold text-gray-900 shadow-sm flex items-center gap-1">
          <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
          {restaurant.averageRating > 0 ? restaurant.averageRating.toFixed(1) : 'Mới'}
          <span className="text-gray-400 font-normal">({restaurant.reviewCount})</span>
        </div>
        <div className="absolute bottom-3 right-3 px-2 py-1 bg-orange-500 rounded-lg text-xs font-bold text-white shadow-sm">
          {restaurant.distanceKm.toFixed(1)} km
        </div>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-bold text-gray-900 text-lg line-clamp-1 mb-1 group-hover:text-orange-600 transition-colors flex items-center gap-1.5">
          {restaurant.restaurantName}
          {restaurant.isVerified && (
            <ShieldCheck className="w-5 h-5 text-blue-500 flex-shrink-0" title="Quán Ăn Chuẩn" />
          )}
        </h3>
        <div className="mb-3 text-sm text-gray-500 line-clamp-1">{restaurant.restaurantAddress}</div>

        <div className="mt-auto pt-3 border-t border-gray-50 flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-orange-500" />
            <span>{restaurant.openingTime?.substring(0, 5) || '08:00'} - {restaurant.closingTime?.substring(0, 5) || '22:00'}</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium">
            <Truck className="w-4 h-4 text-blue-500" />
            {restaurant.shippingFee === 0 ? (
              <span className="text-green-600">Freeship</span>
            ) : (
              <span>{formatCurrency(restaurant.shippingFee)}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
