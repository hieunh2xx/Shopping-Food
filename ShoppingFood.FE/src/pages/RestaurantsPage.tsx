import { useState, useEffect } from 'react';
import { restaurantService } from '../services/RestaurantService';
import type { INearbyRestaurantDto } from '../interfaces';
import { RestaurantCard } from '../components/restaurant/RestaurantCard';
import { MapPin, Search, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../routes/routeConfig';
import { Input, Pagination } from '../components/common';

/**
 * Trang Khám Phá Danh Sách Nhà Hàng (RestaurantsPage).
 * Hiển thị tất cả nhà hàng đối tác quanh khu vực người dùng:
 * - Tự động định vị GPS để tìm các quán ăn gần nhất
 * - Ô tìm kiếm nhanh theo tên quán hoặc địa chỉ
 * - Lưới thẻ nhà hàng kèm phân trang.
 */
export function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<INearbyRestaurantDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [take, setTake] = useState(12);

  useEffect(() => {
    fetchRestaurants();
  }, []);

  /**
   * Lấy tọa độ GPS người dùng và gọi API lấy danh sách nhà hàng lân cận.
   */
  const fetchRestaurants = () => {
    setIsLoading(true);


    const defaultLocation = { latitude: 10.7769, longitude: 106.7009 }; // Default to HCMC

    if (!navigator.geolocation) {
      loadRestaurants(defaultLocation.latitude, defaultLocation.longitude);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        loadRestaurants(position.coords.latitude, position.coords.longitude);
      },
      () => {
        loadRestaurants(defaultLocation.latitude, defaultLocation.longitude);
      },
      { timeout: 5000 }
    );
  };

  const loadRestaurants = async (lat: number, lng: number) => {
    try {
      const res = await restaurantService.getNearby({
        latitude: lat, 
        longitude: lng,
        radiusInKm: 50, // Vẫn giữ bán kính rộng để có thể lấy nhiều kết quả
        take: 100 
      });
      if (!res.error && res.data) {
        setRestaurants(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRestaurants = restaurants.filter(r => 
    r.restaurantName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    r.restaurantAddress?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // const totalPages = Math.ceil(filteredRestaurants.length / take);
  const paginatedRestaurants = filteredRestaurants.slice((page - 1) * take, page * take);

  // Reset page when search query changes
  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <Link to={ROUTES.HOME} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-orange-600 mb-6 transition-colors font-medium">
          <ArrowLeft className="w-4 h-4" /> Về trang chủ
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <MapPin className="w-8 h-8 text-orange-500" />
              Khám phá Nhà hàng
            </h1>
            <p className="text-gray-500 mt-2">Tìm kiếm các địa điểm ăn uống tuyệt vời dành cho bạn</p>
          </div>
          
          <div className="w-full md:w-96 relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input 
              type="text" 
              placeholder="Tìm tên nhà hàng, địa chỉ..." 
              className="pl-10 bg-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredRestaurants.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Không tìm thấy nhà hàng</h3>
            <p className="text-gray-500">Thử thay đổi từ khóa tìm kiếm của bạn.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {paginatedRestaurants.map(rest => (
                <RestaurantCard key={rest.id} restaurant={rest} />
              ))}
            </div>
            <div className="mt-8 flex justify-center">
              <Pagination 
                currentPage={page} 
                totalPages={Math.ceil(filteredRestaurants.length / take)} 
                onPageChange={setPage} 
                pageSize={take}
                pageSizeOptions={[12, 24, 48]}
                onPageSizeChange={(size) => { setTake(size); setPage(1); }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
