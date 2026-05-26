import { useCartContext } from '../contexts/CartContext';

export function useCart() {
  const context = useCartContext();
  return context;
}
