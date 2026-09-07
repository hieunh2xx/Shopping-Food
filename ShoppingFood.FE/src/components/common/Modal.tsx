import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  closeOnBackdrop?: boolean;
  /** Mặc định 10000; modal lồng (vd chat trên chi tiết đơn) nên cao hơn */
  zIndexClass?: string;
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
};

/**
 * Thành phần Cửa sổ Modal Popup dùng chung (Modal).
 * Hiển thị qua React Portal vào document.body, hỗ trợ đóng khi nhấn phím Escape hoặc click nền đen (backdrop).
 * @param props - Thuộc tính cấu hình Modal
 */
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  closeOnBackdrop = true,
  zIndexClass = 'z-[10000]',
}: ModalProps) {
  // Lắng nghe phím Escape để đóng modal và khóa cuộn trang
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className={`fixed inset-0 ${zIndexClass} flex items-center justify-center p-4`}>
      {/* Nền mờ Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={closeOnBackdrop ? onClose : undefined}
      />

      {/* Nội dung Modal */}
      <div
        className={`
          relative w-full ${sizeClasses[size]}
          bg-white border border-gray-200 rounded-2xl shadow-2xl
          animate-in zoom-in-95 fade-in duration-200
        `}
      >
        {/* Tiêu đề Header */}
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Thân Body */}
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>,
    document.body
  );
}
