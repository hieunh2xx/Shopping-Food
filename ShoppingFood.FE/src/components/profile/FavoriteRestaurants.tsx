import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { restaurantService } from '../../services/RestaurantService';
import type { IFavoriteRestaurantDto } from '../../interfaces';
import { RestaurantCard } from '../restaurant/RestaurantCard';

/**
 * Danh Sách Nhà Hàng / Quán Ăn Yêu Thích Của Người Dùng (FavoriteRestaurants).
 * Cho phép khách hàng xem lại các quán ăn mình đã bấm yêu thích (Heart) để tiện truy cập nhanh và đặt hàng.
 */
export function FavoriteRestaurants() {
  const [favorites, setFavorites] = useState<IFavoriteRestaurantDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchFavorites();
  }, []);

  /**
   * Tải danh sách quán ăn yêu thích từ API.
   */
  const fetchFavorites = async () => {
    try {
      const res = await restaurantService.getFavorites({ take: 20 });
      if (!res.error && res.data) {
        setFavorites(res.data);
      }
    } catch (error) {
      console.error('Lỗi tải danh sách yêu thích:', error);
    } finally {
      setIsLoading(false);
    }
  };


  if (isLoading) {
    return (
      <div className="flex justify-center p-10">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="text-center py-10">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Heart className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-gray-500 font-medium">Bạn chưa có quán ăn yêu thích nào.</p>
        <p className="text-sm text-gray-400 mt-1">Hãy khám phá và lưu lại những quán ngon nhé!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {favorites.map(rest => (
        <RestaurantCard 
          key={rest.restaurantId} 
          restaurant={{
            id: rest.restaurantId,
            restaurantName: rest.restaurantName,
            restaurantAddress: rest.address,
            logoUrl: rest.logoUrl,
            averageRating: 0,
            reviewCount: 0,
            distanceKm: 0,
            shippingFee: 0,
            isMall: rest.isMall,
          }} 
        />
      ))}
    </div>
  );
}
