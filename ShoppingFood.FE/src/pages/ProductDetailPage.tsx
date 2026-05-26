import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Star, Truck, Clock, ShoppingCart } from 'lucide-react';
import { useProducts, useCart } from '../hooks';
import { Loading, Button } from '../components/common';
import { formatCurrency } from '../utils/formatters';
import { ROUTES } from '../routes/routeConfig';

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { product, isLoading, fetchProductById } = useProducts();
  const { addItem } = useCart();

  useEffect(() => {
    if (id) fetchProductById(id);
  }, [id, fetchProductById]);

  if (isLoading) return <Loading fullScreen text="Äang táº£i chi tiáº¿t..." />;
  if (!product) return (
    <div className="max-w-7xl mx-auto px-4 py-16 text-center">
      <p className="text-gray-600">KhÃ´ng tÃ¬m tháº¥y sáº£n pháº©m</p>
      <Link to={ROUTES.PRODUCTS} className="text-orange-400 hover:text-orange-300 mt-4 inline-block">Quay láº¡i</Link>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <Link to={ROUTES.PRODUCTS} className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Quay láº¡i
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Image */}
        <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100">
          {product.primaryImageUrl ? (
            <img src={product.primaryImageUrl} alt={product.itemName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center"><span className="text-6xl">ðŸœ</span></div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-6">
          <div>
            <p className="text-sm text-orange-400 font-medium mb-1">{product.restaurantName}</p>
            <h1 className="text-3xl font-bold text-gray-900">{product.itemName}</h1>
            {product.categoryName && <p className="text-sm text-gray-500 mt-1">{product.categoryName}</p>}
          </div>

          <div className="flex items-center gap-4">
            {product.averageRating > 0 && (
              <div className="flex items-center gap-1">
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                <span className="font-semibold text-gray-900">{product.averageRating.toFixed(1)}</span>
                <span className="text-gray-500 text-sm">({product.reviewCount} Ä‘Ã¡nh giÃ¡)</span>
              </div>
            )}
            {product.isFreeship && (
              <span className="flex items-center gap-1 text-green-400 text-sm"><Truck className="w-4 h-4" /> Freeship</span>
            )}
            {product.availableFrom && (
              <span className="flex items-center gap-1 text-gray-600 text-sm"><Clock className="w-4 h-4" /> {product.availableFrom} - {product.availableTo}</span>
            )}
          </div>

          <p className="text-3xl font-bold text-orange-400">{formatCurrency(product.price)}</p>

          {product.description && <p className="text-gray-600 leading-relaxed">{product.description}</p>}

          {/* Sizes */}
          {product.sizes.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">KÃ­ch cá»¡</h3>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map(s => (
                  <button key={s.id} className="px-4 py-2 rounded-xl border border-gray-300 text-sm text-gray-700 hover:border-orange-500 hover:text-orange-400 transition-colors">
                    {s.name} {s.priceAdjustment > 0 && `(+${formatCurrency(s.priceAdjustment)})`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Toppings */}
          {product.toppings.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Topping</h3>
              <div className="flex flex-wrap gap-2">
                {product.toppings.map(t => (
                  <button key={t.id} className="px-4 py-2 rounded-xl border border-gray-300 text-sm text-gray-700 hover:border-orange-500 hover:text-orange-400 transition-colors">
                    {t.name} (+{formatCurrency(t.price)})
                  </button>
                ))}
              </div>
            </div>
          )}

          <Button 
            size="lg" 
            className="w-full" 
            disabled={product.stockStatus === 'OutOfStock'}
            onClick={() => addItem(product, 1)}
          >
            <ShoppingCart className="w-5 h-5" />
            {product.stockStatus === 'OutOfStock' ? 'Hết hàng' : 'Thêm vào giỏ'}
          </Button>
        </div>
      </div>
    </div>
  );
}
