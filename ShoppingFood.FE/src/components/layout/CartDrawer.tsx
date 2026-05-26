import { useState, useMemo } from 'react';
import { ShoppingCart, X, Plus, Minus, Trash2, Store } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart, useAuth } from '../../hooks';
import { Button } from '../common';
import { ROUTES } from '../../routes/routeConfig';
import { formatCurrency } from '../../utils/formatters';
import type { ICartItem } from '../../interfaces';

export function CartDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const { items, totalItems, updateQuantity, removeItem } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Group items by restaurant
  const groupedItems = useMemo(() => {
    return items.reduce((acc, item) => {
      const restId = item.product.restaurantId;
      if (!acc[restId]) {
        acc[restId] = {
          restaurantId: restId,
          restaurantName: item.product.restaurantName,
          items: []
        };
      }
      acc[restId].items.push(item);
      return acc;
    }, {} as Record<string, { restaurantId: string; restaurantName: string; items: ICartItem[] }>);
  }, [items]);

  const groups = Object.values(groupedItems);
  
  // State for which restaurant is selected for checkout
  const [selectedProvider, setSelectedProvider] = useState<string | null>(
    groups.length > 0 ? groups[0].restaurantId : null
  );

  // If selected provider is no longer in cart, reset
  if (selectedProvider && !groupedItems[selectedProvider] && groups.length > 0) {
    setSelectedProvider(groups[0].restaurantId);
  } else if (!selectedProvider && groups.length > 0) {
    setSelectedProvider(groups[0].restaurantId);
  }

  // Calculate selected total
  const selectedTotal = useMemo(() => {
    if (!selectedProvider || !groupedItems[selectedProvider]) return 0;
    return groupedItems[selectedProvider].items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  }, [selectedProvider, groupedItems]);

  const handleCheckout = () => {
    if (!selectedProvider) return;
    
    setIsOpen(false);
    if (!isAuthenticated) {
      navigate(ROUTES.LOGIN);
    } else {
      navigate('/checkout'); 
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
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-orange-500 text-[10px] font-bold text-white flex items-center justify-center">
            {totalItems}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsOpen(false)}
          />
          <section className="absolute inset-y-0 right-0 max-w-full flex">
            <div className="w-screen max-w-md">
              <div className="h-full flex flex-col bg-white shadow-xl">
                <div className="flex items-center justify-between px-4 py-6 sm:px-6 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Giỏ hàng của bạn</h2>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-400 hover:text-gray-500 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 bg-gray-50/50">
                  {groups.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                      <ShoppingCart className="w-16 h-16 mb-4 text-gray-300" />
                      <p>Giỏ hàng đang trống</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {groups.map((group) => {
                        const isSelected = selectedProvider === group.restaurantId;
                        return (
                          <div 
                            key={group.restaurantId} 
                            className={`bg-white rounded-2xl border-2 transition-all ${
                              isSelected ? 'border-orange-500 shadow-sm' : 'border-gray-200 hover:border-orange-300 opacity-60 hover:opacity-100'
                            }`}
                          >
                            {/* Group Header */}
                            <label className="flex items-center gap-3 p-4 border-b border-gray-100 cursor-pointer">
                              <input 
                                type="radio" 
                                name="cart_provider" 
                                className="w-5 h-5 text-orange-600 focus:ring-orange-500 cursor-pointer"
                                checked={isSelected}
                                onChange={() => setSelectedProvider(group.restaurantId)}
                              />
                              <div className="flex items-center gap-2 flex-1">
                                <Store className={`w-5 h-5 ${isSelected ? 'text-orange-500' : 'text-gray-400'}`} />
                                <h3 className="font-bold text-gray-900">{group.restaurantName}</h3>
                              </div>
                            </label>

                            {/* Items */}
                            <ul className="p-4 space-y-4">
                              {group.items.map((item) => (
                                <li key={item.product.id} className="flex gap-4">
                                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
                                    {item.product.primaryImageUrl ? (
                                      <img src={item.product.primaryImageUrl} alt={item.product.itemName} className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-xl">🍜</div>
                                    )}
                                  </div>
                                  <div className="flex-1 flex flex-col">
                                    <div className="flex justify-between font-medium text-gray-900 mb-1">
                                      <h4 className="line-clamp-2 text-sm">{item.product.itemName}</h4>
                                      <p className="ml-4 whitespace-nowrap text-orange-600 font-bold">{formatCurrency(item.product.price * item.quantity)}</p>
                                    </div>
                                    
                                    <div className="flex items-center justify-between mt-auto">
                                      <div className="flex items-center gap-3 border border-gray-200 rounded-lg p-1 bg-gray-50">
                                        <button
                                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                          className="p-1 text-gray-500 hover:text-orange-600 transition-colors"
                                        >
                                          <Minus className="w-3 h-3" />
                                        </button>
                                        <span className="text-sm font-medium w-4 text-center text-gray-900">{item.quantity}</span>
                                        <button
                                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                          className="p-1 text-gray-500 hover:text-orange-600 transition-colors"
                                        >
                                          <Plus className="w-3 h-3" />
                                        </button>
                                      </div>
                                      <button
                                        onClick={() => removeItem(item.product.id)}
                                        className="text-gray-400 hover:text-red-500 p-2 transition-colors"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {groups.length > 0 && (
                  <div className="border-t border-gray-200 bg-white px-4 py-6 sm:px-6">
                    <div className="flex justify-between text-base font-medium text-gray-900 mb-4">
                      <p>Tổng (Đơn chọn)</p>
                      <p className="text-orange-600 text-xl font-bold">{formatCurrency(selectedTotal)}</p>
                    </div>
                    <p className="text-sm text-gray-500 mb-6 text-center">
                      Bạn chỉ có thể thanh toán một đơn hàng (một quán) cùng lúc.
                    </p>
                    <Button onClick={handleCheckout} className="w-full shadow-lg shadow-orange-500/25" size="lg" disabled={!selectedProvider}>
                      Tiến hành thanh toán
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
