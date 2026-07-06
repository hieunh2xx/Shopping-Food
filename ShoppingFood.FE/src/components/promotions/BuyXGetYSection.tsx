import React, { useEffect, useState } from 'react';
import { Gift, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { promotionService } from '../../services/PromotionService';
import type { IBuyXGetYPromotionDto } from '../../interfaces';
import { ROUTES } from '../../routes/routeConfig';

export function BuyXGetYSection() {
  const [promotions, setPromotions] = useState<IBuyXGetYPromotionDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    setIsLoading(true);
    try {
      const res = await promotionService.getPromotions({ isActive: true });
      if (!res.error && res.data) {
        setPromotions(res.data.slice(0, 4)); // Giới hạn hiển thị 4 promotion
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || promotions.length === 0) {
    return null;
  }

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center">
              <Gift className="w-5 h-5 text-pink-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Mua X Tặng Y</h2>
              <p className="text-sm text-gray-500 mt-1">Ưu đãi kép cực hời</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {promotions.map((promo) => (
            <div key={promo.id} className="relative bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl border border-pink-100 p-5 overflow-hidden group hover:shadow-lg transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-2xl group-hover:bg-pink-500/20 transition-all" />
              
              <div className="relative z-10">
                <span className="inline-block px-3 py-1 bg-white/80 backdrop-blur-sm text-pink-600 text-xs font-bold rounded-lg mb-3 shadow-sm">
                  {promo.buyQuantity} tặng {promo.giftQuantity}
                </span>
                
                <h3 className="font-bold text-gray-900 mb-1 line-clamp-2">
                  Mua {promo.triggerProductName}
                </h3>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  Tặng ngay {promo.giftProductName}
                </p>

                <div className="flex items-center justify-end mt-auto pt-4 border-t border-pink-100/50">
                  <Link 
                    to={`/restaurant/${promo.restaurantId}`}
                    className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-pink-600 text-white hover:bg-pink-700 transition-colors"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
