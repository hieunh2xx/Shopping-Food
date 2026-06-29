import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChefHat, Truck, Shield, Star, History, RotateCcw, MapPin } from 'lucide-react';
import { useProducts, useCart, useAuth } from '../hooks';
import { ProductList } from '../components/product/ProductList';
import { RestaurantCard } from '../components/restaurant/RestaurantCard';
import { restaurantService } from '../services/RestaurantService';
import type { INearbyRestaurantDto } from '../interfaces';
import { ROUTES } from '../routes/routeConfig';
import { formatCurrency } from '../utils/formatters';

export function HomePage() {
  const { bestSellers, fetchBestSellers, isLoading } = useProducts();
  const { addItem } = useCart();
  const { isAuthenticated, user } = useAuth();

  const getPartnerRoute = () => {
    if (isAuthenticated && user?.role === 'Customer') {
      return ROUTES.SELLER_APPLY;
    }
    return ROUTES.REGISTER_SELLER;
  };

  // Nearby Restaurants State
  const [nearbyRestaurants, setNearbyRestaurants] = useState<INearbyRestaurantDto[]>([]);
  const [isNearbyLoading, setIsNearbyLoading] = useState(false);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [recentOrders] = useState([
    {
      id: 'mock-1',
      restaurantId: 'rest-1',
      restaurantName: 'Phở Bắc Hải',
      itemName: 'Phở bò đặc biệt',
      price: 55000,
      stockStatus: 'InStock',
      categoryId: 'cat-1',
      categoryName: 'Món nước',
      primaryImageUrl: '',
      description: '',
      images: [],
      toppings: [],
      sizes: [],
      createdAt: '',
      isHidden: false,
      averageRating: 5,
      reviewCount: 10,
      isFreeship: true,
      availableFrom: null,
      availableTo: null,
      isAvailableNow: true,
      status: 'Active'
    },
    {
      id: 'mock-2',
      restaurantId: 'rest-2',
      restaurantName: 'Cơm Tấm Cali',
      itemName: 'Cơm sườn bì chả',
      price: 65000,
      stockStatus: 'InStock',
      categoryId: 'cat-2',
      categoryName: 'Cơm',
      primaryImageUrl: '',
      description: '',
      images: [],
      toppings: [],
      sizes: [],
      createdAt: '',
      isHidden: false,
      averageRating: 4.5,
      reviewCount: 42,
      isFreeship: false,
      availableFrom: null,
      availableTo: null,
      isAvailableNow: true,
      status: 'Active'
    }
  ]);

  useEffect(() => {
    fetchBestSellers(8);
  }, [fetchBestSellers]);

  useEffect(() => {
    fetchNearbyRestaurants();
  }, []);

  const fetchNearbyRestaurants = () => {
    setIsNearbyLoading(true);
    setLocationStatus('loading');

    // Mặc định: Hồ Chí Minh
    const defaultLocation = { latitude: 10.7769, longitude: 106.7009 };

    if (!navigator.geolocation) {
      setLocationStatus('error');
      loadNearby(defaultLocation.latitude, defaultLocation.longitude);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationStatus('success');
        loadNearby(position.coords.latitude, position.coords.longitude);
      },
      () => {
        setLocationStatus('error');
        loadNearby(defaultLocation.latitude, defaultLocation.longitude);
      },
      { timeout: 5000 }
    );
  };

  const loadNearby = async (lat: number, lng: number) => {
    try {
      const res = await restaurantService.getNearby({
        latitude: lat,
        longitude: lng,
        radiusInKm: 10,
        take: 8
      });
      if (!res.error && res.data) {
        setNearbyRestaurants(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsNearbyLoading(false);
    }
  };

  return (
    <div className="space-y-0 bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gray-50">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-gray-50 to-gray-50" />
        <div className="absolute top-20 right-20 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 lg:py-32">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-600 text-xs font-medium mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
              Giao hàng siêu tốc 30 phút
            </div>

            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Đặt món ngon
              <br />
              <span className="bg-gradient-to-r from-orange-500 via-orange-600 to-yellow-500 bg-clip-text text-transparent">
                chỉ trong vài giây
              </span>
            </h1>

            <p className="text-lg text-gray-600 mb-8 max-w-lg leading-relaxed">
              Khám phá hàng ngàn nhà hàng, quán ăn ngon nhất. Đặt hàng dễ dàng, giao tận nơi nhanh chóng.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                to={ROUTES.PRODUCTS}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all hover:scale-105 active:scale-[0.98]"
              >
                Xem thực đơn
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to={getPartnerRoute()}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-gray-300 text-gray-700 hover:text-orange-600 hover:border-orange-400 hover:bg-gray-50 font-medium transition-all"
              >
                Trở thành đối tác
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: ChefHat, label: '1000+ Nhà hàng', desc: 'Đa dạng ẩm thực', color: 'orange' },
            { icon: Truck, label: 'Giao nhanh 30p', desc: 'Luôn nóng hổi', color: 'blue' },
            { icon: Shield, label: 'Thanh toán an toàn', desc: 'Bảo mật tuyệt đối', color: 'green' },
            { icon: Star, label: 'Đánh giá thực', desc: 'Từ khách hàng', color: 'yellow' },
          ].map((feature, i) => (
            <div
              key={i}
              className="group p-5 rounded-2xl bg-white border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md transition-all duration-300"
            >
              <div className={`w-10 h-10 rounded-xl bg-${feature.color}-50 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                <feature.icon className={`w-5 h-5 text-${feature.color}-500`} />
              </div>
              <p className="text-sm font-semibold text-gray-900">{feature.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Recently Ordered (Buy Again) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 border-t border-gray-100">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
              <History className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Món bạn đã thử</h2>
              <p className="text-sm text-gray-500 mt-1">Đặt lại những món ngon bạn từng ăn</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {recentOrders.map((product) => (
            <div key={product.id} className="bg-white rounded-2xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
              <div className="flex gap-4">
                <div className="w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                  <span className="text-3xl">🍲</span>
                </div>
                <div className="flex flex-col flex-1">
                  <h3 className="font-semibold text-gray-900 line-clamp-1">{product.itemName}</h3>
                  <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{product.restaurantName}</p>
                  <p className="font-bold text-orange-600 mt-auto">{formatCurrency(product.price)}</p>
                </div>
              </div>
              <button 
                onClick={() => addItem(product, 1)}
                className="mt-4 w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-orange-50 text-orange-600 font-medium hover:bg-orange-100 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Mua lại
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Best Sellers */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Món bán chạy</h2>
            <p className="text-sm text-gray-500 mt-1">Được yêu thích nhất tuần này</p>
          </div>
          <Link
            to={ROUTES.PRODUCTS}
            className="flex items-center gap-1 text-sm text-orange-600 hover:text-orange-500 font-medium transition-colors"
          >
            Xem tất cả
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <ProductList products={bestSellers} isLoading={isLoading} emptyMessage="Chưa có dữ liệu sản phẩm" />
      </section>

      {/* Nearby Restaurants */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 border-t border-gray-100">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Quán ngon quanh bạn</h2>
              <p className="text-sm text-gray-500 mt-1">
                {locationStatus === 'loading' ? 'Đang xác định vị trí...' : 
                 locationStatus === 'error' ? 'Sử dụng vị trí mặc định (Hồ Chí Minh)' : 
                 'Các nhà hàng gần vị trí của bạn nhất'}
              </p>
            </div>
          </div>
        </div>

        {isNearbyLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : nearbyRestaurants.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {nearbyRestaurants.map(rest => (
              <RestaurantCard key={rest.id} restaurant={rest} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-2xl border border-gray-100">
            <p className="text-gray-500">Chưa tìm thấy quán nào trong bán kính 10km quanh bạn.</p>
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-orange-500 to-orange-600 p-8 lg:p-12 shadow-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
          <div className="relative max-w-lg">
            <h3 className="text-2xl lg:text-3xl font-bold text-white mb-3">
              Trở thành đối tác bán hàng
            </h3>
            <p className="text-orange-50 mb-6">
              Tiếp cận hàng triệu khách hàng tiềm năng. Đăng ký ngay hôm nay và bắt đầu kinh doanh.
            </p>
            <Link
              to={getPartnerRoute()}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-orange-600 font-semibold hover:bg-orange-50 transition-colors shadow-lg"
            >
              Đăng ký ngay
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
