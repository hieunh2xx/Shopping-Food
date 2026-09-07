import { useEffect, useState } from 'react';
import { Gift, Tag } from 'lucide-react';
import { promotionService } from '../../services/PromotionService';
import { productService } from '../../services/ProductService';
import { restaurantService } from '../../services/RestaurantService';
import type { IBuyXGetYPromotionDto, IProductDto, IRestaurantDto } from '../../interfaces';
import { formatCurrency } from '../../utils/formatters';
import { Link, useNavigate } from 'react-router-dom';
import { SectionHeader } from '../ui/SectionHeader';
import { CarouselSlider } from '../ui/CarouselSlider';
import { useCart } from '../../hooks';
import { ROUTES } from '../../routes/routeConfig';
import toast from 'react-hot-toast';

/**
 * Mục Hiển Thị Chương Trình Khuyến Mãi Mua X Tặng Y (BuyXGetYSection).
 * Trưng bày danh sách các gói ưu đãi mua X tặng Y hot nhất trên trang chủ dưới dạng slider cuộn ngang,
 * tính toán giá combo và hỗ trợ nút thêm nhanh cả combo kèm quà vào giỏ hàng.
 */
export function BuyXGetYSection() {
  const navigate = useNavigate();
  const { addBuyXGetY } = useCart();
  const [promotions, setPromotions] = useState<Array<{ promo: IBuyXGetYPromotionDto, p: IProductDto | null, r: IRestaurantDto | null }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPromotions();
  }, []);

  /**
   * Tải danh sách chương trình khuyến mãi Mua X Tặng Y đang hoạt động và nạp thông tin món ăn/nhà hàng.
   */
  const fetchPromotions = async () => {
    setIsLoading(true);
    try {
      const res = await promotionService.getPromotions({ isActive: true });
      if (!res.error && res.data) {
        const now = new Date();
        const validPromos = res.data.filter(promo => {
          const endDate = new Date(promo.endDate);
          endDate.setHours(23, 59, 59, 999);
          return endDate >= now;
        });
        const topPromos = validPromos.slice(0, 4);
        
        // Tải chi tiết sản phẩm và nhà hàng tương ứng
        const combined = await Promise.all(topPromos.map(async (promo) => {
          let p: IProductDto | null = null;
          let r: IRestaurantDto | null = null;
          
          try {
            // Lấy thông tin nhà hàng (restaurantName)
            const rRes = await restaurantService.getDetail(promo.restaurantId);
            if (!rRes.error && rRes.data) r = rRes.data;

            // Lấy thông tin product (price, image)
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


  if (isLoading || promotions.length === 0) {
    return null;
  }

  // Define some gradient colors for cards to make them vibrant
  const colors = [
    "from-orange-500 to-red-500",
    "from-purple-500 to-pink-500",
    "from-green-500 to-teal-500",
    "from-blue-500 to-cyan-500"
  ];

  return (
    <section>
      <SectionHeader
        icon={<div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center"><Gift className="w-4 h-4 text-white" /></div>}
        title="Chương trình Mua X Tặng Y"
        sub="Ưu đãi cực hot — mua 1 tặng 1, mua 2 tặng 1 và nhiều hơn nữa"
        action="Xem tất cả ưu đãi"
        onActionClick={() => navigate(ROUTES.BUY_X_GET_Y)}
      />

      <CarouselSlider itemWidth="w-[85%] sm:w-1/2 lg:w-1/4">
        {promotions.map((item, index) => {
          const colorClass = colors[index % colors.length];
          const btnColor = colorClass.split(' ')[0].replace('from-', 'bg-');
          return (
            <Link to={`/restaurant/${item.promo.restaurantId}`} key={item.promo.id} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition-all group flex flex-col h-full">
              {/* Top gradient tag */}
              <div className={`bg-gradient-to-r ${colorClass} px-4 py-2.5 flex items-center justify-between shrink-0`}>
                <span className="text-white font-extrabold text-sm shadow-sm drop-shadow-sm truncate">
                  Mua {item.promo.buyQuantity} Tặng {item.promo.giftQuantity}
                </span>
                <Tag className="w-4 h-4 text-white/90 drop-shadow-sm shrink-0 ml-2" />
              </div>
              
              {/* Image */}
              <div className="relative h-44 overflow-hidden bg-gray-100 shrink-0">
                {item.p?.primaryImageUrl ? (
                   <img src={item.p.primaryImageUrl} alt={item.promo.triggerProductName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                   <div className="w-full h-full flex items-center justify-center text-5xl opacity-50 bg-gray-50 group-hover:scale-105 transition-transform duration-300">🎁</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>
              
              {/* Info */}
              <div className="p-4 flex flex-col flex-1">
                <p className="text-xs text-orange-500 font-medium truncate">{item.r?.restaurantName || 'Nhà hàng'}</p>
                <p className="font-bold text-gray-800 text-sm mt-0.5 line-clamp-1">{item.promo.triggerProductName}</p>
                <p className="text-xs text-gray-500 mt-1.5 leading-relaxed line-clamp-2">Mua {item.promo.buyQuantity} {item.promo.triggerProductName} tặng ngay {item.promo.giftQuantity} {item.promo.giftProductName}</p>
                <div className="flex items-center justify-between mt-auto pt-4 gap-2">
                  <div className="min-w-0">
                    {item.p?.price ? (
                      <>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Giá combo</p>
                        <span className="text-orange-500 font-bold block leading-tight">
                          {formatCurrency(item.p.price * item.promo.buyQuantity)}
                        </span>
                        <p className="text-[10px] text-gray-400 mt-0.5 truncate">
                          {item.promo.buyQuantity}× {formatCurrency(item.p.price)}
                        </p>
                      </>
                    ) : (
                      <span className="text-orange-500 font-bold">Liên hệ</span>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (item.p) {
                        void addBuyXGetY({
                          promotionId: item.promo.id,
                          triggerProduct: item.p,
                          sets: 1,
                        });
                      } else {
                        console.warn("Product not found", item);
                        toast.error('Không tìm thấy thông tin sản phẩm');
                      }
                    }}
                    className={`text-xs font-semibold px-4 py-2 rounded-full ${btnColor} text-white hover:opacity-90 transition-opacity shadow-sm shrink-0`}
                  >
                    Thêm vào giỏ
                  </button>
                </div>
              </div>
            </Link>
          );
        })}
      </CarouselSlider>
    </section>
  );
}
