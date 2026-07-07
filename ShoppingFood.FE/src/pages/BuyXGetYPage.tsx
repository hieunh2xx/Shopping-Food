import React, { useEffect, useState } from 'react';
import { Gift, Tag, ArrowLeft } from 'lucide-react';
import { promotionService } from '../services/PromotionService';
import { productService } from '../services/ProductService';
import { restaurantService } from '../services/RestaurantService';
import type { IBuyXGetYPromotionDto, IProductDto, IRestaurantDto } from '../interfaces';
import { formatCurrency } from '../utils/formatters';
import { Link } from 'react-router-dom';
import { useCart } from '../hooks';
import { ROUTES } from '../routes/routeConfig';

export function BuyXGetYPage() {
  const { addItem } = useCart();
  const [promotions, setPromotions] = useState<Array<{ promo: IBuyXGetYPromotionDto, p: IProductDto | null, r: IRestaurantDto | null }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    setIsLoading(true);
    try {
      const res = await promotionService.getPromotions({ isActive: true });
      if (!res.error && res.data) {
        // Fetch product and restaurant details
        const combined = await Promise.all(res.data.map(async (promo) => {
          let p: IProductDto | null = null;
          let r: IRestaurantDto | null = null;
          
          try {
            const rRes = await restaurantService.getDetail(promo.restaurantId);
            if (!rRes.error && rRes.data) r = rRes.data;

            const pRes = await productService.getById(promo.triggerProductId);
            if (!pRes.error && pRes.data) {
               p = pRes.data;
            }
          } catch (e) {
            console.error(e);
          }
          
          return { promo, p, r };
        }));

        setPromotions(combined);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const colors = [
    "from-orange-500 to-red-500",
    "from-purple-500 to-pink-500",
    "from-green-500 to-teal-500",
    "from-blue-500 to-cyan-500"
  ];

  return (
    <div className="bg-[#f5f5f5] min-h-screen py-10 font-sans">
      <div className="max-w-7xl mx-auto px-6">
        <Link to={ROUTES.HOME} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-orange-600 mb-6 transition-colors font-medium">
          <ArrowLeft className="w-4 h-4" /> Về trang chủ
        </Link>
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
            <Gift className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900">Khuyến Mãi Mua X Tặng Y</h1>
            <p className="text-gray-500 text-sm mt-1">Danh sách tất cả các ưu đãi mua kèm tặng kèm đang diễn ra</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : promotions.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-100">
            <span className="text-6xl">🎁</span>
            <h3 className="text-xl font-bold text-gray-800 mt-4">Chưa có khuyến mãi nào</h3>
            <p className="text-gray-500 mt-2">Vui lòng quay lại sau nhé!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {promotions.map((item, index) => {
              const colorClass = colors[index % colors.length];
              const btnColor = colorClass.split(' ')[0].replace('from-', 'bg-');
              return (
                <Link to={`/restaurant/${item.promo.restaurantId}`} key={item.promo.id} className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all group flex flex-col hover:-translate-y-1 duration-300">
                  <div className={`bg-gradient-to-r ${colorClass} px-5 py-3 flex items-center justify-between`}>
                    <span className="text-white font-extrabold text-sm shadow-sm drop-shadow-sm">
                      Mua {item.promo.buyQuantity} Tặng {item.promo.giftQuantity}
                    </span>
                    <Tag className="w-4 h-4 text-white/90 drop-shadow-sm" />
                  </div>
                  
                  <div className="relative h-48 overflow-hidden bg-gray-100">
                    {item.p?.primaryImageUrl ? (
                       <img src={item.p.primaryImageUrl} alt={item.promo.triggerProductName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                       <div className="w-full h-full flex items-center justify-center text-5xl opacity-50 bg-gray-50 group-hover:scale-105 transition-transform duration-500">🎁</div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/0 to-transparent" />
                  </div>
                  
                  <div className="p-5 flex flex-col flex-1">
                    <p className="text-xs text-orange-500 font-semibold truncate uppercase tracking-wide">{item.r?.restaurantName || 'Nhà hàng'}</p>
                    <p className="font-extrabold text-gray-900 text-base mt-1 line-clamp-1">{item.promo.triggerProductName}</p>
                    <p className="text-sm text-gray-500 mt-2 leading-relaxed line-clamp-2">Mua {item.promo.buyQuantity} {item.promo.triggerProductName} tặng ngay {item.promo.giftQuantity} {item.promo.giftProductName}</p>
                    
                    <div className="flex items-center justify-between mt-auto pt-6">
                      <span className="text-orange-500 font-black text-lg">{item.p?.price ? formatCurrency(item.p.price) : 'Liên hệ'}</span>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (item.p) {
                            addItem(item.p, item.promo.buyQuantity);
                          } else {
                            console.warn("Product not found", item);
                            alert("Không tìm thấy thông tin sản phẩm");
                          }
                        }}
                        className={`text-sm font-bold px-5 py-2.5 rounded-xl ${btnColor} text-white hover:brightness-110 active:scale-95 transition-all shadow-md`}
                      >
                        Thêm vào giỏ
                      </button>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
