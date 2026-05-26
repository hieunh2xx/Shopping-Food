import { ProductCard } from './ProductCard';
import { Loading } from '../common';
import type { IProductDto } from '../../interfaces';

interface ProductListProps {
  products: IProductDto[];
  isLoading: boolean;
  emptyMessage?: string;
}

export function ProductList({ products, isLoading, emptyMessage = 'Không có sản phẩm nào.' }: ProductListProps) {
  if (isLoading) {
    return (
      <div className="py-20 flex justify-center">
        <Loading size="lg" text="Đang tải món ngon..." />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="py-20 text-center">
        <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <span className="text-3xl text-gray-400">🔍</span>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">Trống</h3>
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
