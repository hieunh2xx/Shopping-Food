import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Star, TrendingUp, Zap, Clock } from 'lucide-react';
import { useAuth } from '../../hooks';
import { productService } from '../../services';
import type { IProductRecommendationDto } from '../../interfaces';
import { SectionHeader } from '../ui/SectionHeader';
import { CarouselSlider } from '../ui/CarouselSlider';
import { formatCurrency } from '../../utils/formatters';

interface Props {
  latitude?: number;
  longitude?: number;
}

export function RecommendationSection({ latitude, longitude }: Props) {
  const { isAuthenticated } = useAuth();
  const [recommendations, setRecommendations] = useState<IProductRecommendationDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchRecommendations();
    }
  }, [isAuthenticated, latitude, longitude]);

  const fetchRecommendations = async () => {
    setIsLoading(true);
    try {
      const res = await productService.getRecommendations({ latitude, longitude, take: 8 });
      if (!res.error && res.data) {
        setRecommendations(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  if (!isLoading && recommendations.length === 0) {
    return null;
  }

  const getReasonBadge = (tag: string) => {
    switch (tag) {
      case 'frequently_ordered':
        return (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-white/90 text-orange-500 text-[11px] font-bold px-2 py-0.5 rounded-full shadow-sm">
            <Clock className="w-3 h-3" /> Hay ăn
          </div>
        );
      case 'flash_sale':
        return (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-white/90 text-red-500 text-[11px] font-bold px-2 py-0.5 rounded-full shadow-sm">
            <Zap className="w-3 h-3 fill-red-500" /> Giờ Vàng
          </div>
        );
      case 'trending_category':
        return (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-white/90 text-blue-500 text-[11px] font-bold px-2 py-0.5 rounded-full shadow-sm">
            <TrendingUp className="w-3 h-3" /> Xu hướng
          </div>
        );
      case 'top_rated':
        return (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-white/90 text-amber-500 text-[11px] font-bold px-2 py-0.5 rounded-full shadow-sm">
            <Star className="w-3 h-3 fill-amber-500" /> Nổi bật
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <section>
      <SectionHeader
        icon={
          <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-purple-600" />
          </div>
        }
        title="Gợi ý dành riêng cho bạn"
        sub="Dựa trên sở thích và lịch sử đặt hàng của bạn"
        action=""
      />

      {isLoading ? (
        <div className="flex justify-center py-10 w-full">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <CarouselSlider itemWidth="w-[80%] sm:w-1/2 md:w-1/4 lg:w-1/6">
          {recommendations.map((item) => (
            <Link
              to={`/products/${item.id}`}
              key={item.id}
              className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all group cursor-pointer h-full flex flex-col relative"
            >
              <div className="relative h-36 overflow-hidden bg-gray-100 shrink-0">
                {item.primaryImageUrl ? (
                  <img
                    src={item.primaryImageUrl}
                    alt={item.itemName || item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl">🍲</div>
                )}
                {getReasonBadge(item.reasonTag)}
              </div>
              <div className="p-3 flex flex-col flex-1">
                <p className="text-[11px] text-gray-400 truncate">{item.restaurantName}</p>
                <p className="text-sm font-semibold text-gray-800 line-clamp-2 mt-0.5 min-h-[40px] leading-tight">
                  {item.itemName || item.name}
                </p>
                <div className="flex items-center justify-between mt-auto pt-2">
                  <div className="flex flex-col">
                    {item.flashSalePrice ? (
                      <>
                        <span className="text-red-500 font-bold text-sm">{formatCurrency(item.flashSalePrice)}</span>
                        <span className="text-gray-400 text-[10px] line-through">{formatCurrency(item.price)}</span>
                      </>
                    ) : (
                      <span className="text-purple-600 font-bold text-sm">{formatCurrency(item.price)}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    {item.averageRating !== undefined && item.averageRating !== null ? item.averageRating.toFixed(1) : '0.0'}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </CarouselSlider>
      )}
    </section>
  );
}
