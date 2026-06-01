import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductCard } from '../../../components/product/ProductCard';
import { useCart } from '../../../hooks';
import { useNavigate } from 'react-router-dom';
import type { IProductDto } from '../../../interfaces';

vi.mock('../../../hooks', () => ({
  useCart: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
}));

describe('ProductCard', () => {
  const mockProduct: IProductDto = {
    id: 'prod-123',
    restaurantId: 'rest-1',
    restaurantName: 'Com Tam Cali',
    itemName: 'Com suon nuong',
    price: 45000,
    primaryImageUrl: 'suon.jpg',
    status: 'Approved',
    stockStatus: 'InStock',
    isFreeship: true,
  } as any;

  const mockAddItem = vi.fn();
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useCart as any).mockReturnValue({
      addItem: mockAddItem,
    });
    (useNavigate as any).mockReturnValue(mockNavigate);
  });

  it('renders product details correctly', () => {
    render(<ProductCard product={mockProduct} />);

    expect(screen.getByText('Com suon nuong')).toBeInTheDocument();
    expect(screen.getByText('Com Tam Cali')).toBeInTheDocument();
    expect(screen.getByText('Thêm vào giỏ')).toBeInTheDocument();
  });

  it('calls addItem when Add to Cart is clicked', () => {
    render(<ProductCard product={mockProduct} />);

    const addButton = screen.getByText('Thêm vào giỏ');
    fireEvent.click(addButton);

    expect(mockAddItem).toHaveBeenCalledWith(mockProduct, 1);
  });

  it('navigates to product detail on click', () => {
    render(<ProductCard product={mockProduct} />);

    // Click the card wrapper (the heading or container)
    const title = screen.getByText('Com suon nuong');
    fireEvent.click(title);

    expect(mockNavigate).toHaveBeenCalledWith('/products/prod-123');
  });
});
