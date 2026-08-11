import type { IProductDto } from './IProduct';

/**
 * Cart item — product + quantity + selected options
 */
export interface ICartItem {
  id?: string;
  product: IProductDto;
  quantity: number;
  selectedSize?: string;
  selectedToppings?: string[];
  note?: string;
  isProductDeleted?: boolean;
  /** Giá đã chốt từ BE (món tặng = 0). */
  priceAtAdded?: number;
  isGift?: boolean;
  buyXGetYPromotionId?: string;
  parentCartItemId?: string;
  promotionLabel?: string;
  promoBuyQuantity?: number;
  promoGiftQuantity?: number;
}

/**
 * Cart state
 */
export interface ICartState {
  items: ICartItem[];
  totalItems: number;
  totalPrice: number;
}

/**
 * Cart context value
 */
export interface ICartContext extends ICartState {
  addItem: (product: IProductDto, quantity?: number, selectedSize?: string, selectedToppings?: string[], note?: string) => void;
  addBuyXGetY: (params: { promotionId: string; triggerProduct: IProductDto; sets?: number }) => Promise<void>;
  removeItem: (productId: string, selectedSize?: string, selectedToppings?: string[]) => void;
  updateQuantity: (productId: string, quantity: number, selectedSize?: string, selectedToppings?: string[]) => void;
  clearCart: () => void;
  refreshCart: () => Promise<ICartItem[] | null>;
}

export interface IAddToCartRequest {
  productId: string;
  quantity: number;
  guestUserId?: string;
  clearCartIfConflict?: boolean;
  selectedSize?: string;
  selectedToppings?: string[];
  buyXGetYPromotionId?: string;
}

export interface IUpdateCartItemQuantityRequest {
  productId: string;
  quantity: number;
  guestUserId?: string;
}

export interface IRemoveCartItemParams {
  productId: string;
  guestUserId?: string;
}

export interface IClearCartParams {
  guestUserId?: string;
}
