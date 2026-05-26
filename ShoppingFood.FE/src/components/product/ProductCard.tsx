import { Star, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
      className="group overflow-hidden cursor-pointer flex flex-col h-full hover:shadow-lg transition-all duration-300"
      onClick={() => navigate(getProductDetailPath(product.id))}
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        {product.primaryImageUrl ? (
          <img
            src={product.primaryImageUrl}
            alt={product.itemName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl opacity-50">
            🍜
          </div>
        )}
        
        {/* Status Badge */}
        {product.stockStatus === 'OutOfStock' && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
            <span className="px-3 py-1 rounded-full bg-red-500 text-white text-sm font-medium">
              Hết hàng
            </span>
          </div>
        )}

        {/* Promo Badge - Example static UI */}
        {product.stockStatus === 'InStock' && (
          <div className="absolute top-3 left-3 flex gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-orange-500 text-white text-xs font-bold shadow-sm">
              Hot
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex justify-between items-start gap-2 mb-2">
          <h3 className="text-base font-semibold text-gray-900 line-clamp-2 leading-tight group-hover:text-orange-500 transition-colors">
            {product.itemName}
          </h3>
          <span className="flex items-center gap-1 text-sm font-medium text-gray-900 bg-gray-50 px-1.5 py-0.5 rounded-lg whitespace-nowrap">
            <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
            4.8
          </span>
        </div>

        <p className="text-sm text-gray-500 mb-3 line-clamp-1">
          {product.restaurantName}
        </p>

        <div className="mt-auto flex items-center justify-between">
          <span className="text-lg font-bold text-orange-600">
            {formatCurrency(product.price)}
          </span>
          {product.availableFrom && (
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
