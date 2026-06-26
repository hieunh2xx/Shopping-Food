import { Search, SlidersHorizontal, MapPin } from 'lucide-react';
import type { ISearchProductQuery } from '../../interfaces';
import { Button } from '../common';

interface ProductSearchProps {
  onSearch: (query: ISearchProductQuery) => void;
}

export function ProductSearch({ onSearch }: ProductSearchProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    onSearch({
      filter: formData.get('keyword') as string,
    });
  };

  return (
    <div className="bg-white border border-gray-200 p-4 rounded-2xl shadow-sm mb-8">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
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

        {/* Location Dropdown - Mock */}
        <div className="sm:w-48 relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <MapPin className="w-5 h-5 text-gray-400" />
          </div>
          <select className="w-full pl-11 pr-8 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 focus:bg-white appearance-none cursor-pointer transition-all">
            <option value="">Khu vực</option>
            <option value="1">Quận 1</option>
            <option value="2">Quận 3</option>
            <option value="10">Quận 10</option>
          </select>
        </div>

        {/* Filter Button */}
        <Button
          type="button"
          variant="outline"
          className="px-4 border-gray-200 text-gray-700 hover:bg-gray-50"
        >
          <SlidersHorizontal className="w-5 h-5 mr-2" />
          Lọc
        </Button>

        <Button type="submit" className="px-8 shadow-lg shadow-orange-500/25">
          Tìm kiếm
        </Button>
      </form>
    </div>
  );
}
