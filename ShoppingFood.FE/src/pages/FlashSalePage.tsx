import { useEffect, useState } from 'react';
import { Pagination } from '../components/common/Pagination';
import { Zap, ArrowLeft, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../routes/routeConfig';
import { flashSaleService } from '../services/FlashSaleService';
import { productService } from '../services/ProductService';
import type { IFlashSale, IFlashSaleProduct, IProductDto } from '../interfaces';
import { formatCurrency } from '../utils/formatters';
import { useCart } from '../hooks';

/**
 * Trang Danh Sách Sản Phẩm Flash Sale (FlashSalePage).
 * Hiển thị tất cả sản phẩm đang trong chương trình giảm giá Flash Sale:
 * - Đồng hồ đếm ngược thời gian kết thúc
 * - Lưới sản phẩm Flash Sale kèm thanh phần trăm số lượng đã bán
 * - Phân trang danh sách sản phẩm.
 */
export function FlashSalePage() {
  const [activeFlashSale, setActiveFlashSale] = useState<IFlashSale | null>(null);
  const [combinedProducts, setCombinedProducts] = useState<Array<{fs: IFlashSaleProduct, p: IProductDto}>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState({ h: '00', m: '00', s: '00' });
  const [pageIndex, setPageIndex] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 10;
  const { addItem } = useCart();

  useEffect(() => {
    fetchFlashSaleData();
  }, [pageIndex]);

  // Bộ đếm ngược thời gian Flash Sale
  useEffect(() => {
    if (!activeFlashSale) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(activeFlashSale.endDate).getTime();
      const distance = end - now;

      if (distance < 0) {
        clearInterval(timer);
        setTimeLeft({ h: '00', m: '00', s: '00' });
        fetchFlashSaleData();
        return;
      }

      const h = String(Math.floor(distance / (1000 * 60 * 60))).padStart(2, "0");
      const m = String(Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, "0");
      const s = String(Math.floor((distance % (1000 * 60)) / 1000)).padStart(2, "0");

      setTimeLeft({ h, m, s });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeFlashSale]);

  /**
   * Tải dữ liệu đợt Flash Sale đang diễn ra và danh sách sản phẩm theo trang.
   */
  const fetchFlashSaleData = async () => {
    setIsLoading(true);
    try {
      const res = await flashSaleService.getActiveFlashSales();
      if (!res.error && res.data && res.data.length > 0) {
        const currentSale = res.data[0];
        setActiveFlashSale(currentSale);
        
        const skip = (pageIndex - 1) * pageSize;
        const fpRes = await flashSaleService.getFlashSaleProducts(currentSale.id, skip, pageSize);
        
        if (!fpRes.error && fpRes.data) {
          const fsProds = fpRes.data.data;
          setTotalItems(fpRes.data.total);
          const productIds = fsProds.map(p => p.productId);
          if (productIds.length > 0) {
            const detailRes = await Promise.all(productIds.map(id => productService.getById(id)));
            const pDetails = detailRes.filter(r => !r.error && r.data).map(r => r.data!);
            
            const combined = fsProds.map(fs => {
              const p = pDetails.find((pd: IProductDto) => pd.id === fs.productId);
              if (p) {
                return { fs, p: { ...p, flashSalePrice: fs.flashSalePrice } };
              }
              return undefined;
            }).filter(x => x !== undefined) as Array<{fs: IFlashSaleProduct, p: IProductDto}>;
            
            setCombinedProducts(combined);
          }
        }
      }
    } catch (e) {
      console.error('Failed to load flash sale data:', e);
    } finally {
      setIsLoading(false);
    }
  };


  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (!activeFlashSale || combinedProducts.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col justify-center items-center bg-gray-50/50">
        <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mb-6 shadow-sm">
          <Zap className="w-12 h-12 text-orange-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Chưa có Flash Sale</h2>
        <p className="text-gray-500 text-center max-w-md mb-8">
          Hiện tại không có chương trình Flash Sale nào đang diễn ra. 
          Bạn hãy quay lại sau nhé!
        </p>
        <Link 
          to={ROUTES.HOME}
          className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
          Về trang chủ
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8">
          <Link to={ROUTES.HOME} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-orange-600 mb-6 transition-colors font-medium">
            <ArrowLeft className="w-4 h-4" /> Về trang chủ
          </Link>
          
          <div className="bg-gradient-to-r from-orange-500 to-rose-500 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between text-white shadow-lg overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4"></div>
            
            <div className="flex items-center gap-4 relative z-10 mb-6 md:mb-0">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-inner">
                <Zap className="w-8 h-8 text-white fill-white" />
              </div>
              <div>
                <h1 className="text-3xl font-black italic tracking-tight mb-1 drop-shadow-sm">FLASH SALE</h1>
                <p className="text-white/90 font-medium">Khuyến mãi cực sốc - Số lượng có hạn</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 bg-black/20 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/10 relative z-10 shadow-inner">
              <div className="flex flex-col items-center">
                <Clock className="w-6 h-6 text-orange-200 mb-1" />
                <span className="text-xs text-orange-100 font-medium uppercase tracking-wider">Kết thúc sau</span>
              </div>
              <div className="flex items-center gap-2 text-3xl font-black tabular-nums tracking-tight">
                <div className="bg-white text-rose-600 rounded-xl px-3 py-1 shadow-sm min-w-[56px] text-center">{timeLeft.h}</div>
                <span className="text-white/60 -mt-1">:</span>
                <div className="bg-white text-rose-600 rounded-xl px-3 py-1 shadow-sm min-w-[56px] text-center">{timeLeft.m}</div>
                <span className="text-white/60 -mt-1">:</span>
                <div className="bg-white text-rose-600 rounded-xl px-3 py-1 shadow-sm min-w-[56px] text-center">{timeLeft.s}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Grid Products */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
          {combinedProducts.map((item) => {
            const progress = (item.fs.soldQuantity / item.fs.quantityLimit) * 100;
            const isSoldOut = item.fs.soldQuantity >= item.fs.quantityLimit;
            
            return (
              <Link
                key={item.fs.id}
                to={`${ROUTES.PRODUCTS}/${item.p.id}`}
                className={`group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col ${isSoldOut ? 'opacity-75 grayscale-[30%]' : ''}`}
              >
                <div className="relative aspect-square overflow-hidden bg-gray-100">
                  {item.p.primaryImageUrl ? (
                    <img
                      src={item.p.primaryImageUrl}
                      alt={item.p.itemName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl">🍜</div>
                  )}
                  
                  <div className="absolute top-2 left-2 bg-rose-500 text-white text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm">
                    <Zap className="w-3 h-3 fill-current" />
                    SALE
                  </div>
                  
                  {isSoldOut && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                      <span className="bg-rose-600 text-white font-bold px-4 py-2 rounded-xl shadow-lg transform -rotate-12 border-2 border-white/20">
                        ĐÃ BÁN HẾT
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-4 flex flex-col flex-1">
                  <h3 className="font-semibold text-gray-900 line-clamp-2 text-sm mb-1 group-hover:text-orange-600 transition-colors">
                    {item.p.itemName}
                  </h3>
                  <p className="text-xs text-gray-500 mb-3 truncate">
                    {item.p.restaurantName}
                  </p>
                  
                  <div className="mt-auto">
                    <div className="flex flex-col mb-3">
                      <span className="text-lg font-black text-rose-600 leading-none mb-1">
                        {formatCurrency(item.fs.flashSalePrice)}
                      </span>
                      <span className="text-xs text-gray-400 line-through">
                        {formatCurrency(item.p.price)}
                      </span>
                    </div>
                    
                    <div className="relative h-6 bg-rose-100 rounded-full overflow-hidden flex items-center justify-center border border-rose-200 shadow-inner">
                      <div 
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-rose-400 to-rose-500 transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                      ></div>
                      <span className="relative z-10 text-[10px] font-bold text-white uppercase tracking-wider drop-shadow-sm">
                        {isSoldOut ? 'Đã bán hết' : `Đã bán ${item.fs.soldQuantity}`}
                      </span>
                    </div>
                  </div>
                </div>
                
                {!isSoldOut && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      addItem(item.p, 1);
                    }}
                    className="w-full bg-rose-50 hover:bg-rose-500 text-rose-600 hover:text-white font-semibold py-3 text-sm transition-colors border-t border-rose-100 group-hover:border-transparent"
                  >
                    Thêm vào giỏ
                  </button>
                )}
              </Link>
            );
          })}
        </div>

        {totalItems > pageSize && (
          <div className="mt-10 flex justify-center">
            <Pagination
              currentPage={pageIndex}
              totalPages={Math.ceil(totalItems / pageSize)}
              onPageChange={setPageIndex}
            />
          </div>
        )}
      </div>
    </div>
  );
}
