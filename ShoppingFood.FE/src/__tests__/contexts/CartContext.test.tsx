import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { CartProvider, useCartContext } from '../../contexts/CartContext';
import type { IProductDto } from '../../interfaces';

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('CartContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should initialize empty or with mock data and add items', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <CartProvider>{children}</CartProvider>
    );

    const { result } = renderHook(() => useCartContext(), { wrapper });

    // Since mock data is injected in useEffect, let's test adding a new product
    const product: IProductDto = {
      id: 'prod-999',
      restaurantId: 'rest-1',
      restaurantName: 'Test Rest',
      itemName: 'Nước mía siêu sạch',
      price: 10000,
      primaryImageUrl: 'sugar.jpg',
      status: 'Approved',
      isFreeship: false,
    } as any;

    act(() => {
      result.current.addItem(product, 2);
    });

    // Check it is added
    const item = result.current.items.find(i => i.product.id === 'prod-999');
    expect(item).toBeDefined();
    expect(item!.quantity).toBe(2);
  });

  it('should remove items correctly', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <CartProvider>{children}</CartProvider>
    );

    const { result } = renderHook(() => useCartContext(), { wrapper });

    act(() => {
      result.current.removeItem('mock-1');
    });

    const item = result.current.items.find(i => i.product.id === 'mock-1');
    expect(item).toBeUndefined();
  });

  it('should update quantity correctly', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <CartProvider>{children}</CartProvider>
    );

    const { result } = renderHook(() => useCartContext(), { wrapper });

    act(() => {
      result.current.updateQuantity('mock-1', 5);
    });

    const item = result.current.items.find(i => i.product.id === 'mock-1');
    expect(item!.quantity).toBe(5);
  });
});
