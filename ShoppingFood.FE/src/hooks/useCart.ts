import { useCartContext } from '../contexts/CartContext';

/**
 * Hook tùy chỉnh thuận tiện để sử dụng CartContext (useCart).
 * Cung cấp danh sách món trong giỏ, tổng tiền, số lượng và các hành động giỏ hàng.
 */
export function useCart() {
  const context = useCartContext();
  return context;
}

