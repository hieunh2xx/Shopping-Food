import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Heart, MapPin, Clock, Star, Phone, ShieldCheck } from 'lucide-react';
import { restaurantService } from '../services/RestaurantService';
import { productService } from '../services/ProductService';
import { menuCategoryService } from '../services/MenuCategoryService';
import type { IRestaurantProfileDto, IProductDto, IMenuCategoryDto } from '../interfaces';
import { ProductList } from '../components/product/ProductList';
import toast from 'react-hot-toast';

export function RestaurantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [restaurant, setRestaurant] = useState<IRestaurantProfileDto | null>(null);
  const [products, setProducts] = useState<IProductDto[]>([]);
  const [categories, setCategories] = useState<IMenuCategoryDto[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isProductsLoading, setIsProductsLoading] = useState(true);
  const [isFavoriting, setIsFavoriting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchRestaurant(id);
      fetchCategories(id);
      fetchProducts(id, 'all');
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
      toast.error('Lỗi kết nối máy chủ');
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
    if (restaurant) {
      fetchProducts(restaurant.id, categoryId);
    }
  };

  const handleToggleFavorite = async () => {
    if (!restaurant) return;
    setIsFavoriting(true);
    try {
      const res = await restaurantService.toggleFavorite(restaurant.id);
      if (!res.error) {
        setRestaurant(prev => prev ? { ...prev, isFavorite: !prev.isFavorite } : null);
        toast.success(restaurant.isFavorite ? 'Đã bỏ lưu quán' : 'Đã lưu quán vào danh sách yêu thích');
      } else {
        toast.error(res.message || 'Lỗi khi thao tác');
      }
    } catch {
      toast.error('Lỗi kết nối máy chủ');
    } finally {
      setIsFavoriting(false);
    }
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
                  <h1 className="text-3xl md:text-4xl font-bold">{restaurant.restaurantName}</h1>
                  {restaurant.status === 'Active' && (
                    <span className="inline-flex items-center gap-1 bg-green-500/20 text-green-300 px-2 py-1 rounded-lg text-xs font-medium border border-green-500/30">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Đang mở cửa
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

              <div className="shrink-0 flex items-center gap-3">
                <button
                  onClick={handleToggleFavorite}
                  disabled={isFavoriting}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors border ${
                    restaurant.isFavorite 
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
                <div>
                  <p className="font-medium text-gray-900 mb-1">Liên hệ</p>
                  <p className="text-sm">{restaurant.phone}</p>
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
                  className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    activeCategory === 'all'
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
                    className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                      activeCategory === cat.id
                        ? 'bg-orange-600 text-white shadow-md shadow-orange-500/20'
                        : 'bg-white border border-gray-200 text-gray-700 hover:border-orange-400 hover:text-orange-600'
                    }`}
                  >
                    {cat.title}
                  </button>
                ))}
              </div>
            </div>

            <ProductList products={products} isLoading={isProductsLoading} emptyMessage="Quán ăn hiện tại chưa có món nào." />
          </div>

        </div>
      </div>
    </div>
  );
}
