import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, MapPin, Clock, Star, Phone, ShieldCheck, Crown, MessageCircle, Copy, Check } from 'lucide-react';
import { restaurantService } from '../services/RestaurantService';
import { productService } from '../services/ProductService';
import { menuCategoryService } from '../services/MenuCategoryService';
import type { IRestaurantProfileDto, IProductDto, IMenuCategoryDto } from '../interfaces';
import { ProductList } from '../components/product/ProductList';
import { RestaurantChatModal } from '../components/chat/RestaurantChatModal';
import { useAuth } from '../hooks';
import { ROUTES } from '../routes/routeConfig';
import toast from 'react-hot-toast';
import { isRestaurantOpenNow } from '../utils/restaurantHours';

<<<<<<< HEAD
/**
 * Kiểm tra xem nhà hàng hiện tại có đang mở cửa tiếp nhận đơn hay không dựa trên giờ mở và đóng cửa.
 * @param openTime - Chuỗi giờ mở cửa (HH:mm)
 * @param closeTime - Chuỗi giờ đóng cửa (HH:mm)
 */
const isRestaurantOpen = (openTime?: string, closeTime?: string) => {
  if (!openTime || !closeTime) return true;
  
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  const [openH, openM] = openTime.split(':').map(Number);
  const [closeH, closeM] = closeTime.split(':').map(Number);
  
  const openTimeMins = openH * 60 + (openM || 0);
  const closeTimeMins = closeH * 60 + (closeM || 0);
  
  if (closeTimeMins < openTimeMins) {
    return currentTime >= openTimeMins || currentTime <= closeTimeMins;
  }
  
  return currentTime >= openTimeMins && currentTime <= closeTimeMins;
};

/**
 * Trang Chi Tiết Nhà Hàng (RestaurantDetailPage).
 * Hiển thị thông tin tổng thể của một nhà hàng đối tác:
 * - Ảnh bìa, tên quán, địa chỉ, số điện thoại, đánh giá sao, thời gian hoạt động, huy hiệu Mall/Chính hãng
 * - Danh mục thực đơn và toàn bộ món ăn của quán
 * - Nút yêu thích quán (Thêm/Bỏ yêu thích)
 * - Nút mở khung chat trực tiếp với chủ quán (RestaurantChatModal).
 */
