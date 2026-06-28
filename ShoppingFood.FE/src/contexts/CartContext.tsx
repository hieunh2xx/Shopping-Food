import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { ICartContext, ICartItem, IProductDto } from '../interfaces';
import toast from 'react-hot-toast';

const CART_STORAGE_KEY = 'sf_cart';

const CartContext = createContext<ICartContext | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ICartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Inject mock data if empty (for testing)
  useEffect(() => {
    if (items.length === 0) {
      setItems([
        {
          product: {
            id: 'mock-1',
            restaurantId: 'rest-1',
            restaurantName: 'Cơm Tấm Phúc Lộc Thọ',
            itemName: 'Cơm tấm sườn bì chả đặc biệt với trứng ốp la lòng đào',
            price: 55000,
            primaryImageUrl: 'https://images.unsplash.com/photo-1626804475297-4160aae059fe?w=500&q=80',
          },
          quantity: 2
        },
        {
          product: {
            id: 'mock-2',
            restaurantId: 'rest-1',
            restaurantName: 'Cơm Tấm Phúc Lộc Thọ',
            itemName: 'Canh rong biển đậu hũ',
            price: 15000,
            primaryImageUrl: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=500&q=80',
          },
          quantity: 1
        },
        {
          product: {
            id: 'mock-3',
            restaurantId: 'rest-2',
            restaurantName: 'Phê La - Cà Phê Đặc Sản',
            itemName: 'Ô Long Sữa Phê La size L',
            price: 65000,
            primaryImageUrl: 'https://images.unsplash.com/photo-1558160074-4d7d8bdf4256?w=500&q=80',
          },
          quantity: 3
        }
      ] as any);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => {
    let itemPrice = item.product.price;
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

  const addItem = useCallback((
    product: IProductDto, 
    quantity: number = 1,
    selectedSize?: string,
    selectedToppings?: string[],
    note?: string
  ) => {
    setItems((prev) => {
      const existing = prev.find((item) => 
        item.product.id === product.id &&
        item.selectedSize === selectedSize &&
        JSON.stringify(item.selectedToppings?.sort() || []) === JSON.stringify(selectedToppings?.sort() || [])
      );
      if (existing) {
        toast.success(`Đã cập nhật số lượng: ${product.itemName}`);
        return prev.map((item) =>
          item.product.id === product.id &&
          item.selectedSize === selectedSize &&
          JSON.stringify(item.selectedToppings?.sort() || []) === JSON.stringify(selectedToppings?.sort() || [])
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      toast.success(`Đã thêm vào giỏ: ${product.itemName}`);
      return [...prev, { product, quantity, selectedSize, selectedToppings, note }];
    });
  }, []);

  const removeItem = useCallback((productId: string, selectedSize?: string, selectedToppings?: string[]) => {
    setItems((prev) => prev.filter((item) => 
      !(item.product.id === productId &&
        item.selectedSize === selectedSize &&
        JSON.stringify(item.selectedToppings?.sort() || []) === JSON.stringify(selectedToppings?.sort() || []))
    ));
  }, []);

  const updateQuantity = useCallback((
    productId: string, 
    quantity: number,
    selectedSize?: string,
    selectedToppings?: string[]
  ) => {
    if (quantity <= 0) {
      removeItem(productId, selectedSize, selectedToppings);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.product.id === productId &&
        item.selectedSize === selectedSize &&
        JSON.stringify(item.selectedToppings?.sort() || []) === JSON.stringify(selectedToppings?.sort() || [])
          ? { ...item, quantity }
          : item
      )
    );
  }, [removeItem]);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

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
