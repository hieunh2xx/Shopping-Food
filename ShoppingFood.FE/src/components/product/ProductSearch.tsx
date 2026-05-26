import { useState, type FormEvent } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';

interface ProductSearchProps {
  onSearch: (query: string) => void;
  onFilterChange?: (filters: SearchFilters) => void;
}

interface SearchFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
}

export function ProductSearch({ onSearch, onFilterChange }: ProductSearchProps) {
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  const handleFilterApply = () => {
    onFilterChange?.(filters);
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    setFilters({});
    onFilterChange?.({});
    setShowFilters(false);
  };

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="TÃ¬m kiáº¿m mÃ³n Äƒn..."
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-gray-100/50 border border-gray-300/50 text-sm text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30 transition-all"
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); onSearch(''); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={`px-4 rounded-xl border transition-all ${
            showFilters
              ? 'bg-orange-500/10 border-orange-500/30 text-orange-400'
              : 'bg-gray-100/50 border-gray-300/50 text-gray-600 hover:text-gray-800'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </form>

      {/* Filters panel */}
      {showFilters && (
        <div className="p-4 rounded-xl bg-gray-100/30 border border-gray-300/30 space-y-4 animate-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Danh má»¥c</label>
              <input
                type="text"
                value={filters.category || ''}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                placeholder="Táº¥t cáº£"
                className="w-full px-3 py-2 rounded-lg bg-gray-100/50 border border-gray-300/50 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">GiÃ¡ tá»«</label>
              <input
                type="number"
                value={filters.minPrice || ''}
                onChange={(e) => setFilters({ ...filters, minPrice: Number(e.target.value) || undefined })}
                placeholder="0Ä‘"
                className="w-full px-3 py-2 rounded-lg bg-gray-100/50 border border-gray-300/50 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">GiÃ¡ Ä‘áº¿n</label>
              <input
                type="number"
                value={filters.maxPrice || ''}
                onChange={(e) => setFilters({ ...filters, maxPrice: Number(e.target.value) || undefined })}
                placeholder="KhÃ´ng giá»›i háº¡n"
                className="w-full px-3 py-2 rounded-lg bg-gray-100/50 border border-gray-300/50 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-200/50 transition-colors"
            >
              XÃ³a bá»™ lá»c
            </button>
            <button
              onClick={handleFilterApply}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-orange-500 text-gray-900 hover:bg-orange-600 transition-colors"
            >
              Ãp dá»¥ng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
