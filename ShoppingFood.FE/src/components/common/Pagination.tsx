import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize?: number;
  pageSizeOptions?: number[];
  onPageSizeChange?: (size: number) => void;
}

export function Pagination({ 
  currentPage, 
  totalPages, 
  onPageChange,
  pageSize,
  pageSizeOptions,
  onPageSizeChange
}: PaginationProps) {
  if (totalPages <= 1 && (!pageSizeOptions || pageSizeOptions.length === 0)) return null;

  const pages: (number | string)[] = [];

  // Build page numbers with ellipsis
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push('...');
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
      {/* Page Size Selector */}
      {pageSizeOptions && pageSizeOptions.length > 0 && onPageSizeChange && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Hiển thị:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="h-9 px-2 text-sm bg-white border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500/50 cursor-pointer"
          >
            {pageSizeOptions.map(size => (
              <option key={size} value={size}>{size} / trang</option>
            ))}
          </select>
        </div>
      )}

      {/* Page Navigation */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 rounded-lg text-gray-600 hover:text-gray-800 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {pages.map((page, idx) =>
            typeof page === 'string' ? (
              <span key={`ellipsis-${idx}`} className="px-2 text-gray-500">
                ...
              </span>
            ) : (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`
                  min-w-[36px] h-9 rounded-lg text-sm font-medium transition-all duration-200
                  ${
                    page === currentPage
                      ? 'bg-orange-500 text-gray-900 shadow-lg shadow-orange-500/25'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                  }
                `}
              >
                {page}
              </button>
            )
          )}

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg text-gray-600 hover:text-gray-800 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
