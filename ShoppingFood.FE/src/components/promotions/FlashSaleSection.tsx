import React, { useEffect, useState } from 'react';
import { Zap, Clock } from 'lucide-react';
import { ProductList } from '../product/ProductList';
import { flashSaleService } from '../../services/FlashSaleService';
import { productService } from '../../services/ProductService';
import type { IFlashSale, IFlashSaleProduct, IProductDto } from '../../interfaces';

export function FlashSaleSection() {
  const [activeFlashSale, setActiveFlashSale] = useState<IFlashSale | null>(null);
  const [flashSaleProducts, setFlashSaleProducts] = useState<IFlashSaleProduct[]>([]);
  const [products, setProducts] = useState<IProductDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<{ hours: number, minutes: number, seconds: number }>({ hours: 0, minutes: 0, seconds: 0 });

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
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        // Refetch to see if another flash sale started
        fetchFlashSaleData();
        return;
      }

      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeFlashSale]);

  const fetchFlashSaleData = async () => {
    setIsLoading(true);
    try {
      const res = await flashSaleService.getActiveFlashSales();
      if (!res.error && res.data && res.data.length > 0) {
        const currentSale = res.data[0]; // Lấy flash sale đầu tiên
        setActiveFlashSale(currentSale);

        // Fetch products in flash sale
        const productsRes = await flashSaleService.getFlashSaleProducts(currentSale.id, 0, 8);
        if (!productsRes.error && productsRes.data) {
          setFlashSaleProducts(productsRes.data.data);
          
          // Lấy chi tiết IProductDto để hiển thị ProductCard
          const productIds = productsRes.data.data.map(p => p.productId);
          if (productIds.length > 0) {
             const detailRes = await productService.getProducts({ 
               categoryId: '', 
               search: '',
               restaurantId: '',
               skip: 0, 
               take: 8 
             });
             // Lọc ra các product có trong flash sale
             if (!detailRes.error && detailRes.data) {
               const fsProductsDetails = detailRes.data.items.filter(p => productIds.includes(p.id));
               setProducts(fsProductsDetails);
             }
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

  if (isLoading || !activeFlashSale || products.length === 0) {
    return null; // Không hiển thị nếu không có flash sale hoặc đang load
  }

  const formatTime = (time: number) => time.toString().padStart(2, '0');

  return (
    <section className="py-8 bg-orange-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 bg-white p-4 rounded-2xl shadow-sm border border-orange-100">
          <div className="flex items-center gap-3 mb-4 sm:mb-0">
            <div className="bg-gradient-to-br from-orange-500 to-red-600 p-2 rounded-xl">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent uppercase tracking-wider">
                Flash Sale
              </h2>
              <p className="text-sm text-gray-500 font-medium">{activeFlashSale.title}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-600 flex items-center gap-1">
              <Clock className="w-4 h-4" /> Kết thúc trong:
            </span>
            <div className="flex items-center gap-2">
              <div className="bg-gray-900 text-white font-bold px-3 py-1.5 rounded-lg min-w-[40px] text-center">
                {formatTime(timeLeft.hours)}
              </div>
              <span className="text-gray-900 font-bold">:</span>
              <div className="bg-gray-900 text-white font-bold px-3 py-1.5 rounded-lg min-w-[40px] text-center">
                {formatTime(timeLeft.minutes)}
              </div>
              <span className="text-gray-900 font-bold">:</span>
              <div className="bg-red-600 text-white font-bold px-3 py-1.5 rounded-lg min-w-[40px] text-center shadow-[0_0_10px_rgba(220,38,38,0.5)]">
                {formatTime(timeLeft.seconds)}
              </div>
            </div>
          </div>
        </div>

        <ProductList 
          products={products} 
          isLoading={false} 
          flashSaleProducts={flashSaleProducts} 
        />
      </div>
    </section>
  );
}
