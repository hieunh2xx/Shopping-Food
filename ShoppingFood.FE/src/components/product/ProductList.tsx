import { ProductCard } from './ProductCard';
import { Loading } from '../common';
import type { IProductDto } from '../../interfaces';

interface ProductListProps {
  products: IProductDto[];
  isLoading: boolean;
  emptyMessage?: string;
}

export function ProductList({ products, isLoading, emptyMessage = 'KhÃ´ng tÃ¬m tháº¥y sáº£n pháº©m nÃ o' }: ProductListProps) {
  if (isLoading) {
    return <Loading text="Äang táº£i sáº£n pháº©m..." />;
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-20 h-20 rounded-2xl bg-gray-100/50 flex items-center justify-center mb-4">
          <span className="text-4xl">ðŸ”</span>
        </div>
        <p className="text-gray-600 text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
