import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CarouselSliderProps {
  children: React.ReactNode;
  className?: string;
  itemWidth?: string; // Tùy chọn: chiều rộng từng phần tử, vd: 'w-[160px]'
  autoPlay?: boolean;
  autoPlayInterval?: number;
}

/**
 * Thanh Cuộn Trượt Ngang Băng Chuyền (CarouselSlider).
 * Hỗ trợ:
 * - Nút bấm mũi tên điều hướng Trái / Phải tự động ẩn/hiện khi đạt đầu hoặc cuối danh sách
 * - Tự động trượt (AutoPlay) có thể cấu hình chu kỳ lặp lại
 * - Chế độ Snap cuộn mượt mà trên cả máy tính và thiết bị di động.
 */
export function CarouselSlider({ children, className = '', itemWidth, autoPlay = false, autoPlayInterval = 4000 }: CarouselSliderProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  /**
   * Kiểm tra vị trí thanh cuộn để ẩn/hiện các nút mũi tên điều hướng.
   */
  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [children]);

  // Xử lý tự động cuộn (AutoPlay)
  useEffect(() => {
    if (!autoPlay || React.Children.count(children) <= 1) return;
    
    let direction = 'right';
    
    const intervalId = setInterval(() => {
      if (!scrollRef.current) return;
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      
      if (direction === 'right' && scrollLeft >= scrollWidth - clientWidth - 5) {
        direction = 'left';
      } else if (direction === 'left' && scrollLeft <= 5) {
        direction = 'right';
      }

      const scrollAmount = direction === 'left' ? -(clientWidth * 0.8) : clientWidth * 0.8;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      
    }, autoPlayInterval);

    return () => clearInterval(intervalId);
  }, [autoPlay, autoPlayInterval, children]);

  /**
   * Thực hiện cuộn sang trái hoặc sang phải theo 80% chiều rộng khung nhìn.
   * @param direction - Hướng cuộn ('left' hoặc 'right')
   */
  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { clientWidth } = scrollRef.current;
      const scrollAmount = direction === 'left' ? -(clientWidth * 0.8) : clientWidth * 0.8;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };


  return (
    <div className={`relative group ${className}`}>
      {showLeftArrow && (
        <button
          onClick={() => scroll('left')}
          className="absolute -left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-orange-500 hover:scale-110 transition-all opacity-0 group-hover:opacity-100"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}
      
      <div 
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory py-2 -mx-2"
      >
        {React.Children.map(children, (child) => (
          <div className={`shrink-0 snap-start px-2 ${itemWidth || 'w-[160px] md:w-[180px] lg:w-[200px]'}`}>
            {child}
          </div>
        ))}
      </div>

      {showRightArrow && (
        <button
          onClick={() => scroll('right')}
          className="absolute -right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-orange-500 hover:scale-110 transition-all opacity-0 group-hover:opacity-100"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}
