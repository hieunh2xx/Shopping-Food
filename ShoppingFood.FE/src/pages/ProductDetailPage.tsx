import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Star, Truck, Clock, ShoppingCart, ShieldAlert, Check } from 'lucide-react';
import { useProducts, useCart, useAuth } from '../hooks';
import { Loading, Button, Modal } from '../components/common';
import { formatCurrency } from '../utils/formatters';
import { ROUTES } from '../routes/routeConfig';
import { ProductReviews } from '../components/product/ProductReviews';
import { MemberTierPricingNote } from '../components/product/MemberTierPricingNote';
import { productService } from '../services';
import toast from 'react-hot-toast';

/**
 * Trang Chi Tiết Món Ăn (ProductDetailPage).
 * Cung cấp đầy đủ thông tin về món ăn:
 * - Hình ảnh, tên, giá bán (kèm giá Flash Sale nếu có), thông tin nhà hàng và khoảng cách giao
 * - Lựa chọn kích cỡ (Size) và các loại Topping ăn kèm với tính toán giá động theo thời gian thực
 * - Ghi chú ưu đãi hạng thành viên (MemberTierPricingNote)
 * - Nút thêm món vào giỏ hàng
 * - Báo cáo vi phạm món ăn lên Admin
 * - Khu vực bình luận và đánh giá chất lượng món (ProductReviews).
 */
