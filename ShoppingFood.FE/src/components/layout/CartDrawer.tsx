import { useState } from 'react';
import { ShoppingCart, X, Plus, Minus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart, useAuth } from '../../hooks';
import { Button } from '../common';
import { ROUTES } from '../../routes/routeConfig';
import { formatCurrency } from '../../utils/formatters';

export function CartDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const { items, totalItems, totalPrice, updateQuantity, removeItem } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleCheckout = () => {
    setIsOpen(false);
    if (!isAuthenticated) {
      // If not authenticated, go to login. Real app might pass ?returnUrl=/checkout
      navigate(ROUTES.LOGIN);
    } else {
      // Go to checkout
      navigate('/checkout'); // Assuming a checkout route will be added
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="relative p-2 rounded-xl text-gray-600 hover:text-orange-600 hover:bg-gray-100 transition-colors"
      >
        <ShoppingCart className="w-5 h-5" />
        {totalItems > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-orange-500 text-[10px] font-bold text-gray-900 flex items-center justify-center">
            {totalItems}
          </span>
        )}
      </button>

      {/* Drawer Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsOpen(false)}
          />
          <section className="absolute inset-y-0 right-0 max-w-full flex">
            <div className="w-screen max-w-md">
              <div className="h-full flex flex-col bg-white shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-6 sm:px-6 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Giỏ hàng của bạn</h2>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-400 hover:text-gray-500 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Items */}
                <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
                  {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                      <ShoppingCart className="w-16 h-16 mb-4 text-gray-300" />
                      <p>Giỏ hàng đang trống</p>
                    </div>
                  ) : (
                    <ul className="space-y-6">
                      {items.map((item) => (
                        <li key={item.product.id} className="flex gap-4">
                          <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                            {item.product.primaryImageUrl ? (
                              <img src={item.product.primaryImageUrl} alt={item.product.itemName} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-2xl">🍜</div>
                            )}
                          </div>
                          <div className="flex-1 flex flex-col">
                            <div className="flex justify-between font-medium text-gray-900 mb-1">
                              <h3 className="line-clamp-2 text-sm">{item.product.itemName}</h3>
                              <p className="ml-4 whitespace-nowrap text-orange-600">{formatCurrency(item.product.price * item.quantity)}</p>
                            </div>
                            <p className="text-xs text-gray-500 mb-2">{item.product.restaurantName}</p>
                            
                            <div className="flex items-center justify-between mt-auto">
                              <div className="flex items-center gap-3 border border-gray-200 rounded-lg p-1">
                                <button
                                  onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                  className="p-1 text-gray-400 hover:text-gray-600"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                                <button
                                  onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                  className="p-1 text-gray-400 hover:text-gray-600"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                              <button
                                onClick={() => removeItem(item.product.id)}
                                className="text-red-500 hover:text-red-600 p-2"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Footer */}
                {items.length > 0 && (
                  <div className="border-t border-gray-200 px-4 py-6 sm:px-6">
                    <div className="flex justify-between text-base font-medium text-gray-900 mb-4">
                      <p>Tổng cộng</p>
                      <p className="text-orange-600 text-xl font-bold">{formatCurrency(totalPrice)}</p>
                    </div>
                    <p className="text-sm text-gray-500 mb-6">Phí vận chuyển và thuế sẽ được tính khi thanh toán.</p>
                    <Button onClick={handleCheckout} className="w-full" size="lg">
                      Thanh toán
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
