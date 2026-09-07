import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hoverable?: boolean;
  onClick?: () => void;
}

/**
 * Thành phần Thẻ bao bọc nội dung (Card).
 * Có hiệu ứng kính mờ (backdrop-blur), viền mỏng và hiệu ứng hover bóng đổ/nâng thẻ nhẹ.
 * @param props - Thuộc tính cấu hình Card
 */
export function Card({ children, className = '', hoverable = false, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        bg-white/50 backdrop-blur-sm border border-gray-200/50 rounded-2xl overflow-hidden
        transition-all duration-300 ease-out
        ${hoverable ? 'hover:border-gray-300 hover:shadow-xl hover:shadow-black/20 hover:-translate-y-1 cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