export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { product, isLoading, fetchProductById } = useProducts();
  const { addItem } = useCart();
  const { isAuthenticated, user } = useAuth();

  // Trạng thái lựa chọn Size và Topping
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedToppings, setSelectedToppings] = useState<string[]>([]);

  // Trạng thái modal báo cáo vi phạm
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('Vệ sinh an toàn thực phẩm');
  const [reportDetail, setReportDetail] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  useEffect(() => {
    if (id) fetchProductById(id);
  }, [id, fetchProductById]);

  useEffect(() => {
    if (product?.sizes && product.sizes.length > 0) {
      setSelectedSize(product.sizes[0].sizeName);
    } else {
      setSelectedSize('');
    }
    setSelectedToppings([]);
  }, [product]);

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

  /**
   * Tính toán tổng giá hiển thị linh hoạt dựa theo giá gốc/Flash Sale, size đã chọn và các topping đã tích.
   */
  const getDisplayPrice = () => {
    let price = product.flashSalePrice ?? product.price;
    if (selectedSize) {
      const sizeOpt = product.sizes?.find((s) => s.sizeName === selectedSize);
      if (sizeOpt) price += sizeOpt.extraPrice;
    }
    selectedToppings.forEach((topName) => {
      const topOpt = product.toppings?.find((t) => t.name === topName || (t as any).toppingName === topName);
      if (topOpt) price += topOpt.price;
    });
    return price;
  };

  /**
   * Bật hoặc tắt lựa chọn một loại topping.
   * @param toppingName - Tên topping
   */
  const handleToppingToggle = (toppingName: string) => {
    setSelectedToppings((prev) =>
      prev.includes(toppingName)
        ? prev.filter((t) => t !== toppingName)
        : [...prev, toppingName]
    );
  };

  /**
   * Thêm sản phẩm hiện tại cùng size và danh sách topping đã chọn vào giỏ hàng.
   */
  const handleAddToCart = () => {
    addItem(product, 1, selectedSize || undefined, selectedToppings.length > 0 ? selectedToppings : undefined);
  };

  /**
   * Gửi báo cáo vi phạm về sản phẩm lên ban quản trị.
   * @param e - Sự kiện FormEvent
   */
  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingReport(true);
    try {
      const res = await productService.reportProduct({
        productId: product.id,
        reason: reportReason,
        description: reportDetail.trim() || undefined,
      });

      if (!res.error) {
        toast.success('Báo cáo của bạn đã được gửi thành công! Cảm ơn ý kiến đóng góp.');
        setIsReportOpen(false);
        setReportDetail('');
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error('Đã xảy ra lỗi khi gửi báo cáo');
    } finally {
      setIsSubmittingReport(false);
    }
  };


  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Back Button */}
      <div className="flex justify-between items-center mb-6">
        <Link
          to={ROUTES.PRODUCTS}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại
        </Link>
        <button
          onClick={() => setIsReportOpen(true)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-xl transition-all shadow-sm"
        >
          <ShieldAlert className="w-4 h-4" />
          Báo cáo vi phạm
        </button>
      </div>

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
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-3xl font-black text-orange-600">
                {formatCurrency(getDisplayPrice())}
              </span>
              {product.flashSalePrice && (
                <span className="text-lg text-gray-400 line-through ml-2">
                  {formatCurrency(product.price)}
                </span>
              )}
              {(selectedSize || selectedToppings.length > 0) && (
                <span className="text-xs text-gray-400 font-medium">
                  (Giá thay đổi theo tùy chọn)
                </span>
              )}
            </div>

            <MemberTierPricingNote
              displayPrice={getDisplayPrice()}
              isFlashSale={!!product.flashSalePrice}
              isAuthenticated={isAuthenticated}
              userTier={user?.tier}
            />

            <div className="flex flex-wrap items-center gap-4 text-sm mt-4">
              <span className="flex items-center gap-1.5 font-medium text-gray-900 bg-gray-100 px-3 py-1.5 rounded-lg">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                {product.averageRating > 0 ? `${product.averageRating.toFixed(1)} (${product.reviewCount} đánh giá)` : 'Chưa có đánh giá'}
              </span>
              <Link
                to={`/restaurant/${product.restaurantId}`}
                className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-500 font-semibold bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-lg transition-colors"
              >
                {product.restaurantName}
                <span className="text-xs font-medium text-orange-500">Xem cửa hàng →</span>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-100 mb-6">
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
                <p className="text-xs text-gray-500">Giờ bán món</p>
                <p className="text-sm font-medium text-gray-900">
                  {product.availableFrom || '00:00'} - {product.availableTo || '23:59'}
                </p>
              </div>
            </div>
          </div>

          {/* Sizes Selection */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="mb-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Chọn kích cỡ (Size)</h3>
              <div className="flex flex-wrap gap-2.5">
                {product.sizes.map((size) => (
                  <button
                    key={size.id}
                    onClick={() => setSelectedSize(size.sizeName)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 border ${
                      selectedSize === size.sizeName
                        ? 'border-orange-500 bg-orange-50 text-orange-600 font-bold'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {selectedSize === size.sizeName && <Check className="w-3.5 h-3.5" />}
                    {size.sizeName}
                    {size.extraPrice !== 0 && (
                      <span className="text-xs text-gray-400 font-normal">
                        ({size.extraPrice > 0 ? '+' : ''}
                        {formatCurrency(size.extraPrice)})
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Toppings Selection */}
          {product.toppings && product.toppings.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Chọn món ăn kèm (Topping)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {product.toppings.map((topping) => {
                  const tName = topping.name || (topping as any).toppingName;
                  const isChecked = selectedToppings.includes(tName);
                  return (
                    <button
                      key={topping.id}
                      onClick={() => handleToppingToggle(tName)}
                      className={`flex items-center justify-between p-3 rounded-xl border text-sm text-left transition-all ${
                        isChecked
                          ? 'border-orange-500 bg-orange-50/50 text-orange-700 font-semibold'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                          isChecked ? 'border-orange-500 bg-orange-500 text-white' : 'border-gray-300 bg-white'
                        }`}>
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </span>
                        {tName}
                      </span>
                      <span className="text-gray-500 font-medium">+{formatCurrency(topping.price)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {product.description && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-1.5">Mô tả món ăn</h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                {product.description}
              </p>
            </div>
          )}

          <Button
            size="lg"
            className="w-full mt-auto h-13 shadow-lg shadow-orange-500/25 bg-gradient-to-r from-orange-500 to-orange-600 border-0"
            disabled={product.stockStatus === 'OutOfStock' || !product.isAvailableNow}
            onClick={handleAddToCart}
          >
            <ShoppingCart className="w-5 h-5" />
            {product.stockStatus === 'OutOfStock'
              ? 'Hết hàng'
              : !product.isAvailableNow
              ? 'Chưa tới giờ mở bán'
              : 'Thêm vào giỏ'}
          </Button>
        </div>
      </div>

      {/* Reviews Section */}
      <ProductReviews productId={product.id} restaurantId={product.restaurantId} />

      {/* Report Violation Modal */}
      <Modal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} title="Báo cáo món ăn vi phạm" size="md">
        <form onSubmit={handleReportSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Lý do báo cáo</label>
            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all"
            >
              <option value="Vệ sinh an toàn thực phẩm">Vệ sinh an toàn thực phẩm</option>
              <option value="Món ăn không giống mô tả">Món ăn không giống mô tả</option>
              <option value="Hình ảnh giả mạo/không chính chủ">Hình ảnh giả mạo/không chính chủ</option>
              <option value="Giá cả bất hợp lý">Giá cả bất hợp lý</option>
              <option value="Món ăn chứa nội dung vi phạm pháp luật">Món ăn chứa nội dung vi phạm pháp luật</option>
              <option value="Khác">Lý do khác</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Chi tiết vi phạm</label>
            <textarea
              value={reportDetail}
              onChange={(e) => setReportDetail(e.target.value)}
              placeholder="Vui lòng cung cấp thêm thông tin chi tiết về hành vi vi phạm..."
              rows={4}
              required
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsReportOpen(false)} disabled={isSubmittingReport}>
              Hủy
            </Button>
            <Button type="submit" variant="danger" isLoading={isSubmittingReport} disabled={isSubmittingReport}>
              Gửi báo cáo
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
