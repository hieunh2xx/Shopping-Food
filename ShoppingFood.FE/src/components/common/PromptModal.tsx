import { useState, useEffect, useRef, type FormEvent } from 'react';
import { Modal, Button } from './index';

interface PromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (value: string) => void;
  title: string;
  description?: string;
  placeholder?: string;
  confirmLabel?: string;
  confirmVariant?: 'primary' | 'danger' | 'warning' | 'success';
  isLoading?: boolean;
}

export function PromptModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  placeholder = 'Nhập nội dung...',
  confirmLabel = 'Xác nhận',
  confirmVariant = 'primary',
  isLoading = false,
}: PromptModalProps) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      setValue('');
      // Delay focus slightly to ensure modal is fully rendered
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    onConfirm(value.trim());
  };

  const getConfirmButtonClasses = () => {
    switch (confirmVariant) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white';
      case 'warning':
        return 'bg-orange-500 hover:bg-orange-600 text-white';
      case 'success':
        return 'bg-green-600 hover:bg-green-700 text-white';
      default:
        return 'bg-orange-500 hover:bg-orange-600 text-white'; // default to primary
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <form onSubmit={handleSubmit} className="p-6">
        {description && <p className="text-gray-600 mb-4 text-sm">{description}</p>}
        <textarea
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 min-h-[100px] resize-y"
          disabled={isLoading}
        />
        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Hủy
          </Button>
          <Button 
             type="submit" 
             disabled={!value.trim() || isLoading} 
             isLoading={isLoading}
             className={getConfirmButtonClasses()}
          >
            {confirmLabel}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
