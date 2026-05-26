import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProducts } from '../hooks';
import { ProductList } from '../components/product/ProductList';
import { ProductSearch } from '../components/product/ProductSearch';
import { Pagination } from '../components/common';

const PAGE_SIZE = 12;

export function ProductsPage() {
  const [searchParams] = useSearchParams();
  const { products, total, isLoading, fetchProducts, searchProducts } = useProducts();
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const loadProducts = useCallback((page: number, keyword?: string) => {
    const skip = (page - 1) * PAGE_SIZE;
    if (keyword) {
      searchProducts({ keyword, skip, take: PAGE_SIZE });
    } else {
      fetchProducts({ skip, take: PAGE_SIZE });
    }
  }, [fetchProducts, searchProducts]);

  useEffect(() => {
    const q = searchParams.get('search') || '';
    loadProducts(1, q);
  }, [searchParams, loadProducts]);

  const handleSearch = (query: string) => {
    setCurrentPage(1);
    loadProducts(1, query);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadProducts(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Thực đơn</h1>
        <p className="text-gray-500">Khám Phá {total > 0 ? `${total} ` : ''}món Ăn Từ Các Nhà Hàng Hàng Đầu</p>
      </div>
      <div className="mb-8">
        <ProductSearch onSearch={handleSearch} />
      </div>
      <ProductList products={products} isLoading={isLoading} />
      {totalPages > 1 && (
        <div className="mt-10">
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
        </div>
      )}
    </div>
  );
}