=======
>>>>>>> main
export function RestaurantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [restaurant, setRestaurant] = useState<IRestaurantProfileDto | null>(null);
  const [products, setProducts] = useState<IProductDto[]>([]);
  const [categories, setCategories] = useState<IMenuCategoryDto[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isProductsLoading, setIsProductsLoading] = useState(true);
  const [isFavoriting, setIsFavoriting] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [phoneCopied, setPhoneCopied] = useState(false);

  useEffect(() => {
    if (id) {
      fetchRestaurant(id);
      fetchCategories(id);
    }
  }, [id]);

  const fetchRestaurant = async (restId: string) => {
    try {
      const res = await restaurantService.getDetail(restId);
      if (!res.error && res.data) {
        setRestaurant(res.data);
      } else {
        toast.error('Không thể tải thông tin nhà hàng');
      }
    } catch {
      toast.error('Tải chi tiết cửa hàng thất bại do lỗi kết nối mạng.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async (restId: string) => {
    try {
      const res = await menuCategoryService.getByRestaurant(restId);
      if (!res.error && res.data) {
        setCategories(res.data);
      }
    } catch {
      console.error('Lỗi tải danh mục món ăn');
    }
  };

  const fetchProducts = async (restId: string, categoryId: string) => {
    setIsProductsLoading(true);
    try {
      const res = await productService.search({
        restaurantId: restId,
        categoryId: categoryId === 'all' ? undefined : categoryId,
        take: 50
      });
      if (!res.error && res.data) {
        setProducts(res.data);
      }
    } catch {
      console.error('Lỗi tải danh sách món ăn');
    } finally {
      setIsProductsLoading(false);
    }
  };

  const handleCategoryChange = (categoryId: string) => {
    setActiveCategory(categoryId);
  };

  useEffect(() => {
    if (!id || !restaurant) return;

    const open =
      restaurant.status === 'Active' &&
      isRestaurantOpenNow(restaurant.openingTime, restaurant.closingTime, restaurant.isOpenNow);

    if (!open) {
      setProducts([]);
      setIsProductsLoading(false);
      return;
    }

    fetchProducts(id, activeCategory);
  }, [id, restaurant?.id, restaurant?.status, restaurant?.openingTime, restaurant?.closingTime, restaurant?.isOpenNow, activeCategory]);

  const handleToggleFavorite = async () => {
    if (!restaurant) return;
    setIsFavoriting(true);
    try {
      const res = await restaurantService.toggleFavorite(restaurant.id);
      if (!res.error) {
        setRestaurant(prev => prev ? { ...prev, isFavorite: !prev.isFavorite } : null);
        toast.success(restaurant.isFavorite ? 'Đã bỏ lưu quán' : 'Đã lưu quán vào danh sách yêu thích');
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error('Thêm vào danh sách yêu thích thất bại do lỗi kết nối mạng.');
    } finally {
      setIsFavoriting(false);
    }
  };

  const normalizePhone = (phone?: string | null) => (phone || '').replace(/[^\d+]/g, '');

  const handleCopyPhone = async () => {
    const phone = restaurant?.phone;
    if (!phone) {
      toast.error('Cửa hàng chưa cập nhật số điện thoại');
      return;
    }
    try {
      await navigator.clipboard.writeText(normalizePhone(phone) || phone);
      setPhoneCopied(true);
      toast.success('Đã sao chép số điện thoại');
      setTimeout(() => setPhoneCopied(false), 2000);
    } catch {
      toast.error('Không sao chép được số điện thoại');
    }
  };

  const handleOpenChat = () => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để nhắn tin với cửa hàng');
      navigate(ROUTES.LOGIN);
      return;
    }
    setIsChatOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-3xl border border-gray-100 shadow-sm max-w-md">
          <span className="text-6xl mb-4 block">🏪</span>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Không tìm thấy quán</h2>
          <p className="text-gray-500">Quán ăn này không tồn tại hoặc đã bị khóa.</p>
        </div>
      </div>
    );
  }

  const restaurantIsOpen =
    restaurant.status === 'Active' &&
    isRestaurantOpenNow(restaurant.openingTime, restaurant.closingTime, restaurant.isOpenNow);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Restaurant Header / Banner */}
      <div className="bg-white border-b border-gray-200">
        <div className="h-64 md:h-80 w-full bg-gray-200 relative overflow-hidden">
          {restaurant.logoUrl ? (
            <img
              src={restaurant.logoUrl}
              alt={restaurant.restaurantName}
              className="w-full h-full object-cover blur-sm opacity-60 scale-110"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-orange-400 to-orange-500" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          <div className="absolute bottom-0 left-0 w-full p-6 md:p-8">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end gap-6">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-white p-2 shrink-0 shadow-xl overflow-hidden">
                {restaurant.logoUrl ? (
                  <img src={restaurant.logoUrl} className="w-full h-full object-cover rounded-xl" alt="Logo" />
                ) : (
                  <div className="w-full h-full bg-orange-100 rounded-xl flex items-center justify-center text-4xl">🏪</div>
                )}
              </div>

              <div className="flex-1 text-white">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-2">
                    {restaurant.restaurantName}
                    {restaurant.isVerified && (
                      <span title="Quán Ăn Chuẩn" className="flex items-center"><ShieldCheck className="w-8 h-8 text-blue-400" /></span>
                    )}
                    {restaurant.isMall && (
                      <span title="Mall" className="flex items-center"><Crown className="w-8 h-8 text-red-500" /></span>
                    )}
                  </h1>
                  {restaurant.status === 'Active' ? (
                    restaurantIsOpen ? (
                      <span className="inline-flex items-center gap-1 bg-green-500/20 text-green-300 px-2 py-1 rounded-lg text-xs font-medium border border-green-500/30">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Đang mở cửa
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-gray-500/20 text-gray-300 px-2 py-1 rounded-lg text-xs font-medium border border-gray-500/30">
                        <Clock className="w-3.5 h-3.5" />
                        Đã đóng cửa
                      </span>
                    )
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-red-500/20 text-red-300 px-2 py-1 rounded-lg text-xs font-medium border border-red-500/30">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Tạm nghỉ
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm md:text-base text-gray-200">
                  <div className="flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="font-medium text-white">{restaurant.averageRating > 0 ? restaurant.averageRating.toFixed(1) : 'Mới'}</span>
                    <span>({restaurant.reviewCount} đánh giá)</span>
                  </div>
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-400 hidden md:block" />
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    <span>{restaurant.address}</span>
                  </div>
                </div>
              </div>

              <div className="shrink-0 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleOpenChat}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-colors border bg-orange-500 text-white border-orange-400 hover:bg-orange-600 shadow-lg shadow-orange-500/20"
                >
                  <MessageCircle className="w-5 h-5" />
                  Nhắn tin với quán
                </button>
                <button
                  onClick={handleToggleFavorite}
                  disabled={isFavoriting}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors border ${restaurant.isFavorite
                    ? 'bg-red-50 text-red-500 border-red-200 hover:bg-red-100'
                    : 'bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border-white/20'
                    }`}
                >
                  <Heart className={`w-5 h-5 ${restaurant.isFavorite ? 'fill-current text-red-500' : ''}`} />
                  {restaurant.isFavorite ? 'Đã lưu quán' : 'Lưu quán'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

          {/* Sidebar Info */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
              <h3 className="font-bold text-gray-900 text-lg mb-4">Thông tin quán</h3>

              <div className="flex items-start gap-3 text-gray-600">
                <Clock className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900 mb-1">Giờ mở cửa</p>
                  <p className="text-sm">Thứ 2 - Chủ Nhật</p>
                  <p className="text-sm font-medium text-orange-600">
                    {restaurant.openingTime || '08:00'} - {restaurant.closingTime || '22:00'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 text-gray-600">
                <Phone className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 mb-1">Liên hệ</p>
                  <p className="text-sm break-all">{restaurant.phone || 'Chưa cập nhật'}</p>
                  {restaurant.phone ? (
                    <div className="flex flex-wrap gap-2 mt-3">
                      <a
                        href={`tel:${normalizePhone(restaurant.phone)}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-green-50 text-green-700 border border-green-200 hover:bg-green-100"
                      >
                        <Phone className="w-3.5 h-3.5" /> Gọi quán
                      </a>
                      <button
                        type="button"
                        onClick={handleCopyPhone}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100"
                      >
                        {phoneCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        {phoneCopied ? 'Đã chép' : 'Sao chép'}
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          {/* Menu */}
          <div className="lg:col-span-3">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Thực đơn quán</h2>

            {/* Category Tabs */}
            <div className="mb-6 overflow-x-auto pb-4 hide-scrollbar">
              <div className="flex gap-3">
                <button
                  onClick={() => handleCategoryChange('all')}
                  className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${activeCategory === 'all'
                    ? 'bg-orange-600 text-white shadow-md shadow-orange-500/20'
                    : 'bg-white border border-gray-200 text-gray-700 hover:border-orange-400 hover:text-orange-600'
                    }`}
                >
                  Tất cả món
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryChange(cat.id)}
                    className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${activeCategory === cat.id
                      ? 'bg-orange-600 text-white shadow-md shadow-orange-500/20'
                      : 'bg-white border border-gray-200 text-gray-700 hover:border-orange-400 hover:text-orange-600'
                      }`}
                  >
                    {cat.title}
                  </button>
                ))}
              </div>
            </div>

            <ProductList
              products={products}
              isLoading={isProductsLoading}
              emptyMessage={
                restaurantIsOpen
                  ? 'Quán ăn hiện tại chưa có món nào.'
                  : 'Quán đang đóng cửa, thực đơn sẽ hiển thị khi quán mở lại.'
              }
            />
          </div>

        </div>
      </div>

      <RestaurantChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        restaurantId={restaurant.id}
        restaurantName={restaurant.restaurantName}
      />
    </div>
  );
}
