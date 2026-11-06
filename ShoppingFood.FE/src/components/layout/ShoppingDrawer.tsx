import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-hot-toast';
import { ShoppingCart, X, Plus, Minus, Trash2, Store, Package, CheckCircle2, Truck, Clock, XCircle, ShoppingBag, ClipboardList, MessageCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart, useAuth } from '../../hooks';
import { Button, Input, ConfirmModal } from '../common';
import { ROUTES } from '../../routes/routeConfig';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { calcMemberTierDiscount } from '../../utils/memberTierDiscount';
import type { ICartItem, INotificationDto } from '../../interfaces';
import { orderService } from '../../services/OrderService';
import { CustomerOrderDetailModal } from '../order/CustomerOrderDetailModal';
import { notificationRealtimeService } from '../../services/NotificationRealtimeService';

export function ShoppingDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'cart' | 'orders'>('cart');
  const [clearCartConfirmModal, setClearCartConfirmModal] = useState(false);
  
  const { items, totalItems, updateQuantity, removeItem, clearCart } = useCart();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // ---------------------------------------------------------
  // CART LOGIC
  // ---------------------------------------------------------
  const groupedItems = useMemo(() => {
    return items.reduce((acc, item) => {
      const restId = item.product.restaurantId;
      if (!acc[restId]) {
        acc[restId] = { restaurantId: restId, restaurantName: item.product.restaurantName, items: [] };
      }
      acc[restId].items.push(item);
      return acc;
    }, {} as Record<string, { restaurantId: string; restaurantName: string; items: ICartItem[] }>);
  }, [items]);

  const groups = Object.values(groupedItems);

  const [selectedProvider, setSelectedProvider] = useState<string | null>(
    groups.length > 0 ? groups[0].restaurantId : null
  );

  useEffect(() => {
    if (selectedProvider && !groupedItems[selectedProvider] && groups.length > 0) {
      if (selectedProvider !== groups[0].restaurantId) setSelectedProvider(groups[0].restaurantId);
    } else if (!selectedProvider && groups.length > 0) {
      if (selectedProvider !== groups[0].restaurantId) setSelectedProvider(groups[0].restaurantId);
    }
  }, [selectedProvider, groupedItems, groups]);

  const selectedTotal = useMemo(() => {
    if (!selectedProvider || !groupedItems[selectedProvider]) return 0;
    return groupedItems[selectedProvider].items.reduce((sum, item) => {
      if (item.isGift) return sum;
      if (typeof item.priceAtAdded === 'number') {
        return sum + item.priceAtAdded * item.quantity;
      }
      let itemPrice = item.product.flashSalePrice ?? item.product.price;
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

  const selectedHasFlashSale = useMemo(() => {
    if (!selectedProvider || !groupedItems[selectedProvider]) return false;
    return groupedItems[selectedProvider].items.some((item) => item.product.flashSalePrice != null);
  }, [selectedProvider, groupedItems]);

  const selectedTierDiscount = useMemo(() => {
    if (!isAuthenticated || selectedHasFlashSale) return 0;
    return calcMemberTierDiscount(selectedTotal, user?.tier).amount;
  }, [isAuthenticated, selectedHasFlashSale, selectedTotal, user?.tier]);

  const selectedPayTotal = Math.max(0, selectedTotal - selectedTierDiscount);

  const handleCheckout = () => {
    if (!selectedProvider) return;
    const selectedGroup = groupedItems[selectedProvider];
    if (selectedGroup && selectedGroup.items.some(item => item.isProductDeleted)) {
      toast.error('Vui lòng xóa các món đã ngừng bán khỏi giỏ hàng trước khi thanh toán');
      return;
    }

    setIsOpen(false);
    const checkoutUrl = `${ROUTES.CHECKOUT}?restaurantId=${selectedProvider}`;
    navigate(checkoutUrl);
  };

  // ---------------------------------------------------------
  // ORDER TRACKING LOGIC
  // ---------------------------------------------------------
  const [orderCode, setOrderCode] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [detailModal, setDetailModal] = useState({ isOpen: false, orderId: '', openChat: false });
  
  const [skip, setSkip] = useState(0);
  const take = 10;
  const [hasMore, setHasMore] = useState(true);

  // Auto open orders tab if query param has track=true or orderId
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const orderId = searchParams.get('orderId');
    const openChat = searchParams.get('openChat') === '1';
    if (searchParams.get('track') === 'true' || orderId) {
      setIsOpen(true);
      setActiveTab('orders');
      if (orderId) {
        if (openChat) {
          sessionStorage.setItem(`sf_open_chat_${orderId}`, '1');
        }
        setDetailModal({ isOpen: true, orderId, openChat });
        // Xóa query để không mở lại khi refresh / back
        const next = new URLSearchParams(location.search);
        next.delete('orderId');
        next.delete('openChat');
        next.delete('track');
        const qs = next.toString();
        window.history.replaceState({}, '', `${location.pathname}${qs ? `?${qs}` : ''}`);
      }
    }
  }, [location.search, location.pathname]);

  // Listen for custom event to switch to cart tab
  useEffect(() => {
    const handleOpenCartTab = () => setActiveTab('cart');
    window.addEventListener('openCartTab', handleOpenCartTab);
    return () => window.removeEventListener('openCartTab', handleOpenCartTab);
  }, []);

  // Listen for custom event to open order detail directly (optional openChat from notification)
  useEffect(() => {
    const handleOpenOrderDetail = (e: CustomEvent<string | { orderId?: string; openChat?: boolean }>) => {
      setIsOpen(true);
      setActiveTab('orders');
      const detail = e.detail;
      if (typeof detail === 'string' && detail) {
        setDetailModal({ isOpen: true, orderId: detail, openChat: false });
        return;
      }
      if (detail && typeof detail === 'object' && detail.orderId) {
        setDetailModal({
          isOpen: true,
          orderId: detail.orderId,
          openChat: !!detail.openChat,
        });
      }
    };
    window.addEventListener('openOrdersTabWithDetail', handleOpenOrderDetail as EventListener);
    return () => window.removeEventListener('openOrdersTabWithDetail', handleOpenOrderDetail as EventListener);
  }, []);

  useEffect(() => {
    if (isOpen && activeTab === 'orders') {
      setSkip(0);
      setHasMore(true);
      fetchOrders(false, 0);
    }
  }, [isOpen, activeTab, isAuthenticated]);

  useEffect(() => {
    const handleNotification = (notif: INotificationDto) => {
      if (notif.targetId && isOpen && activeTab === 'orders') {
        fetchOrders(false, 0);
      }
    };
    notificationRealtimeService.onNotification(handleNotification);
    return () => {
      notificationRealtimeService.offNotification(handleNotification);
    };
  }, [isOpen, activeTab]);

  const fetchOrders = async (isLoadMore = false, currentSkip = 0) => {
    if (isLoadMore) setIsLoadingMore(true);
    else setIsLoading(true);
    
    try {
      let res;
      if (isAuthenticated) {
        res = await orderService.getMyOrders({ skip: currentSkip, take });
      } else {
        const guestUserId = localStorage.getItem('sf_guest_id');
        if (guestUserId) {
          res = await orderService.getGuestOrders(guestUserId, { skip: currentSkip, take });
        }
      }
      
      if (res && !res.error && res.data) {
        if (isLoadMore) setOrders(prev => [...prev, ...res.data]);
        else setOrders(res.data);
        
        setHasMore(res.data.length === take);
        setSkip(currentSkip);
      } else if (!isLoadMore) {
        setOrders([]);
        setHasMore(false);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!hasMore || isLoadingMore) return;
    fetchOrders(true, skip + take);
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'preparing': return <Package className="w-5 h-5 text-blue-500" />;
      case 'shipping': return <Truck className="w-5 h-5 text-purple-500" />;
      case 'delivered': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'cancelled': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'Đang chờ xử lý';
      case 'confirmed': return 'Đã xác nhận';
      case 'preparing': return 'Đang chuẩn bị';
      case 'waitingforshipper': return 'Chờ tài xế';
      case 'shipping': return 'Đang giao hàng';
      case 'delivered': return 'Đã giao thành công';
      case 'cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  const getStatusColorClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'text-yellow-600';
      case 'preparing': return 'text-blue-600';
      case 'shipping': return 'text-purple-600';
      case 'delivered': return 'text-green-600';
      case 'cancelled': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <>
      <button
        onClick={() => { setIsOpen(true); setActiveTab('cart'); }}
        className="relative p-2.5 rounded-2xl text-gray-700 hover:text-orange-600 hover:bg-orange-50 transition-all duration-300 group"
        title="Giỏ hàng & Đơn hàng"
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
            <div className="px-4 pt-4 pb-2 border-b border-gray-100/50 bg-white/50 shrink-0">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent px-2">
                  Hoạt động
                </h2>
                <div className="flex items-center gap-2">
                  {activeTab === 'cart' && groups.length > 0 && (
                    <button
                      onClick={() => setClearCartConfirmModal(true)}
                      className="text-xs font-medium text-red-500 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-full transition-colors"
                    >
                      Xóa tất cả
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              {/* Custom Tabs */}
              <div className="flex bg-gray-100/70 p-1 rounded-xl">
                <button
                  onClick={() => setActiveTab('cart')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${
                    activeTab === 'cart' 
                      ? 'bg-white text-orange-600 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <ShoppingCart className="w-4 h-4" />
                  Giỏ hàng {totalItems > 0 ? `(${totalItems})` : ''}
                </button>
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${
                    activeTab === 'orders' 
                      ? 'bg-white text-orange-600 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <ClipboardList className="w-4 h-4" />
                  Đơn hàng
                </button>
              </div>
            </div>

            {/* TAB CONTENT: CART */}
            {activeTab === 'cart' && (
              <>
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
                          className={`bg-white rounded-3xl transition-all duration-300 overflow-hidden ${isSelected
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
                            {(() => {
                              const renderItems = group.items.filter((i) => !i.isGift);
                              return renderItems.map((item, idx) => {
                              const giftChildren = item.buyXGetYPromotionId
                                ? group.items.filter(
                                    (g) =>
                                      g.isGift &&
                                      (g.parentCartItemId === item.id ||
                                        g.buyXGetYPromotionId === item.buyXGetYPromotionId)
                                  )
                                : [];

                              let itemUnitPrice =
                                typeof item.priceAtAdded === 'number'
                                  ? item.priceAtAdded
                                  : (item.product.flashSalePrice ?? item.product.price);
                              if (typeof item.priceAtAdded !== 'number') {
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
                              }

                              const itemKey = item.id || `${item.product.id}-${item.selectedSize || 'default'}-${idx}`;
                              const bundleTotalQty = item.quantity + giftChildren.reduce((s, g) => s + g.quantity, 0);

                              return (
                                <li key={itemKey} className="flex gap-4 p-3 rounded-2xl hover:bg-gray-50 transition-colors group/item">
                                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 shadow-sm relative">
                                    {item.product.primaryImageUrl ? (
                                      <img src={item.product.primaryImageUrl} alt={item.product.itemName} className={`w-full h-full object-cover transition-transform duration-500 group-hover/item:scale-110 ${item.isProductDeleted ? 'opacity-50 grayscale' : ''}`} />
                                    ) : (
                                      <div className={`w-full h-full flex items-center justify-center text-2xl ${item.isProductDeleted ? 'opacity-50 grayscale' : ''}`}>🍜</div>
                                    )}
                                    {item.isProductDeleted && (
                                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                        <span className="text-[10px] font-bold text-white uppercase tracking-wider px-1 text-center leading-tight">Ngừng bán</span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1 flex flex-col py-1">
                                    <div className="flex justify-between items-start gap-2 mb-1">
                                      <div className="min-w-0">
                                        <h4 className={`font-semibold text-sm line-clamp-2 leading-tight ${item.isProductDeleted ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{item.product.itemName}</h4>
                                        {item.promotionLabel && (
                                          <span className="inline-block mt-1 text-[10px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">
                                            {item.promotionLabel}
                                          </span>
                                        )}
                                      </div>
                                      <button
                                        onClick={() => removeItem(item.product.id, item.selectedSize, item.selectedToppings)}
                                        className="text-gray-300 hover:text-rose-500 transition-colors mt-0.5"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>

                                    {giftChildren.length > 0 && (
                                      <div className="mb-2 mt-1 rounded-xl bg-orange-50/70 border border-orange-100 px-2.5 py-2 space-y-1">
                                        <p className="text-[11px] font-semibold text-orange-700">
                                          Combo {bundleTotalQty} xuất · trả {item.quantity} món
                                        </p>
                                        <p className="text-[11px] text-gray-600">
                                          {item.quantity}× {item.product.itemName}
                                        </p>
                                        {giftChildren.map((g) => (
                                          <p key={g.id || g.product.id} className="text-[11px] text-emerald-700 font-medium">
                                            Tặng {g.quantity}× {g.product.itemName}
                                          </p>
                                        ))}
                                      </div>
                                    )}

                                    {(item.selectedSize || (item.selectedToppings && item.selectedToppings.length > 0)) && (
                                      <div className="flex flex-wrap gap-1 mb-2">
                                        {item.selectedSize && (
                                          <span className="text-[10px] font-semibold bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded">
                                            Size: {item.selectedSize}
                                          </span>
                                        )}
                                        {item.selectedToppings?.map((topping, tIdx) => (
                                          <span key={tIdx} className="text-[10px] font-medium bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                                            +{topping}
                                          </span>
                                        ))}
                                      </div>
                                    )}

                                    <div className="flex items-end justify-between mt-auto">
                                      <p className={`font-bold tracking-tight ${item.isProductDeleted ? 'text-gray-400' : 'text-orange-600'}`}>
                                        {formatCurrency(itemUnitPrice * item.quantity)}
                                      </p>
                                      {item.isProductDeleted ? (
                                        <div className="flex items-center">
                                          <span className="text-xs text-red-500 font-medium">Vui lòng xóa món</span>
                                        </div>
                                      ) : item.buyXGetYPromotionId ? (
                                        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-full p-1 shadow-sm">
                                          <button
                                            onClick={() => {
                                              const step = Math.max(1, Number(item.promoBuyQuantity) || 1);
                                              updateQuantity(item.product.id, item.quantity - step, item.selectedSize, item.selectedToppings);
                                            }}
                                            className="w-7 h-7 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                                          >
                                            <Minus className="w-3 h-3" />
                                          </button>
                                          <span className="text-sm font-semibold w-6 text-center text-gray-900">
                                            {Math.max(1, Math.round(item.quantity / Math.max(1, Number(item.promoBuyQuantity) || 1)))}
                                          </span>
                                          <button
                                            onClick={() => {
                                              const step = Math.max(1, Number(item.promoBuyQuantity) || 1);
                                              updateQuantity(item.product.id, item.quantity + step, item.selectedSize, item.selectedToppings);
                                            }}
                                            className="w-7 h-7 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                                          >
                                            <Plus className="w-3 h-3" />
                                          </button>
                                        </div>
                                      ) : (
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
                                      )}
                                    </div>
                                  </div>
                                </li>
                              );
                            });
                            })()}
                          </ul>
                        </div>
                      );
                    })
                  )}
                </div>

                {groups.length > 0 && (
                  <div className="border-t border-gray-100 bg-white p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-10">
                    <div className="space-y-1.5 mb-2">
                      <div className="flex items-center justify-between">
                        <p className="text-gray-500 font-medium">Tạm tính món</p>
                        <p className="text-gray-900 font-semibold">{formatCurrency(selectedTotal)}</p>
                      </div>
                      {selectedTierDiscount > 0 && (
                        <div className="flex items-center justify-between text-violet-700">
                          <p className="font-medium">Chiết khấu điểm hạng</p>
                          <p className="font-semibold">-{formatCurrency(selectedTierDiscount)}</p>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <p className="text-gray-500 font-medium">Tổng thanh toán</p>
                        <p className="text-orange-600 text-2xl font-black tracking-tight">{formatCurrency(selectedPayTotal)}</p>
                      </div>
                      {selectedTierDiscount > 0 && (
                        <p className="text-[11px] text-violet-600 text-right">Ưu đãi hạng áp dụng lúc đặt hàng (chưa gồm phí ship / mã giảm)</p>
                      )}
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
                    <button
                      type="button"
                      onClick={() => {
                        if (!selectedProvider) return;
                        setIsOpen(false);
                        navigate(`${ROUTES.GROUP_ORDERS}?restaurant=${selectedProvider}&fromCart=1`);
                      }}
                      disabled={!selectedProvider}
                      className="mt-2 w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-orange-300 text-orange-600 text-sm font-bold hover:bg-orange-50 disabled:opacity-50"
                    >
                      Tạo đơn nhóm với giỏ này (chia ship, giao tận phòng)
                    </button>
                  </div>
                )}
              </>
            )}

            {/* TAB CONTENT: ORDERS */}
            {activeTab === 'orders' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50/50 scrollbar-thin scrollbar-thumb-gray-200">
                <div className="space-y-3 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                  <p className="text-sm text-gray-600 font-medium">Nhập mã đơn hàng để tìm nhanh</p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="VD: ABCD-1234..."
                      value={orderCode}
                      onChange={e => setOrderCode(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-gray-500" />
                    Lịch sử mua hàng của bạn
                  </h3>
                  
                  {isLoading ? (
                    <div className="text-center py-10 text-gray-500">Đang tải lịch sử...</div>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-10 bg-white rounded-xl border border-dashed">
                      <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">Chưa có đơn hàng nào gần đây</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {(() => {
                        const filtered = orderCode.trim() 
                          ? orders.filter(o => o.id.substring(0, 8).toLowerCase().includes(orderCode.trim().toLowerCase().replace(/^#/, ''))) 
                          : orders;
                          
                        if (filtered.length === 0) {
                          return (
                            <div className="text-center py-8 text-gray-500">
                              Không tìm thấy đơn hàng nào khớp với mã "{orderCode}" trong lịch sử.
                            </div>
                          );
                        }
                        
                        return (
                          <>
                            {filtered.map(order => (
                              <div 
                                key={order.id} 
                                onClick={() => setDetailModal({ isOpen: true, orderId: order.id, openChat: false })}
                                className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:border-orange-200 cursor-pointer transition-colors"
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <span className="font-semibold text-gray-800">#{order.id.substring(0, 8).toUpperCase()}</span>
                                    <p className="text-xs text-gray-500 mt-1">{formatDate(order.createdAt)}</p>
                                  </div>
                                  <div className={`flex items-center gap-1.5 text-sm font-bold ${getStatusColorClass(order.status)}`}>
                                    {getStatusIcon(order.status)}
                                    <span>{getStatusText(order.status)}</span>
                                  </div>
                                </div>
                                <div className="flex justify-between items-end mt-4 pt-3 border-t border-gray-50 gap-2">
                                  <p className="text-sm text-gray-600 truncate flex-1 pr-2">{order.restaurantName}</p>
                                  <p className="font-bold text-orange-600 shrink-0">{formatCurrency(order.totalAmount)}</p>
                                </div>
                                {(order.canMessageSeller || order.orderChatSessionId) && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDetailModal({ isOpen: true, orderId: order.id, openChat: true });
                                    }}
                                    className="mt-3 w-full flex items-center justify-center gap-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-lg py-2 transition-colors"
                                  >
                                    <MessageCircle className="w-4 h-4" />
                                    {order.orderChatSessionId ? 'Mở chat với người bán' : 'Nhắn người bán'}
                                  </button>
                                )}
                              </div>
                            ))}
                            
                            {hasMore && filtered.length >= take && (
                              <div className="flex justify-center pt-2 pb-4">
                                <Button 
                                  variant="outline" 
                                  onClick={handleLoadMore} 
                                  disabled={isLoadingMore}
                                  className="w-full text-sm border-gray-200 text-orange-600 hover:bg-orange-50 hover:border-orange-200"
                                >
                                  {isLoadingMore ? 'Đang tải thêm...' : 'Xem thêm đơn cũ'}
                                </Button>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      <CustomerOrderDetailModal
        isOpen={detailModal.isOpen}
        onClose={() => {
          setDetailModal({ isOpen: false, orderId: '', openChat: false });
          if (activeTab === 'orders') fetchOrders(); // refresh after modal close
        }}
        onNavigateAction={() => setIsOpen(false)}
        orderId={detailModal.orderId}
        autoOpenChat={detailModal.openChat}
      />

      <ConfirmModal
        isOpen={clearCartConfirmModal}
        onClose={() => setClearCartConfirmModal(false)}
        onConfirm={() => {
          clearCart();
          setClearCartConfirmModal(false);
        }}
        title="Xóa giỏ hàng"
        description="Bạn có chắc chắn muốn xóa toàn bộ giỏ hàng?"
        confirmVariant="danger"
        confirmLabel="Xóa tất cả"
      />
    </>
  );
}
