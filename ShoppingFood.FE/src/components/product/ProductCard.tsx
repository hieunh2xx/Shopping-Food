import { useNavigate } from 'react-router-dom';
import { Star, Clock, Truck } from 'lucide-react';
import { Card } from '../common';
import { formatCurrency } from '../../utils/formatters';
import { getProductDetailPath } from '../../routes/routeConfig';
import { useCart } from '../../hooks';
import type { IProductDto } from '../../interfaces';

interface ProductCardProps {
  product: IProductDto;
}

export function ProductCard({ product }: ProductCardProps) {
  const navigate = useNavigate();
  const { addItem } = useCart();

  return (
    <Card
      hoverable
      onClick={() => navigate(getProductDetailPath(product.id))}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        {product.primaryImageUrl ? (
          <img
            src={product.primaryImageUrl}
            alt={product.itemName}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gray-200/50 flex items-center justify-center mb-2">
                <span className="text-3xl">ðŸœ</span>
              </div>
              <p className="text-xs text-gray-500">ChÆ°a cÃ³ áº£nh</p>
            </div>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.isFreeship && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-green-500/90 text-[11px] font-semibold text-gray-900 backdrop-blur-sm">
              <Truck className="w-3 h-3" />
              Freeship
            </span>
          )}
          {product.stockStatus === 'OutOfStock' && (
            <span className="px-2 py-0.5 rounded-lg bg-red-500/90 text-[11px] font-semibold text-gray-900 backdrop-blur-sm">
              Háº¿t hÃ ng
            </span>
          )}
        </div>

        {/* Rating badge */}
        {product.averageRating > 0 && (
          <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-sm">
            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
            <span className="text-xs font-semibold text-gray-900">{product.averageRating.toFixed(1)}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-gray-100 line-clamp-2 leading-tight">
            {product.itemName}
          </h3>
        </div>

        <p className="text-xs text-gray-500 flex items-center gap-1">
          <span className="truncate">{product.restaurantName}</span>
          {product.categoryName && (
            <>
              <span className="text-gray-700">â€¢</span>
              <span className="text-orange-400/80">{product.categoryName}</span>
            </>
          )}
        </p>

        <div className="flex items-center justify-between pt-1">
          <p className="text-base font-bold text-orange-400">
            {formatCurrency(product.price)}
          </p>
          {!product.isAvailableNow && product.availableFrom && (
            <span className="flex items-center gap-1 text-[11px] text-gray-500">
              <Clock className="w-3 h-3" />
              {product.availableFrom}
            </span>
          )}
        </div>
        
        {/* Quick Add Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (product.stockStatus !== 'OutOfStock') {
              addItem(product, 1);
            }
          }}
          disabled={product.stockStatus === 'OutOfStock'}
          className="mt-2 w-full py-2 rounded-lg bg-orange-50 text-orange-600 text-sm font-medium hover:bg-orange-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {product.stockStatus === 'OutOfStock' ? 'Hết hàng' : 'Thêm vào giỏ'}
        </button>
      </div>
    </Card>
  );
}
