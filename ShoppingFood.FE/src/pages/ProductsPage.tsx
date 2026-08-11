import { useEffect, useState } from 'react';
import { Search, SlidersHorizontal, MapPin, X, Star, Navigation, ArrowLeft } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { ROUTES } from '../routes/routeConfig';
import { useProducts } from '../hooks';
import { supportService } from '../services/SupportService';
import { ProductList } from '../components/product/ProductList';
import { Button, Pagination } from '../components/common';
import type { ISearchProductQuery } from '../interfaces';
import toast from 'react-hot-toast';

const DEFAULT_PAGE_SIZE = 8;

export function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('globalCategoryId') || 'all';

  const { products, total, isLoading, searchProducts } = useProducts();
  const [globalCategories, setGlobalCategories] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>(initialCategory);
  const [searchQuery, setSearchQuery] = useState<ISearchProductQuery>({
    globalCategoryId: initialCategory === 'all' ? undefined : initialCategory,
    filter: searchParams.get('search') || undefined,
    skip: 0,
    take: DEFAULT_PAGE_SIZE,
  });
  const [keyword, setKeyword] = useState(searchParams.get('search') || '');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState({
    sortBy: '',
    minPrice: '',
    maxPrice: '',
    minRating: '',
    isFreeship: false,
  });

  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  useEffect(() => {
    fetchGlobalCategories();
  }, []);

  useEffect(() => {
    const search = searchParams.get('search');
    const cat = searchParams.get('globalCategoryId') || 'all';
    setActiveCategory(cat);
    if (search !== null) {
      setKeyword(search);
    }
    setSearchQuery((prev) => ({
      ...prev,
      filter: search || undefined,
      globalCategoryId: cat === 'all' ? undefined : cat,
      skip: 0,
    }));
  }, [searchParams]);

  const fetchGlobalCategories = async () => {
    try {
      // Public system endpoint — works for guest + Customer (Admin path can 403)
      const res = await supportService.getGlobalMenuCategories();
      if (!res.error && res.data) {
        setGlobalCategories(res.data);
      }
    } catch {
      console.error('Lỗi tải danh mục toàn sàn');
    }
  };

  useEffect(() => {
    searchProducts(searchQuery);
  }, [searchQuery, searchProducts]);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const next = new URLSearchParams(searchParams);
    if (keyword.trim()) next.set('search', keyword.trim());
    else next.delete('search');
    setSearchParams(next);
    setSearchQuery((prev) => ({
      ...prev,
      filter: keyword.trim() || undefined,
      skip: 0,
    }));
  };

  const handleCategoryChange = (categoryId: string) => {
    setActiveCategory(categoryId);
    const next = new URLSearchParams(searchParams);
    if (categoryId === 'all') next.delete('globalCategoryId');
    else next.set('globalCategoryId', categoryId);
    setSearchParams(next);
    setSearchQuery((prev) => ({
      ...prev,
      globalCategoryId: categoryId === 'all' ? undefined : categoryId,
      skip: 0,
    }));
  };

  const handleNearMeClick = () => {
    // Nếu đang bật tìm kiếm gần đây thì tắt
    if (searchQuery.userLatitude && searchQuery.userLongitude) {
      setSearchQuery((prev) => ({
        ...prev,
        userLatitude: undefined,
        userLongitude: undefined,
        maxDistanceInKm: undefined,
        skip: 0,
      }));
      toast.success('Đã tắt lọc vị trí');
      return;
    }

    // Hiển thị modal xin quyền trước khi gọi API trình duyệt
    setIsLocationModalOpen(true);
  };

  const proceedWithLocation = () => {
    setIsLocationModalOpen(false);
    
    if ('geolocation' in navigator) {
      const toastId = toast.loading('Đang lấy vị trí của bạn...');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setSearchQuery((prev) => ({
            ...prev,
            userLatitude: position.coords.latitude,
            userLongitude: position.coords.longitude,
            maxDistanceInKm: 5, // Tìm trong bán kính 5km
            skip: 0,
          }));
          toast.success('Đã lấy vị trí thành công! Đang lọc các món ăn quanh đây.', { id: toastId });
        },
        (error) => {
          let errorMsg = 'Không thể lấy vị trí. Vui lòng cấp quyền truy cập vị trí trên trình duyệt.';
          if (error.code === error.PERMISSION_DENIED) errorMsg = 'Bạn đã từ chối cấp quyền vị trí.';
          toast.error(errorMsg, { id: toastId });
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      toast.error('Trình duyệt của bạn không hỗ trợ định vị.');
    }
  };

  const applyFilters = () => {
    setSearchQuery(prev => ({
      ...prev,
      sortBy: tempFilters.sortBy || undefined,
      minPrice: tempFilters.minPrice ? Number(tempFilters.minPrice) : undefined,
      maxPrice: tempFilters.maxPrice ? Number(tempFilters.maxPrice) : undefined,
      minRating: tempFilters.minRating ? Number(tempFilters.minRating) : undefined,
      isFreeship: tempFilters.isFreeship || undefined,
      skip: 0
    }));
    setIsFilterOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Search Header */}
      <div className="mb-8">
        <Link to={ROUTES.HOME} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-orange-600 mb-6 transition-colors font-medium">
          <ArrowLeft className="w-4 h-4" /> Về trang chủ
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Khám phá thực đơn</h1>
        
        <div className="bg-white border border-gray-200 p-4 rounded-2xl shadow-sm">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="text"
                name="keyword"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Bạn muốn ăn gì hôm nay?"
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 focus:bg-white transition-all"
              />
            </div>
            
            <Button 
              type="button" 
              variant="secondary" 
              className={`px-4 border-gray-200 transition-colors ${
                searchQuery.userLatitude 
                  ? 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100' 
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
              onClick={handleNearMeClick}
            >
              <Navigation className={`w-5 h-5 mr-2 ${searchQuery.userLatitude ? 'fill-orange-600' : ''}`} />
              Gần tôi
            </Button>

            <Button 
              type="button" 
              variant="secondary" 
              className="px-4 border-gray-200 text-gray-700 hover:bg-gray-50"
              onClick={() => setIsFilterOpen(true)}
            >
              <SlidersHorizontal className="w-5 h-5 mr-2" />
              Lọc
            </Button>

            <Button type="submit" className="px-8 shadow-lg shadow-orange-500/25">
              Tìm kiếm
            </Button>
          </form>
        </div>
      </div>

      {/* Categories */}
      <div className="mb-8 overflow-x-auto pb-4 hide-scrollbar">
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
          {globalCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeCategory === cat.id
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-500/20'
                  : 'bg-white border border-gray-200 text-gray-700 hover:border-orange-400 hover:text-orange-600'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-gray-500">
          {isLoading ? 'Đang tải…' : (
            <>
              <span className="font-semibold text-gray-800">{total.toLocaleString('vi-VN')}</span> món
              {activeCategory !== 'all' && globalCategories.find((c) => c.id === activeCategory)?.name
                ? ` · ${globalCategories.find((c) => c.id === activeCategory)?.name}`
                : ''}
            </>
          )}
        </p>
      </div>

      <ProductList 
        products={products} 
        isLoading={isLoading} 
        emptyMessage="Không tìm thấy món ăn nào phù hợp với tìm kiếm của bạn."
      />

      {/* Pagination */}
      {!isLoading && total > 0 && (
        <div className="mt-8 flex flex-col items-center gap-3">
          <p className="text-xs text-gray-400">
            Trang {Math.floor((searchQuery.skip || 0) / (searchQuery.take || DEFAULT_PAGE_SIZE)) + 1}
            {' / '}
            {Math.max(1, Math.ceil(total / (searchQuery.take || DEFAULT_PAGE_SIZE)))}
          </p>
          <Pagination 
            currentPage={Math.floor((searchQuery.skip || 0) / (searchQuery.take || DEFAULT_PAGE_SIZE)) + 1}
            totalPages={Math.max(1, Math.ceil(total / (searchQuery.take || DEFAULT_PAGE_SIZE)))}
            onPageChange={(page) => {
              setSearchQuery(prev => ({
                ...prev,
                skip: (page - 1) * (prev.take || DEFAULT_PAGE_SIZE)
              }));
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            pageSize={searchQuery.take || DEFAULT_PAGE_SIZE}
            pageSizeOptions={[8, 12, 20, 50]}
            onPageSizeChange={(size) => setSearchQuery(prev => ({
              ...prev,
              take: size,
              skip: 0
            }))}
          />
        </div>
      )}

      {/* Location Permission Modal */}
      {isLocationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-8 h-8 text-orange-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Cho phép truy cập vị trí</h3>
            <p className="text-gray-500 mb-6 text-sm">
              Ứng dụng cần biết vị trí của bạn để tìm và đề xuất các quán ăn ngon nhất ở gần bạn.
            </p>
            <div className="flex gap-3">
              <Button 
                variant="secondary" 
                className="flex-1" 
                onClick={() => setIsLocationModalOpen(false)}
              >
                Để sau
              </Button>
              <Button 
                className="flex-1" 
                onClick={proceedWithLocation}
              >
                Đồng ý
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Modal */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Bộ lọc tìm kiếm</h2>
              <button 
                onClick={() => setIsFilterOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Sắp xếp */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">Sắp xếp theo</label>
                <select 
                  value={tempFilters.sortBy}
                  onChange={e => setTempFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
                >
                  <option value="">Phù hợp nhất</option>
                  <option value="priceasc">Giá tăng dần</option>
                  <option value="pricedesc">Giá giảm dần</option>
                  <option value="name">Tên A-Z</option>
                </select>
              </div>

              {/* Mức giá */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">Khoảng giá (VNĐ)</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="number" 
                    placeholder="Tối thiểu" 
                    value={tempFilters.minPrice}
                    onChange={e => setTempFilters(prev => ({ ...prev, minPrice: e.target.value }))}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <span className="text-gray-400">-</span>
                  <input 
                    type="number" 
                    placeholder="Tối đa" 
                    value={tempFilters.maxPrice}
                    onChange={e => setTempFilters(prev => ({ ...prev, maxPrice: e.target.value }))}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Đánh giá */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">Đánh giá tối thiểu</label>
                <div className="flex gap-2">
                  {[3, 4, 5].map(rating => (
                    <button
                      key={rating}
                      onClick={() => setTempFilters(prev => ({ ...prev, minRating: prev.minRating === rating.toString() ? '' : rating.toString() }))}
                      className={`flex-1 flex items-center justify-center py-2 border rounded-xl transition-all ${
                        tempFilters.minRating === rating.toString()
                          ? 'bg-orange-50 border-orange-500 text-orange-600'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-orange-300'
                      }`}
                    >
                      <span className="font-medium mr-1">{rating}</span>
                      <Star className={`w-4 h-4 ${tempFilters.minRating === rating.toString() ? 'fill-orange-500 text-orange-500' : 'text-gray-400'}`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Freeship */}
              <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                <input 
                  type="checkbox" 
                  checked={tempFilters.isFreeship}
                  onChange={e => setTempFilters(prev => ({ ...prev, isFreeship: e.target.checked }))}
                  className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                />
                <span className="font-medium text-gray-900">Chỉ hiển thị món có Freeship</span>
              </label>
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3 bg-gray-50">
              <Button 
                type="button" 
                variant="secondary" 
                onClick={() => setTempFilters({ sortBy: '', minPrice: '', maxPrice: '', minRating: '', isFreeship: false })}
                className="w-1/3 bg-white"
              >
                Thiết lập lại
              </Button>
              <Button type="button" className="w-2/3 shadow-md shadow-orange-500/20" onClick={applyFilters}>
                Áp dụng bộ lọc
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
