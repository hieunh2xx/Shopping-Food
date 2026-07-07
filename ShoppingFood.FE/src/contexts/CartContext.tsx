import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { ICartContext, ICartItem, IProductDto } from '../interfaces';
import toast from 'react-hot-toast';
import { cartService } from '../services/CartService';
import { useAuth } from '../hooks/useAuth';

const GUEST_ID_KEY = 'sf_guest_id';
const CART_STORAGE_KEY = 'sf_cart'; // Keep for fallback/optimistic

const CartContext = createContext<ICartContext | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<ICartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      // Filter out corrupted items to prevent crashes
      return Array.isArray(parsed) ? parsed.filter(item => item && item.product && item.product.id) : [];
    } catch {
      return [];
    }
  });

  // Get or create guest user ID
  const getGuestUserId = useCallback(() => {
    if (isAuthenticated) return undefined;
    let guestId = localStorage.getItem(GUEST_ID_KEY);
    if (!guestId) {
      guestId = crypto.randomUUID();
      localStorage.setItem(GUEST_ID_KEY, guestId);
    }
    return guestId;
  }, [isAuthenticated]);

  // Sync cart state to localStorage for optimistic persistence
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  // Fetch cart from backend on mount or auth change
  useEffect(() => {
    const fetchCart = async () => {
      try {
        const guestUserId = getGuestUserId();
        const res = await cartService.getCart(guestUserId);
        if (!res.error && res.data) {
          // Assuming backend returns an array of cart items mapping to ICartItem
          // If backend data structure is different, it needs mapping here.
          // For now, if the backend returns nothing but we have local items, we might need to sync them up,
          // but let's just use backend as source of truth if it has data.
          let apiItems: any[] = [];
          if (Array.isArray(res.data)) {
            apiItems = res.data;
          } else if (res.data.items && Array.isArray(res.data.items)) {
            apiItems = res.data.items;
          }

          const mappedItems: ICartItem[] = apiItems.map((apiItem: any) => {
            // Check if it's already an ICartItem (from optimistic localstorage sync matching backend shape)
            if (apiItem.product && apiItem.product.id) return apiItem as ICartItem;
            
            return {
              quantity: apiItem.quantity,
              isProductDeleted: apiItem.isProductDeleted,
              product: {
                id: apiItem.productId,
                itemName: apiItem.productName || 'Sản phẩm',
                price: apiItem.priceAtAdded || 0,
                primaryImageUrl: apiItem.productImageUrl,
                // Default mock properties for IProductDto to satisfy UI
                restaurantId: apiItem.restaurantId || '',
                restaurantName: apiItem.restaurantName || '',
                description: null,
                categoryId: '',
                categoryName: '',
                stockStatus: 'InStock',
                images: [],
                toppings: [],
                sizes: [],
                createdAt: new Date().toISOString(),
                isHidden: false,
                averageRating: 0,
                reviewCount: 0,
                isFreeship: false,
                availableFrom: null,
                availableTo: null,
                isAvailableNow: true
              } as IProductDto
            };
          });

          setItems(mappedItems);
        }
      } catch (error) {
        console.error('Failed to fetch cart', error);
      }
    };
    fetchCart();
  }, [isAuthenticated, getGuestUserId]);

  const totalItems = items.reduce((sum, item) => sum + (item?.quantity || 0), 0);
  const totalPrice = items.reduce((sum, item) => {
    if (!item || !item.product) return sum;
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

  const addItem = useCallback(async (
    product: IProductDto, 
    quantity: number = 1,
    selectedSize?: string,
    selectedToppings?: string[],
    note?: string
  ) => {
    let isExisting = false;

    // Optimistic update
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

    // Timeout prevents React batching issues with the ref flag
    setTimeout(() => {
      if (isExisting) {
        toast.success(`Đã cập nhật số lượng: ${product.itemName}`);
      } else {
        toast.success(`Đã thêm vào giỏ: ${product.itemName}`);
      }
    }, 0);

    // API call
    try {
      await cartService.addToCart({
        productId: product.id,
        quantity,
        guestUserId: getGuestUserId(),
        // Might need other fields if API supports them (size, toppings)
      });
    } catch (error: any) {
      toast.error(error.message || 'Lỗi khi thêm vào giỏ hàng trên server');
      // Ideally rollback on failure
    }
  }, [getGuestUserId]);

  const removeItem = useCallback(async (productId: string, selectedSize?: string, selectedToppings?: string[]) => {
    // Optimistic update
    setItems((prev) => prev.filter((item) => 
      !(item.product.id === productId &&
        item.selectedSize === selectedSize &&
        JSON.stringify(item.selectedToppings?.sort() || []) === JSON.stringify(selectedToppings?.sort() || []))
    ));

    // API call
    try {
      await cartService.removeCartItem({
        productId,
        guestUserId: getGuestUserId()
      });
    } catch (error: any) {
      toast.error('Lỗi khi xóa món trên server');
    }
  }, [getGuestUserId]);

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
    
    // Optimistic update
    setItems((prev) =>
      prev.map((item) =>
        item.product.id === productId &&
        item.selectedSize === selectedSize &&
        JSON.stringify(item.selectedToppings?.sort() || []) === JSON.stringify(selectedToppings?.sort() || [])
          ? { ...item, quantity }
          : item
      )
    );

    // API call
    try {
      await cartService.updateQuantity({
        productId,
        quantity,
        guestUserId: getGuestUserId()
      });
    } catch (error: any) {
      toast.error('Lỗi cập nhật số lượng trên server');
    }
  }, [removeItem, getGuestUserId]);

  const clearCart = useCallback(async () => {
    setItems([]);
    try {
      await cartService.clearCart({ guestUserId: getGuestUserId() });
    } catch (error) {
      console.error('Lỗi khi xóa toàn bộ giỏ hàng', error);
    }
  }, [getGuestUserId]);

  const value = {
    items,
    totalItems,
    totalPrice,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCartContext(): ICartContext {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCartContext must be used within a CartProvider');
  }
  return context;
}

