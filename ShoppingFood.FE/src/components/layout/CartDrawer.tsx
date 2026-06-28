import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
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
    return groupedItems[selectedProvider].items.reduce((sum, item) => {
      let itemPrice = item.product.price;
      if (item.selectedSize) {
        const sizeOpt = item.product.sizes?.find(s => s.sizeName === item.selectedSize);
        if (sizeOpt) itemPrice += sizeOpt.extraPrice;
      }
      if (item.selectedToppings && item.selectedToppings.length > 0) {
        item.selectedToppings.forEach(topName => {
          const topOpt = item.product.toppings?.find(t => t.name === topName || (t as any).toppingName === topName);
          if (topOpt) itemPrice += topOpt.price;
        });
      }
      return sum + (itemPrice * item.quantity);
    }, 0);
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
        className="relative p-2.5 rounded-2xl text-gray-700 hover:text-orange-600 hover:bg-orange-50 transition-all duration-300 group"
      >
        <ShoppingCart className="w-5 h-5 group-hover:scale-110 transition-transform" />
        {totalItems > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-r from-orange-500 to-rose-500 text-[11px] font-bold text-white flex items-center justify-center shadow-md border-2 border-white">
            {totalItems}
          </span>
        )}
      </button>

      {isOpen && createPortal(
        <div className="fixed inset-0 z-[9999] overflow-hidden font-sans">
          <div
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 w-full max-w-md h-full flex flex-col bg-white/95 backdrop-blur-xl shadow-2xl overflow-hidden sm:rounded-l-3xl border-l border-white/20 transform transition-transform duration-300 ease-in-out">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100/50 bg-white/50 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                      <ShoppingCart className="w-5 h-5 text-orange-600" />
                    </div>
                    <h2 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                      Giỏ hàng
                    </h2>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-6 bg-gray-50/30 space-y-6 scrollbar-thin scrollbar-thumb-gray-200">
                  {groups.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-4">
                      <div className="w-24 h-24 rounded-full bg-gray-50 flex items-center justify-center shadow-inner">
                        <ShoppingCart className="w-10 h-10 text-gray-300" />
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-medium text-gray-600">Giỏ hàng trống</p>
                        <p className="text-sm mt-1">Hãy thêm món ăn ngon vào giỏ nhé!</p>
                      </div>
                      <Button onClick={() => setIsOpen(false)} variant="secondary" className="mt-4 rounded-full px-6">
                        Tiếp tục tìm kiếm
                      </Button>
                    </div>
                  ) : (
                    groups.map((group) => {
                      const isSelected = selectedProvider === group.restaurantId;
                      return (
                        <div 
                          key={group.restaurantId} 
                          className={`bg-white rounded-3xl transition-all duration-300 overflow-hidden ${
                            isSelected 
                              ? 'ring-2 ring-orange-500 shadow-xl shadow-orange-500/10' 
                              : 'border border-gray-100 hover:border-orange-200 opacity-70 hover:opacity-100 hover:shadow-md'
                          }`}
                        >
                          <label className="flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-gray-50 to-white cursor-pointer border-b border-gray-50">
                            <div className="relative flex items-center justify-center">
                              <input 
                                type="radio" 
                                name="cart_provider" 
                                className="peer sr-only"
                                checked={isSelected}
                                onChange={() => setSelectedProvider(group.restaurantId)}
                              />
                              <div className="w-5 h-5 rounded-full border-2 border-gray-300 peer-checked:border-orange-500 peer-checked:bg-orange-500 transition-colors flex items-center justify-center">
                                {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                              </div>
                            </div>
                            <div className="flex items-center gap-2.5 flex-1">
                              <div className={`p-2 rounded-lg ${isSelected ? 'bg-orange-100' : 'bg-gray-100'}`}>
                                <Store className={`w-4 h-4 ${isSelected ? 'text-orange-600' : 'text-gray-500'}`} />
                              </div>
                              <h3 className="font-bold text-gray-900 text-base line-clamp-1">{group.restaurantName}</h3>
                            </div>
                          </label>

                          <ul className="p-2 space-y-2">
                            {group.items.map((item) => {
                              let itemUnitPrice = item.product.price;
                              if (item.selectedSize) {
                                const sizeOpt = item.product.sizes?.find(s => s.sizeName === item.selectedSize);
                                if (sizeOpt) itemUnitPrice += sizeOpt.extraPrice;
                              }
                              if (item.selectedToppings && item.selectedToppings.length > 0) {
                                item.selectedToppings.forEach(topName => {
                                  const topOpt = item.product.toppings?.find(t => t.name === topName || (t as any).toppingName === topName);
                                  if (topOpt) itemUnitPrice += topOpt.price;
                                });
                              }

                              const itemKey = `${item.product.id}-${item.selectedSize || 'default'}-${item.selectedToppings?.sort().join(',') || ''}`;

                              return (
                                <li key={itemKey} className="flex gap-4 p-3 rounded-2xl hover:bg-gray-50 transition-colors group/item">
                                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 shadow-sm relative">
                                    {item.product.primaryImageUrl ? (
                                      <img src={item.product.primaryImageUrl} alt={item.product.itemName} className="w-full h-full object-cover transition-transform duration-500 group-hover/item:scale-110" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-2xl">🍜</div>
                                    )}
                                  </div>
                                  <div className="flex-1 flex flex-col py-1">
                                    <div className="flex justify-between items-start gap-2 mb-1">
                                      <h4 className="font-semibold text-gray-800 text-sm line-clamp-2 leading-tight">{item.product.itemName}</h4>
                                      <button
                                        onClick={() => removeItem(item.product.id, item.selectedSize, item.selectedToppings)}
                                        className="text-gray-300 hover:text-rose-500 transition-colors mt-0.5"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>

                                    {(item.selectedSize || (item.selectedToppings && item.selectedToppings.length > 0)) && (
                                      <div className="flex flex-wrap gap-1 mb-2">
                                        {item.selectedSize && (
                                          <span className="text-[10px] font-semibold bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded">
                                            Size: {item.selectedSize}
                                          </span>
                                        )}
                                        {item.selectedToppings?.map((topping, idx) => (
                                          <span key={idx} className="text-[10px] font-medium bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                                            +{topping}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                    
                                    <div className="flex items-end justify-between mt-auto">
                                      <p className="text-orange-600 font-bold tracking-tight">
                                        {formatCurrency(itemUnitPrice * item.quantity)}
                                      </p>
                                      <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-full p-1 shadow-sm">
                                        <button
                                          onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.selectedSize, item.selectedToppings)}
                                          className="w-7 h-7 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                                        >
                                          <Minus className="w-3 h-3" />
                                        </button>
                                        <span className="text-sm font-semibold w-6 text-center text-gray-900">{item.quantity}</span>
                                        <button
                                          onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.selectedSize, item.selectedToppings)}
                                          className="w-7 h-7 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                                        >
                                          <Plus className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      );
                    })
                  )}
                </div>

                {groups.length > 0 && (
                  <div className="border-t border-gray-100 bg-white p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-10">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-gray-500 font-medium">Tổng thanh toán</p>
                      <p className="text-orange-600 text-2xl font-black tracking-tight">{formatCurrency(selectedTotal)}</p>
                    </div>
                    <div className="flex items-center gap-2 mb-5">
                      <div className="h-1 flex-1 bg-orange-100 rounded-full overflow-hidden">
                        <div className="h-full bg-orange-500 w-full rounded-full" />
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mb-5 text-center flex items-center justify-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
                      Chỉ thanh toán 1 nhà hàng mỗi lần
                    </p>
                    <Button 
                      onClick={handleCheckout} 
                      className="w-full h-14 rounded-2xl text-base font-bold shadow-lg shadow-orange-500/30 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 border-0" 
                      disabled={!selectedProvider}
                    >
                      Tiến hành thanh toán
                    </Button>
                  </div>
                )}
              </div>
        </div>,
        document.body
      )}
    </>
  );
}
