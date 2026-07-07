import React, { useEffect, useState } from 'react';
import { Zap, ChevronRight, Heart } from 'lucide-react';
import { flashSaleService } from '../../services/FlashSaleService';
import { productService } from '../../services/ProductService';
import type { IFlashSale, IFlashSaleProduct, IProductDto } from '../../interfaces';
import { formatCurrency } from '../../utils/formatters';
import { Link, useNavigate } from 'react-router-dom';
import { ROUTES } from '../../routes/routeConfig';
import { CarouselSlider } from '../ui/CarouselSlider';

function TimeBlock({ val, label }: { val: string; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="bg-gray-900 text-white text-sm font-bold rounded-md px-2 py-1 min-w-[32px] text-center tabular-nums">{val}</div>
      <span className="text-[10px] text-gray-500 mt-0.5">{label}</span>
    </div>
  );
}

export function FlashSaleSection() {
  const navigate = useNavigate();
  const [activeFlashSale, setActiveFlashSale] = useState<IFlashSale | null>(null);
  const [combinedProducts, setCombinedProducts] = useState<Array<{fs: IFlashSaleProduct, p: IProductDto}>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState({ h: '00', m: '00', s: '00' });

  useEffect(() => {
    fetchFlashSaleData();
  }, []);

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

  const fetchFlashSaleData = async () => {
    setIsLoading(true);
    try {
      const res = await flashSaleService.getActiveFlashSales();
      if (!res.error && res.data && res.data.length > 0) {
        const currentSale = res.data[0];
        setActiveFlashSale(currentSale);

        const productsRes = await flashSaleService.getFlashSaleProducts(currentSale.id, 0, 6);
        if (!productsRes.error && productsRes.data) {
          const fsData = productsRes.data.data;
          
          const productIds = fsData.map(p => p.productId);
          if (productIds.length > 0) {
             const detailRes = await Promise.all(productIds.map(id => productService.getById(id)));
             const pDetails = detailRes.filter(r => !r.error && r.data).map(r => r.data!);
             
             const combined = fsData.map(fs => {
               const p = pDetails.find(pd => pd.id === fs.productId);
               return { fs, p };
             }).filter(x => x.p !== undefined) as Array<{fs: IFlashSaleProduct, p: IProductDto}>;
             setCombinedProducts(combined.slice(0, 6)); // Display max 6
          }
        }
      } else {
        setActiveFlashSale(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !activeFlashSale || combinedProducts.length === 0) {
    return null;
  }

  return (
    <section>
      <div className="flex items-end justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-red-500 text-white px-3 py-1.5 rounded-xl shadow-sm shadow-red-500/20">
            <Zap className="w-4 h-4 fill-white animate-pulse" />
            <span className="font-extrabold text-sm tracking-wide">FLASH SALE</span>
          </div>
          <span className="text-gray-500 text-sm hidden sm:inline">Kết thúc sau</span>
          <div className="flex items-center gap-1">
            <TimeBlock val={timeLeft.h} label="Giờ" />
            <span className="text-gray-400 font-bold mb-3">:</span>
            <TimeBlock val={timeLeft.m} label="Phút" />
            <span className="text-gray-400 font-bold mb-3">:</span>
            <TimeBlock val={timeLeft.s} label="Giây" />
          </div>
        </div>
        <button 
          onClick={() => navigate(ROUTES.FLASH_SALE_PAGE)}
          className="flex items-center gap-1 text-orange-500 text-sm font-medium hover:text-orange-600 transition-colors"
        >
          Xem tất cả <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <CarouselSlider itemWidth="w-[80%] sm:w-1/2 md:w-1/4 lg:w-1/6">
        {combinedProducts.map(item => {
          const discount = Math.round((1 - item.fs.flashSalePrice / item.fs.originalPrice) * 100);
          const percentSold = item.fs.quantityLimit > 0 ? Math.round((item.fs.soldQuantity / item.fs.quantityLimit) * 100) : 0;
          
          return (
            <Link to={`/products/${item.p.id}`} key={item.fs.id} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all group cursor-pointer flex flex-col h-full">
              <div className="relative h-36 overflow-hidden bg-gray-100 shrink-0">
                {item.p.primaryImageUrl ? (
                  <img src={item.p.primaryImageUrl} alt={item.fs.productName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl">🍲</div>
                )}
                <div className="absolute top-2 left-2 bg-red-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-sm">-{discount}%</div>
              </div>
              <div className="p-3 flex flex-col flex-1">
                <p className="text-[11px] text-gray-400 truncate">{item.fs.restaurantName}</p>
                <p className="text-sm font-semibold text-gray-800 line-clamp-2 mt-0.5 mb-2 leading-tight min-h-[40px]">{item.fs.productName}</p>
                
                <div className="mt-auto">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-2">
                    <span className="text-orange-500 font-bold text-sm">{formatCurrency(item.fs.flashSalePrice)}</span>
                    <span className="text-gray-400 text-[10px] line-through">{formatCurrency(item.fs.originalPrice)}</span>
                  </div>
                  {/* Progress bar */}
                  <div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-orange-400 to-red-500 rounded-full" style={{ width: `${percentSold}%` }} />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1 font-medium">Đã bán {percentSold}%</p>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </CarouselSlider>
    </section>
  );
}
