import { useEffect, useState } from 'react';
import { Search, SlidersHorizontal, MapPin } from 'lucide-react';
import { useProducts, useCategories } from '../hooks';
import { ProductList } from '../components/product/ProductList';
import { Button } from '../components/common';
import type { ISearchProductQuery } from '../interfaces';

export function ProductsPage() {
  const { products, isLoading, searchProducts } = useProducts();
  const { categories, fetchCategories } = useCategories();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<ISearchProductQuery>({
    skip: 0,
    take: 20,
  });

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    searchProducts(searchQuery);
  }, [searchQuery, searchProducts]);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setSearchQuery((prev) => ({
      ...prev,
      filter: formData.get('keyword') as string,
      skip: 0,
    }));
  };

  const handleCategoryChange = (categoryId: string) => {
    setActiveCategory(categoryId);
    const cat = categories.find(c => c.id === categoryId);
    setSearchQuery((prev) => ({
      ...prev,
      filter: categoryId === 'all' ? undefined : cat?.title,
      skip: 0,
    }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Search Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Khám phá thực đơn</h1>
        
        <div className="bg-white border border-gray-200 p-4 rounded-2xl shadow-sm">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="text"
                name="keyword"
                placeholder="Bạn muốn ăn gì hôm nay?"
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 focus:bg-white transition-all"
              />
            </div>
            
            <div className="sm:w-48 relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <MapPin className="w-5 h-5 text-gray-400" />
              </div>
              <select className="w-full pl-11 pr-8 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 focus:bg-white appearance-none cursor-pointer">
                <option value="">Khu vực</option>
                <option value="1">Quận 1</option>
                <option value="3">Quận 3</option>
              </select>
            </div>

            <Button type="button" variant="secondary" className="px-4 border-gray-200 text-gray-700 hover:bg-gray-50">
              <SlidersHorizontal className="w-5 h-5 mr-2" />
              Lọc
            </Button>

            <Button type="submit" className="px-8 shadow-lg shadow-orange-500/25">
              Tìm kiếm
            </Button>
          </form>
        </div>
      </div>

      {/* Categories */}
      <div className="mb-8 overflow-x-auto pb-4 hide-scrollbar">
        <div className="flex gap-3">
          <button
            onClick={() => handleCategoryChange('all')}
            className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              activeCategory === 'all'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-500/20'
                : 'bg-white border border-gray-200 text-gray-700 hover:border-orange-400 hover:text-orange-600'
            }`}
          >
            Tất cả món
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeCategory === cat.id
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-500/20'
                  : 'bg-white border border-gray-200 text-gray-700 hover:border-orange-400 hover:text-orange-600'
              }`}
            >
              {cat.title}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <ProductList 
        products={products} 
        isLoading={isLoading} 
        emptyMessage="Không tìm thấy món ăn nào phù hợp với tìm kiếm của bạn."
      />
    </div>
  );
}
