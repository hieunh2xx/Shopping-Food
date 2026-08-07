import type { IProductDto } from './IProduct';

/**
 * Cart item — product + quantity + selected options
 */
export interface ICartItem {
  product: IProductDto;
  quantity: number;
  selectedSize?: string;
  selectedToppings?: string[];
  note?: string;
  isProductDeleted?: boolean;
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
  removeItem: (productId: string, selectedSize?: string, selectedToppings?: string[]) => void;
  updateQuantity: (productId: string, quantity: number, selectedSize?: string, selectedToppings?: string[]) => void;
  clearCart: () => void;
  refreshCart: () => Promise<void>;
}

export interface IAddToCartRequest {
  productId: string;
  quantity: number;
  guestUserId?: string;
  clearCartIfConflict?: boolean;
  selectedSize?: string;
  selectedToppings?: string[];
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
