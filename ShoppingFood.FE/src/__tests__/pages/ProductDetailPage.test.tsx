import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductDetailPage } from '../../pages/ProductDetailPage';
import { useProducts, useCart } from '../../hooks';
import type { IProductDto } from '../../interfaces';

vi.mock('../../hooks', () => ({
  useProducts: vi.fn(),
  useCart: vi.fn(),
}));

vi.mock('../../components/product/ProductReviews', () => ({
  ProductReviews: () => <div data-testid="product-reviews">Reviews Component</div>,
}));

vi.mock('react-router-dom', () => ({
  useParams: () => ({ id: 'prod-123' }),
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
}));

describe('ProductDetailPage', () => {
  const mockFetchProductById = vi.fn();
  const mockAddItem = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useCart as any).mockReturnValue({
      addItem: mockAddItem,
    });
  });

  it('renders loading state correctly', () => {
    (useProducts as any).mockReturnValue({
      product: null,
      isLoading: true,
      fetchProductById: mockFetchProductById,
    });

    render(<ProductDetailPage />);

    expect(screen.getByText('Đang tải thông tin món ăn...')).toBeInTheDocument();
    expect(mockFetchProductById).toHaveBeenCalledWith('prod-123');
  });

  it('renders not found state correctly when product is null', () => {
    (useProducts as any).mockReturnValue({
      product: null,
      isLoading: false,
      fetchProductById: mockFetchProductById,
    });

    render(<ProductDetailPage />);

    expect(screen.getByText('Không tìm thấy món ăn')).toBeInTheDocument();
    expect(screen.getByText('Món ăn này có thể đã bị xóa hoặc không còn bán.')).toBeInTheDocument();
  });

  it('renders product details and calls addItem on click when in stock', () => {
    const product: IProductDto = {
      id: 'prod-123',
      itemName: 'Bun Cha Ha Noi',
      price: 50000,
      primaryImageUrl: 'buncha.png',
      stockStatus: 'InStock',
      restaurantId: 'rest-1',
      restaurantName: 'Restaurant One',
      availableFrom: '08:00',
      availableTo: '22:00',
      description: 'Món bún chả thơm ngon chuẩn vị',
    } as any;

    (useProducts as any).mockReturnValue({
      product,
      isLoading: false,
      fetchProductById: mockFetchProductById,
    });

    render(<ProductDetailPage />);

    expect(screen.getByText('Bun Cha Ha Noi')).toBeInTheDocument();
    expect(screen.getByText('Restaurant One')).toBeInTheDocument();
    expect(screen.getByText('Món bún chả thơm ngon chuẩn vị')).toBeInTheDocument();
    expect(screen.getByTestId('product-reviews')).toBeInTheDocument();

    const addToCartBtn = screen.getByRole('button', { name: /thêm vào giỏ/i });
    expect(addToCartBtn).not.toBeDisabled();
    fireEvent.click(addToCartBtn);

    expect(mockAddItem).toHaveBeenCalledWith(product, 1);
  });

  it('renders out of stock badge and disables button when out of stock', () => {
    const product: IProductDto = {
      id: 'prod-123',
      itemName: 'Bun Cha Ha Noi',
      price: 50000,
      primaryImageUrl: 'buncha.png',
      stockStatus: 'OutOfStock',
      restaurantId: 'rest-1',
      restaurantName: 'Restaurant One',
    } as any;

    (useProducts as any).mockReturnValue({
      product,
      isLoading: false,
      fetchProductById: mockFetchProductById,
    });

    render(<ProductDetailPage />);

    expect(screen.getAllByText('Hết hàng')).toHaveLength(2); // One on badge, one on button

    const addToCartBtn = screen.getByRole('button', { name: /hết hàng/i });
    expect(addToCartBtn).toBeDisabled();
  });
});
