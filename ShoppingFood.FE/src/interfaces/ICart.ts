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
}
