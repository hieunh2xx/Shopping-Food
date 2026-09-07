import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { ICartContext, ICartItem, IProductDto } from '../interfaces';
import toast from 'react-hot-toast';
import { cartService } from '../services/CartService';
import { useAuth } from '../hooks/useAuth';

const GUEST_ID_KEY = 'sf_guest_id';
const CART_STORAGE_KEY = 'sf_cart'; // Lưu local storage để fallback và cập nhật giao diện lạc quan (optimistic)

/**
 * Context Giỏ hàng (CartContext).
 * Cung cấp dữ liệu giỏ hàng, tổng tiền, số lượng và các hàm thao tác thêm/sửa/xóa món.
 */
const CartContext = createContext<ICartContext | undefined>(undefined);

/**
 * Provider Quản lý Giỏ hàng toàn cục (CartProvider).
 * Tự động đồng bộ giỏ hàng với máy chủ backend (hỗ trợ cả khách vãng lai Guest và người dùng đã đăng nhập).
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<ICartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      // Lọc các phần tử lỗi để tránh crash ứng dụng
      return Array.isArray(parsed) ? parsed.filter(item => item && item.product && item.product.id) : [];
    } catch {
      return [];
    }
  });

  /**
   * Lấy hoặc tạo mới mã định danh khách vãng lai (Guest ID) lưu trong localStorage.
   */
  const getGuestUserId = useCallback(() => {
    let guestId = localStorage.getItem(GUEST_ID_KEY);
    if (!guestId && !isAuthenticated) {
      guestId = crypto.randomUUID();
      localStorage.setItem(GUEST_ID_KEY, guestId);
    }
    return guestId || undefined;
  }, [isAuthenticated]);

  // Đồng bộ trạng thái giỏ hàng vào localStorage để hiển thị lạc quan
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  /**
   * Tải dữ liệu giỏ hàng mới nhất từ máy chủ backend và chuẩn hóa dữ liệu giỏ hàng.
   */
  const fetchCart = useCallback(async () => {
    try {
      const guestUserId = getGuestUserId();
      // Người dùng đã đăng nhập vẫn truyền guestUserId để máy chủ tự động gộp giỏ hàng cũ của khách
      const res = await cartService.getCart(guestUserId);
      if (!res.error && res.data) {
        let apiItems: any[] = [];
        if (Array.isArray(res.data)) {
          apiItems = res.data;
        } else if (res.data.items && Array.isArray(res.data.items)) {
          apiItems = res.data.items;
        }

        const mappedItems: ICartItem[] = apiItems.map((apiItem: any) => {
          if (apiItem.product && apiItem.product.id) {
            return {
              ...apiItem,
              id: apiItem.id,
              priceAtAdded: apiItem.priceAtAdded,
              isGift: !!apiItem.isGift,
              buyXGetYPromotionId: apiItem.buyXGetYPromotionId,
              parentCartItemId: apiItem.parentCartItemId,
              promotionLabel: apiItem.promotionLabel,
              promoBuyQuantity: apiItem.promoBuyQuantity,
              promoGiftQuantity: apiItem.promoGiftQuantity,
            } as ICartItem;
          }
          
          return {
            id: apiItem.id,
            quantity: apiItem.quantity,
            isProductDeleted: apiItem.isProductDeleted,
            priceAtAdded: apiItem.priceAtAdded,
            isGift: !!apiItem.isGift,
            buyXGetYPromotionId: apiItem.buyXGetYPromotionId,
            parentCartItemId: apiItem.parentCartItemId,
            promotionLabel: apiItem.promotionLabel,
            promoBuyQuantity: apiItem.promoBuyQuantity,
            promoGiftQuantity: apiItem.promoGiftQuantity,
            product: {
              id: apiItem.productId,
              itemName: apiItem.productName || 'Sản phẩm',
              price: apiItem.priceAtAdded ?? 0,
              primaryImageUrl: apiItem.productImageUrl,
              restaurantId: apiItem.restaurantId || '',
              restaurantName: apiItem.restaurantName || '',
              description: null,
              categoryId: '',
              categoryName: '',
              stockStatus: 'InStock',
              status: 'Approved',
              images: [],
              toppings: apiItem.toppings || [],
              sizes: apiItem.sizes || [],
              createdAt: new Date().toISOString(),
              isHidden: false,
              averageRating: 0,
              reviewCount: 0,
              isFreeship: false,
              availableFrom: null,
              availableTo: null,
              isAvailableNow: true
            } as IProductDto,
            selectedSize: apiItem.selectedSize,
            selectedToppings: apiItem.selectedToppings ? apiItem.selectedToppings.split(', ') : []
          };
        });

        // Không gộp dòng khuyến mãi / quà tặng với món thông thường
        const deduped = mappedItems.reduce<ICartItem[]>((acc, item) => {
          if (!item?.product?.id) return acc;
          if (item.id || item.buyXGetYPromotionId || item.isGift) {
            acc.push(item);
            return acc;
          }
          const size = item.selectedSize || '';
          const tops = [...(item.selectedToppings || [])].sort().join(',');
          const existing = acc.find(
            (x) =>
              !x.buyXGetYPromotionId &&
              !x.isGift &&
              !x.id &&
              x.product.id === item.product.id &&
              (x.selectedSize || '') === size &&
              [...(x.selectedToppings || [])].sort().join(',') === tops
          );
          if (existing) {
            existing.quantity += item.quantity || 0;
          } else {
            acc.push(item);
          }
          return acc;
        }, []);

        setItems(deduped);
        return deduped;
      }
      // Dữ liệu trống, làm mới state
      setItems([]);
      return [];
    } catch (error) {
      console.error('Lỗi khi tải giỏ hàng:', error);
      return null;
    }
  }, [getGuestUserId]);

  // Tải giỏ hàng từ backend khi component mount hoặc khi đăng nhập/đăng xuất
  useEffect(() => {
    fetchCart();
  }, [fetchCart, isAuthenticated, getGuestUserId]);

  // Tính tổng số lượng món ăn trong giỏ (bỏ qua món quà tặng, gói combo tính theo set)
  const totalItems = items.reduce((sum, item) => {
    if (!item || item.isGift) return sum;
    if (item.buyXGetYPromotionId) {
      const step = Math.max(1, Number(item.promoBuyQuantity) || 1);
      return sum + Math.max(1, Math.round((item.quantity || 0) / step));
    }
    return sum + (item.quantity || 0);
  }, 0);

  // Tính tổng tiền giỏ hàng (tính giá món, giá size tăng thêm và topping đi kèm)
  const totalPrice = items.reduce((sum, item) => {
    if (!item || !item.product) return sum;
    if (item.isGift) return sum;
    if (typeof item.priceAtAdded === 'number') {
      return sum + item.priceAtAdded * item.quantity;
    }
    let itemPrice = item.product.flashSalePrice ?? item.product.price ?? 0;
    if (item.selectedSize) {
      const sizeOpt = item.product.sizes?.find(s => s.sizeName === item.selectedSize);
      if (sizeOpt) {
        itemPrice += sizeOpt.extraPrice;
      }
    }
    if (item.selectedToppings && item.selectedToppings.length > 0) {
      item.selectedToppings.forEach(topName => {
        const topOpt = item.product.toppings?.find(t => t.name === topName || (t as any).toppingName === topName);
        if (topOpt) {
          itemPrice += topOpt.price;
        }
      });
    }
    return sum + itemPrice * item.quantity;
  }, 0);

  /**
   * Thêm món ăn thông thường vào giỏ hàng (hỗ trợ chọn size, topping, ghi chú).
   * @param product - Thông tin sản phẩm
   * @param quantity - Số lượng
   * @param selectedSize - Tùy chọn size đã chọn
   * @param selectedToppings - Danh sách topping đi kèm
   * @param note - Ghi chú cho quán
   */
  const addItem = useCallback(async (
    product: IProductDto, 
    quantity: number = 1,
    selectedSize?: string,
    selectedToppings?: string[],
    note?: string
  ) => {
    let isExisting = false;

    // Cập nhật giao diện lạc quan (Optimistic UI)
    setItems((prev) => {
      const existing = prev.find((item) => 
        item.product.id === product.id &&
        item.selectedSize === selectedSize &&
        JSON.stringify(item.selectedToppings?.sort() || []) === JSON.stringify(selectedToppings?.sort() || [])
      );
      if (existing) {
        isExisting = true;
        return prev.map((item) =>
          item.product.id === product.id &&
          item.selectedSize === selectedSize &&
          JSON.stringify(item.selectedToppings?.sort() || []) === JSON.stringify(selectedToppings?.sort() || [])
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity, selectedSize, selectedToppings, note }];
    });

    setTimeout(() => {
      if (isExisting) {
        toast.success(`Đã cập nhật số lượng: ${product.itemName}`);
      } else {
        toast.success(`Đã thêm vào giỏ: ${product.itemName}`);
      }
    }, 0);

    // Gửi request API và đồng bộ lại từ backend
    try {
      await cartService.addToCart({
        productId: product.id,
        quantity,
        guestUserId: getGuestUserId(),
        selectedSize,
        selectedToppings
      });
      await fetchCart();
    } catch (error: any) {
      toast.error(error.message);
      await fetchCart();
    }
  }, [getGuestUserId, fetchCart]);

  /**
   * Thêm gói ưu đãi khuyến mãi "Mua X Tặng Y" vào giỏ hàng.
   * @param param0.promotionId - Mã chương trình khuyến mãi
   * @param param0.triggerProduct - Món chính mua
   * @param param0.sets - Số lượng set mua
   */
  const addBuyXGetY = useCallback(async ({
    promotionId,
    triggerProduct,
    sets = 1,
  }: {
    promotionId: string;
    triggerProduct: IProductDto;
    sets?: number;
  }) => {
    try {
      await cartService.addToCart({
        productId: triggerProduct.id,
        quantity: Math.max(1, sets),
        guestUserId: getGuestUserId(),
        buyXGetYPromotionId: promotionId,
      });
      await fetchCart();
      toast.success(`Đã thêm khuyến mãi: ${triggerProduct.itemName}`);
    } catch (error: any) {
      toast.error(error?.message || 'Không thêm được khuyến mãi vào giỏ');
      await fetchCart();
    }
  }, [getGuestUserId, fetchCart]);

  /**
   * Xóa một món ăn khỏi giỏ hàng.
   * @param productId - Mã món ăn
   * @param selectedSize - Size
   * @param selectedToppings - Danh sách topping
   */
  const removeItem = useCallback(async (productId: string, selectedSize?: string, selectedToppings?: string[]) => {
    // Xóa lạc quan: nếu là combo KM thì xóa cả món tặng kèm
    setItems((prev) => {
      const target = prev.find((item) =>
        item.product.id === productId &&
        item.selectedSize === selectedSize &&
        JSON.stringify(item.selectedToppings?.sort() || []) === JSON.stringify(selectedToppings?.sort() || [])
      );
      if (target?.buyXGetYPromotionId) {
        const parentId = target.isGift ? target.parentCartItemId : target.id;
        return prev.filter((item) => {
          if (item.buyXGetYPromotionId !== target.buyXGetYPromotionId) return true;
          if (parentId && (item.id === parentId || item.parentCartItemId === parentId)) return false;
          return item.product.id !== productId;
        });
      }
      return prev.filter((item) =>
        !(item.product.id === productId &&
          item.selectedSize === selectedSize &&
          JSON.stringify(item.selectedToppings?.sort() || []) === JSON.stringify(selectedToppings?.sort() || []))
      );
    });

    try {
      await cartService.removeCartItem({
        productId,
        guestUserId: getGuestUserId()
      });
      await fetchCart();
    } catch (error: any) {
      toast.error('Lỗi khi xóa món trên server');
      await fetchCart();
    }
  }, [getGuestUserId, fetchCart]);

  /**
   * Cập nhật số lượng của một món trong giỏ.
   * @param productId - Mã món
   * @param quantity - Số lượng mới
   * @param selectedSize - Tùy chọn size
   * @param selectedToppings - Tùy chọn topping
   */
  const updateQuantity = useCallback(async (
    productId: string, 
    quantity: number,
    selectedSize?: string,
    selectedToppings?: string[]
  ) => {
    if (quantity <= 0) {
      removeItem(productId, selectedSize, selectedToppings);
      return;
    }
    
    // Cập nhật lạc quan
    setItems((prev) =>
      prev.map((item) =>
        item.product.id === productId &&
        item.selectedSize === selectedSize &&
        JSON.stringify(item.selectedToppings?.sort() || []) === JSON.stringify(selectedToppings?.sort() || [])
          ? { ...item, quantity }
          : item
      )
    );

    try {
      await cartService.updateQuantity({
        productId,
        quantity,
        guestUserId: getGuestUserId()
      });
      await fetchCart();
    } catch (error: any) {
      toast.error('Lỗi cập nhật số lượng trên server');
      await fetchCart();
    }
  }, [removeItem, getGuestUserId, fetchCart]);

  /**
   * Xóa sạch toàn bộ các món trong giỏ hàng.
   */
  const clearCart = useCallback(async () => {
    setItems([]);
    try {
      await cartService.clearCart({ guestUserId: getGuestUserId() });
    } catch (error) {
      console.error('Lỗi khi xóa toàn bộ giỏ hàng:', error);
    }
  }, [getGuestUserId]);

  const value = {
    items,
    totalItems,
    totalPrice,
    addItem,
    addBuyXGetY,
    removeItem,
    updateQuantity,
    clearCart,
    refreshCart: fetchCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

/**
 * Hook tùy chỉnh để truy cập CartContext. Báo lỗi nếu gọi ngoài CartProvider.
 */
export function useCartContext(): ICartContext {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCartContext must be used within a CartProvider');
  }
  return context;
}

