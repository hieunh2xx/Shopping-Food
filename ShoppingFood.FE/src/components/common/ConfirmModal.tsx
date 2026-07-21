import { Modal, Button } from './index';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: 'primary' | 'danger' | 'warning' | 'success';
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
  confirmVariant = 'primary',
  isLoading = false,
}: ConfirmModalProps) {
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
      <div className="p-6">
        {description && <p className="text-gray-600 mb-6 text-sm">{description}</p>}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button 
             type="button" 
             onClick={onConfirm}
             disabled={isLoading} 
             isLoading={isLoading}
             className={getConfirmButtonClasses()}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
