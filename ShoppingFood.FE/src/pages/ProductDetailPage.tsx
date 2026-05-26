import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Star, Truck, Clock, ShoppingCart } from 'lucide-react';
import { useProducts, useCart } from '../hooks';
import { Loading, Button } from '../components/common';
import { formatCurrency } from '../utils/formatters';
import { ROUTES } from '../routes/routeConfig';
import { ProductReviews } from '../components/product/ProductReviews';

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { product, isLoading, fetchProductById } = useProducts();
  const { addItem } = useCart();

  useEffect(() => {
    if (id) fetchProductById(id);
  }, [id, fetchProductById]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loading size="lg" text="Đang tải thông tin món ăn..." />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
          <span className="text-3xl">🍽️</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Không tìm thấy món ăn</h2>
        <p className="text-gray-500 mb-6">Món ăn này có thể đã bị xóa hoặc không còn bán.</p>
        <Link to={ROUTES.PRODUCTS}>
          <Button>Quay lại Thực đơn</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Back Button */}
      <Link 
        to={ROUTES.PRODUCTS}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Quay lại
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        {/* Left: Image */}
        <div className="relative aspect-square md:aspect-[4/3] lg:aspect-square rounded-3xl overflow-hidden bg-gray-100 shadow-sm border border-gray-200">
          {product.primaryImageUrl ? (
            <img 
              src={product.primaryImageUrl} 
              alt={product.itemName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl opacity-50">
              🍜
            </div>
          )}
          
          {product.stockStatus === 'OutOfStock' && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
              <span className="px-4 py-2 rounded-xl bg-red-500 text-white font-bold text-lg">
                Hết hàng
              </span>
            </div>
          )}
        </div>

        {/* Right: Info */}
        <div className="flex flex-col">
          <div className="mb-6">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 leading-tight">
              {product.itemName}
            </h1>
            <p className="text-3xl font-bold text-orange-600 mb-4">
              {formatCurrency(product.price)}
            </p>
            
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <span className="flex items-center gap-1.5 font-medium text-gray-900 bg-gray-100 px-3 py-1.5 rounded-lg">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                4.8 (120 đánh giá)
              </span>
              <Link 
                to={`/restaurant/${product.restaurantId}`} 
                className="text-orange-600 hover:text-orange-500 font-medium"
              >
                {product.restaurantName}
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 py-6 border-y border-gray-200 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <Truck className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Giao hàng</p>
                <p className="text-sm font-medium text-gray-900">15 - 30 phút</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                <Clock className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Giờ mở cửa</p>
                <p className="text-sm font-medium text-gray-900">
                  {product.availableFrom || '00:00'} - {product.availableTo || '23:59'}
                </p>
              </div>
            </div>
          </div>

          {product.description && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Mô tả món ăn</h3>
              <p className="text-gray-600 leading-relaxed">
                {product.description}
              </p>
            </div>
          )}

          <Button 
            size="lg" 
            className="w-full mt-auto" 
            disabled={product.stockStatus === 'OutOfStock'}
            onClick={() => addItem(product, 1)}
          >
            <ShoppingCart className="w-5 h-5" />
            {product.stockStatus === 'OutOfStock' ? 'Hết hàng' : 'Thêm vào giỏ'}
          </Button>
        </div>
      </div>

      {/* Reviews Section */}
      <ProductReviews productId={product.id} />
    </div>
  );
}
