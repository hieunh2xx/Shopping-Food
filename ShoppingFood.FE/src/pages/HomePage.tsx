import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ChefHat, Truck, Shield, Star, History, RotateCcw, MapPin, TrendingUp, Flame, Bike, UtensilsCrossed } from 'lucide-react';
import { useProducts, useCart, useAuth, useCategories } from '../hooks';
import { FlashSaleSection } from '../components/promotions/FlashSaleSection';
import { BuyXGetYSection } from '../components/promotions/BuyXGetYSection';
import { RecommendationSection } from '../components/recommendations/RecommendationSection';
import { restaurantService } from '../services/RestaurantService';
import { orderService } from '../services/OrderService';
import { adminService } from '../services';
import type { INearbyRestaurantDto } from '../interfaces';
import { ROUTES } from '../routes/routeConfig';
import { formatCurrency } from '../utils/formatters';
import { SectionHeader } from '../components/ui/SectionHeader';
import { CarouselSlider } from '../components/ui/CarouselSlider';

export function HomePage() {
  const navigate = useNavigate();
  const { bestSellers, fetchBestSellers, isLoading } = useProducts();
  const [globalCategories, setGlobalCategories] = useState<any[]>([]);
  const { addItem } = useCart();
  const { isAuthenticated, user } = useAuth();
  
  const [activeCategory, setActiveCategory] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

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
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    fetchGlobalCategories();
  }, []);

  const fetchGlobalCategories = async () => {
    try {
      const res = await adminService.getGlobalMenuCategories(false);
      if (!res.error && res.data) {
        setGlobalCategories(res.data);
      }
    } catch {
      console.error('Lỗi tải danh mục toàn sàn');
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchRecentOrders();
    }
  }, [isAuthenticated]);

  const fetchRecentOrders = async () => {
    try {
      const res = await orderService.getRecentItems();
      if (!res.error && res.data) {
        const mappedData = res.data.map((item: any) => ({
          ...item,
          id: item.productId,
          price: item.unitPrice,
          primaryImageUrl: item.imageUrl,
        }));
        setRecentOrders(mappedData);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBestSellers(8);
  }, [fetchBestSellers]);

  useEffect(() => {
    fetchNearbyRestaurants();
  }, []);

  const fetchNearbyRestaurants = () => {
    setIsNearbyLoading(true);
    setLocationStatus('loading');

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
    <div className="bg-[#f5f5f5] min-h-screen font-sans">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-500 via-orange-400 to-amber-400">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full translate-x-32 -translate-y-32" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full -translate-x-20 translate-y-20" />
        <div className="absolute top-8 right-64 w-24 h-24 bg-white/10 rounded-full" />

        <div className="max-w-7xl mx-auto px-6 py-14 flex items-center justify-between relative z-10">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              Giao hàng trong 30 phút
            </div>
            <h1 className="text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-3">
              Đặt món ngon<br /><span className="text-yellow-200">chỉ trong vài giây</span>
            </h1>
            <p className="text-white/80 text-base mb-8 leading-relaxed">
              Hơn 5,000+ nhà hàng · Giao hàng nhanh · Ưu đãi mỗi ngày
            </p>

            <Link 
              to={ROUTES.PRODUCTS}
              className="inline-flex items-center gap-3 px-8 py-4 bg-gray-900 text-white rounded-2xl font-bold text-lg hover:bg-gray-800 transition-all hover:scale-105 shadow-xl shadow-gray-900/20"
            >
              Khám phá thực đơn
              <ArrowRight className="w-5 h-5" />
            </Link>

            <div className="flex items-center gap-6 mt-6">
              {[["5,000+", "Nhà hàng"], ["2M+", "Khách hàng"], ["4.9★", "Đánh giá"]].map(([v, l]) => (
                <div key={l} className="text-center">
                  <div className="text-white font-bold text-lg">{v}</div>
                  <div className="text-white/70 text-xs">{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Hero Categories (Horizontal Scrollable Collage) */}
          <div className="hidden lg:block w-[400px] xl:w-[500px] shrink-0 relative z-10 py-2">
            <CarouselSlider itemWidth="w-full" autoPlay={true} autoPlayInterval={4000}>
              {Array.from({ length: Math.ceil(globalCategories.length / 3) }).map((_, chunkIdx) => {
                const chunk = globalCategories.slice(chunkIdx * 3, chunkIdx * 3 + 3);
                return (
                  <div key={chunkIdx} className="grid grid-cols-2 gap-3 h-full">
                    {chunk.map((c, i) => (
                      <button
                        key={c.id}
                        onClick={() => navigate(`${ROUTES.PRODUCTS}?globalCategoryId=${c.id}`)}
                        className={`group relative rounded-2xl overflow-hidden shadow-xl cursor-pointer hover:shadow-2xl transition-all ${
                          i === 0 ? "col-span-2 h-36" : "h-28"
                        }`}
                      >
                        {c.imageUrl ? (
                          <img src={c.imageUrl} alt={c.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center text-3xl">
                            🍽️
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-3">
                          <span className="text-white font-bold text-sm drop-shadow-md text-left line-clamp-1">{c.name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                );
              })}
            </CarouselSlider>
          </div>

        </div>
      </section>



      <div className="max-w-7xl mx-auto px-6 py-8 space-y-12">
        {/* Flash Sale */}
        <FlashSaleSection />

        {/* Buy X Get Y */}
        <BuyXGetYSection />

        {/* Gợi ý cho bạn */}
        {isAuthenticated && (
          <RecommendationSection 
            latitude={locationStatus === 'success' ? 10.7769 : undefined} 
            longitude={locationStatus === 'success' ? 106.7009 : undefined} 
          />
        )}

        {/* ── Món bán chạy hôm nay ── */}
        <section>
          <SectionHeader
            icon={<div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center"><Flame className="w-4 h-4 text-orange-500" /></div>}
            title="Món bán chạy hôm nay"
            sub="Những món được yêu thích nhất trong khu vực của bạn"
            action="Xem tất cả"
            onActionClick={() => navigate(ROUTES.PRODUCTS)}
          />

          {isLoading ? (
            <div className="flex justify-center py-10 w-full">
              <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : bestSellers.length > 0 ? (
            <CarouselSlider itemWidth="w-[80%] sm:w-1/2 md:w-1/4 lg:w-1/6">
              {bestSellers.map((item, idx) => (
                <Link to={`/products/${item.id}`} key={item.id} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all group cursor-pointer h-full flex flex-col">
                  <div className="relative h-36 overflow-hidden bg-gray-100 shrink-0">
                    {item.primaryImageUrl ? (
                      <img src={item.primaryImageUrl} alt={item.itemName || item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">🍲</div>
                    )}
                    <div className="absolute top-2 left-2 flex items-center gap-1 bg-white/90 text-orange-500 text-[11px] font-bold px-2 py-0.5 rounded-full">
                      <TrendingUp className="w-3 h-3" />#{idx + 1}
                    </div>
                  </div>
                  <div className="p-3 flex flex-col flex-1">
                    <p className="text-[11px] text-gray-400 truncate">{item.restaurantName}</p>
                    <p className="text-sm font-semibold text-gray-800 line-clamp-2 mt-0.5 min-h-[40px] leading-tight">{item.itemName || item.name}</p>
                    <div className="flex items-center justify-between mt-auto pt-2">
                      <span className="text-orange-500 font-bold text-sm">{formatCurrency(item.price)}</span>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />{item.averageRating.toFixed(1)}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </CarouselSlider>
          ) : (
            <div className="w-full text-center py-8 text-gray-500">Không có món ăn nào</div>
          )}
        </section>

        {/* ── Quán gần đây ── */}
        <section>
          <SectionHeader
            icon={<div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center"><MapPin className="w-4 h-4 text-blue-500" /></div>}
            title="Quán gần bạn"
            sub={locationStatus === 'loading' ? 'Đang xác định vị trí...' : locationStatus === 'error' ? 'Sử dụng vị trí mặc định' : 'Nhà hàng đang mở · Giao hàng nhanh trong khu vực'}
            action="Xem tất cả"
            onActionClick={() => navigate(ROUTES.RESTAURANTS)}
          />

          {isNearbyLoading ? (
             <div className="flex justify-center py-10 w-full">
               <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
             </div>
          ) : nearbyRestaurants.length > 0 ? (
            <CarouselSlider itemWidth="w-[85%] sm:w-1/2 lg:w-1/4">
              {nearbyRestaurants.map(r => (
                <div key={r.id} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition-all group flex flex-col h-full">
                  <Link to={`/restaurant/${r.id}`} className="relative h-44 overflow-hidden block bg-gray-100 shrink-0">
                    {r.logoUrl ? (
                      <img src={r.logoUrl} alt={r.restaurantName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">🏪</div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                      {r.shippingFee === 0 && (
                        <span className="bg-green-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-sm">Freeship</span>
                      )}
                    </div>
                    <div className="absolute bottom-3 left-3 flex items-center gap-1 text-white text-xs font-semibold">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      {r.averageRating > 0 ? r.averageRating.toFixed(1) : 'Mới'} <span className="text-white/70">({r.reviewCount})</span>
                    </div>
                  </Link>
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="font-bold text-gray-800 line-clamp-1">{r.restaurantName}</h3>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{r.restaurantAddress}</p>
                    <div className="flex items-center gap-3 mt-3 text-xs text-gray-500 flex-wrap">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-orange-400" />{r.distanceKm.toFixed(1)} km</span>
                      <span className="flex items-center gap-1 text-green-500 font-medium"><Bike className="w-3 h-3" />Giao nhanh</span>
                    </div>
                    <Link
                      to={`/restaurant/${r.id}`}
                      className="mt-auto pt-4 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-orange-200 text-orange-500 text-xs font-semibold hover:bg-orange-50 hover:border-orange-400 transition-all"
                    >
                      <UtensilsCrossed className="w-3.5 h-3.5" />
                      Xem thực đơn
                    </Link>
                  </div>
                </div>
              ))}
            </CarouselSlider>
          ) : (
             <div className="w-full text-center py-12 bg-gray-50 rounded-2xl border border-gray-100 text-gray-500">
               Chưa tìm thấy quán nào trong bán kính 10km quanh bạn.
             </div>
          )}
        </section>

        {/* ── Món bạn đã thử ── */}
        {recentOrders.length > 0 && (
          <section>
            <SectionHeader
              icon={<div className="w-8 h-8 rounded-lg bg-yellow-100 flex items-center justify-center"><History className="w-4 h-4 text-yellow-600" /></div>}
              title="Món bạn đã thử"
              sub="Đặt lại những món ngon bạn từng ăn"
              action="Xem tất cả lịch sử"
              onActionClick={() => navigate(ROUTES.ORDERS)}
            />
            <CarouselSlider itemWidth="w-[85%] sm:w-1/2 lg:w-1/3 xl:w-1/4">
              {recentOrders.map((product) => (
                <div key={product.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-4 h-full flex flex-col">
                  <div className="flex gap-4">
                    <div className="w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                      {product.primaryImageUrl ? (
                        <img src={product.primaryImageUrl} alt={product.itemName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-3xl">🍲</span>
                      )}
                    </div>
                    <div className="flex flex-col flex-1">
                      <h3 className="font-semibold text-gray-900 line-clamp-1">{product.itemName}</h3>
                      <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{product.restaurantName}</p>
                      <p className="font-bold text-orange-500 mt-auto">{formatCurrency(product.price)}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => addItem(product, 1)}
                    className="mt-auto pt-4 w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-orange-50 text-orange-600 font-medium hover:bg-orange-100 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Mua lại
                  </button>
                </div>
              ))}
            </CarouselSlider>
          </section>
        )}

        {/* ── CTA Banners ── */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-4">
          <div className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-3xl px-8 py-8 flex flex-col justify-between overflow-hidden relative min-h-[220px]">
            <div className="absolute right-0 bottom-0 w-48 h-48 bg-white/10 rounded-tl-[80px]" />
            <div className="absolute right-12 top-0 w-24 h-24 bg-white/10 rounded-full -translate-y-8" />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full mb-4">
                <Shield className="w-3.5 h-3.5" />Dành cho chủ quán
              </div>
              <h2 className="text-2xl font-extrabold text-white mb-2">Trở thành đối tác bán hàng</h2>
              <p className="text-white/80 text-sm leading-relaxed max-w-[250px]">
                Tiếp cận hàng triệu khách hàng · Tăng doanh thu · Quản lý dễ dàng
              </p>
            </div>
            <div className="relative z-10 flex items-end justify-between mt-6">
              <Link to={getPartnerRoute()} className="px-6 py-3 bg-white text-orange-500 rounded-2xl font-bold text-sm hover:bg-orange-50 transition-colors shadow-lg">
                Đăng ký ngay →
              </Link>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-900 to-gray-700 rounded-3xl px-8 py-8 flex flex-col justify-between overflow-hidden relative min-h-[220px]">
            <div className="absolute right-0 bottom-0 w-48 h-48 bg-white/5 rounded-tl-[80px]" />
            <div className="absolute right-12 top-0 w-24 h-24 bg-orange-500/20 rounded-full -translate-y-8" />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 bg-orange-500/20 text-orange-300 text-xs font-semibold px-3 py-1 rounded-full mb-4">
                <Bike className="w-3.5 h-3.5" />Dành cho tài xế
              </div>
              <h2 className="text-2xl font-extrabold text-white mb-2">Đăng ký làm Shipper</h2>
              <p className="text-gray-400 text-sm leading-relaxed max-w-[250px]">
                Thu nhập linh hoạt · Làm việc tự do · Thưởng hấp dẫn mỗi tuần
              </p>
            </div>
            <div className="relative z-10 flex items-end justify-between mt-6">
              <Link to={ROUTES.REGISTER_SHIPPER} className="px-6 py-3 bg-orange-500 text-white rounded-2xl font-bold text-sm hover:bg-orange-600 transition-colors shadow-lg shadow-orange-900/30">
                Đăng ký ngay →
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
